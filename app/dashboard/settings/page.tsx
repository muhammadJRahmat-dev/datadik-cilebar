'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings, 
  Image as ImageIcon,
  Loader2,
  Save,
  Globe,
  Palette,
  Mail, 
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  School
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [orgData, setOrgData] = useState({
    name: '',
    type: 'sekolah',
    logo_url: '',
    favicon_url: '',
    address: '',
    theme_color: '#2563eb',
    email: '',
    whatsapp: '',
    email_verified_at: null,
    whatsapp_verified_at: null
  });
  const [showVerifyModal, setShowVerifyModal] = useState<{type: 'email' | 'whatsapp', target: string} | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function getData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const npsn = session.user.user_metadata?.npsn || session.user.email?.split('@')[0];

      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug, type, logo_url, favicon_url, address, theme_color, email, whatsapp, email_verified_at, whatsapp_verified_at, school_data(npsn)')
        .eq('school_data.npsn', npsn)
        .single();

      if (org) {
        setSchoolInfo(org);
        setOrgData({
          name: org.name || '',
          type: org.type || 'sekolah',
          logo_url: org.logo_url || '',
          favicon_url: org.favicon_url || '',
          address: org.address || '',
          theme_color: org.theme_color || '#2563eb',
          email: org.email || '',
          whatsapp: org.whatsapp || '',
          email_verified_at: org.email_verified_at,
          whatsapp_verified_at: org.whatsapp_verified_at
        });
      }
      setLoading(false);
    }
    getData();
  }, [router]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      // Otomatis set favicon dari logo
      setOrgData({ ...orgData, logo_url: publicUrl, favicon_url: publicUrl });
      showToast('Logo berhasil diunggah');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Gagal mengunggah logo', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgData.name,
          type: orgData.type,
          logo_url: orgData.logo_url,
          favicon_url: orgData.favicon_url,
          address: orgData.address,
          theme_color: orgData.theme_color,
          email: orgData.email,
          whatsapp: orgData.whatsapp
        })
        .eq('id', schoolInfo.id);

      if (error) throw error;
      showToast('Pengaturan berhasil disimpan');
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast('Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleSendOTP = async (type: 'email' | 'whatsapp') => {
    const target = type === 'email' ? orgData.email : orgData.whatsapp;
    if (!target) {
      showToast(`Silakan isi ${type} terlebih dahulu`, 'error');
      return;
    }

    setIsVerifying(true);
    try {
      // Generate code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

      // Save to database
      const { error } = await supabase
        .from('verification_codes')
        .insert({
          org_id: schoolInfo.id,
          type,
          target,
          code,
          expires_at: expiresAt
        });

      if (error) throw error;

      // Simulation of sending
      console.warn(`[SIMULATION] Sending OTP ${code} to ${target} via ${type}`);
      showToast(`Kode OTP berhasil dikirim ke ${type}`);
      setShowVerifyModal({ type, target });
    } catch (err) {
      console.error('Error sending OTP:', err);
      showToast('Gagal mengirim kode OTP', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || !showVerifyModal) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('org_id', schoolInfo.id)
        .eq('type', showVerifyModal.type)
        .eq('code', otpCode)
        .gt('expires_at', new Date().toISOString())
        .is('verified_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        showToast('Kode OTP salah atau sudah kadaluwarsa', 'error');
        return;
      }

      // Mark code as verified
      await supabase
        .from('verification_codes')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', data.id);

      // Update organization status
      const updateData: any = {};
      if (showVerifyModal.type === 'email') {
        updateData.email_verified_at = new Date().toISOString();
      } else {
        updateData.whatsapp_verified_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', schoolInfo.id);

      if (updateError) throw updateError;

      setOrgData({ ...orgData, ...updateData });
      showToast(`${showVerifyModal.type === 'email' ? 'Email' : 'WhatsApp'} berhasil diverifikasi!`);
      setShowVerifyModal(null);
      setOtpCode('');
    } catch (err) {
      console.error('Error verifying OTP:', err);
      showToast('Gagal memverifikasi OTP', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push('/dashboard')}
                className="rounded-full bg-white shadow-sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pengaturan</h1>
                <p className="text-slate-500 font-medium">Kelola identitas dan tampilan dashboard Anda</p>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="rounded-2xl px-8 py-6 h-auto font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Simpan Perubahan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-black tracking-tight text-slate-900">Identitas Sekolah</CardTitle>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">Informasi dasar instansi Anda</p>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Sekolah</label>
                      <input 
                        type="text"
                        className="w-full p-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all"
                        value={orgData.name}
                        onChange={(e) => setOrgData({...orgData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tipe Instansi</label>
                      <select 
                        className="w-full p-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all appearance-none"
                        value={orgData.type}
                        onChange={(e) => setOrgData({...orgData, type: e.target.value})}
                      >
                        <option value="sekolah">Sekolah</option>
                        <option value="dinas">Dinas</option>
                        <option value="umum">Umum</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Alamat Lengkap</label>
                    <textarea 
                      className="w-full min-h-24 p-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all resize-none"
                      value={orgData.address}
                      onChange={(e) => setOrgData({...orgData, address: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email Sekolah</label>
                        {orgData.email_verified_at ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-lg">
                            <CheckCircle2 className="h-3 w-3" /> Terverifikasi
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded-lg">
                            <AlertCircle className="h-3 w-3" /> Belum Verifikasi
                          </span>
                        )}
                      </div>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="email"
                          placeholder="email@sekolah.sch.id"
                          className="w-full pl-12 pr-4 py-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all"
                          value={orgData.email}
                          onChange={(e) => setOrgData({...orgData, email: e.target.value})}
                        />
                      </div>
                      {!orgData.email_verified_at && orgData.email && (
                        <Button 
                          onClick={() => handleSendOTP('email')}
                          disabled={isVerifying}
                          variant="outline"
                          className="w-full rounded-xl border-slate-200 text-xs font-bold uppercase tracking-wider h-10"
                        >
                          Verifikasi Email
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">WhatsApp Sekolah</label>
                        {orgData.whatsapp_verified_at ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-lg">
                            <CheckCircle2 className="h-3 w-3" /> Terverifikasi
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded-lg">
                            <AlertCircle className="h-3 w-3" /> Belum Verifikasi
                          </span>
                        )}
                      </div>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="text"
                          placeholder="0812xxxxxxxx"
                          className="w-full pl-12 pr-4 py-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all"
                          value={orgData.whatsapp}
                          onChange={(e) => setOrgData({...orgData, whatsapp: e.target.value})}
                        />
                      </div>
                      {!orgData.whatsapp_verified_at && orgData.whatsapp && (
                        <Button 
                          onClick={() => handleSendOTP('whatsapp')}
                          disabled={isVerifying}
                          variant="outline"
                          className="w-full rounded-xl border-slate-200 text-xs font-bold uppercase tracking-wider h-10"
                        >
                          Verifikasi WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <Palette className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-black tracking-tight text-slate-900">Tampilan & Branding</CardTitle>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">Kustomisasi logo dan warna tema</p>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 text-center block">Logo & Favicon</label>
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-[2rem] border-4 border-slate-50 bg-slate-50 flex items-center justify-center overflow-hidden shadow-xl transition-transform group-hover:scale-105">
                          {orgData.logo_url ? (
                            <img src={orgData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="h-10 w-10 text-slate-200" />
                          )}
                        </div>
                        <input 
                          type="file" 
                          id="logo-upload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        />
                        <Button 
                          asChild 
                          variant="secondary" 
                          size="sm" 
                          className="absolute -bottom-2 -right-2 rounded-xl shadow-lg border-2 border-white"
                        >
                          <label htmlFor="logo-upload" className="cursor-pointer">
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                          </label>
                        </Button>
                      </div>
                      <p className="text-[10px] text-center text-slate-400 font-bold uppercase">Favicon otomatis mengikuti logo</p>
                    </div>

                    <div className="flex-1 space-y-6 w-full">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Warna Tema Utama</label>
                        <div className="flex gap-4">
                          <input 
                            type="color"
                            className="h-14 w-20 rounded-2xl border-2 border-slate-50 bg-white cursor-pointer"
                            value={orgData.theme_color}
                            onChange={(e) => setOrgData({...orgData, theme_color: e.target.value})}
                          />
                          <input 
                            type="text"
                            className="flex-1 p-4 text-sm font-mono rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all"
                            value={orgData.theme_color}
                            onChange={(e) => setOrgData({...orgData, theme_color: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-slate-900 text-white overflow-hidden p-8">
                <h3 className="text-lg font-black tracking-tight mb-2">Pratinjau</h3>
                <p className="text-slate-400 text-xs font-medium mb-6">Tampilan branding Anda di website</p>
                
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                      {orgData.logo_url ? <img src={orgData.logo_url} className="w-full h-full object-contain" /> : <School className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="h-3 w-24 bg-white/20 rounded-full mb-2" />
                      <div className="h-2 w-16 bg-white/10 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-1 w-full bg-white/5 rounded-full">
                      <div className="h-full rounded-full" style={{ backgroundColor: orgData.theme_color, width: '60%' }} />
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Warna Identitas Terapan</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 relative overflow-hidden"
          >
            <button 
              onClick={() => setShowVerifyModal(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto mb-6">
                {showVerifyModal.type === 'email' ? (
                  <Mail className="h-10 w-10 text-primary" />
                ) : (
                  <Phone className="h-10 w-10 text-primary" />
                )}
              </div>
              
              <h2 className="text-2xl font-black text-slate-900">Verifikasi {showVerifyModal.type === 'email' ? 'Email' : 'WhatsApp'}</h2>
              <p className="text-slate-500 font-medium text-sm">
                Masukkan 6 digit kode OTP yang telah kami kirimkan ke <br />
                <span className="text-slate-900 font-bold">{showVerifyModal.target}</span>
              </p>

              <div className="pt-6 space-y-6">
                <input 
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full p-6 text-center text-4xl font-black tracking-[0.5em] rounded-3xl border-2 border-slate-100 bg-slate-50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                />

                <Button 
                  onClick={handleVerifyOTP}
                  disabled={isVerifying || otpCode.length !== 6}
                  className="w-full rounded-2xl py-8 font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20"
                >
                  {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verifikasi Sekarang'}
                </Button>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tidak menerima kode? <button className="text-primary hover:underline" onClick={() => handleSendOTP(showVerifyModal.type)}>Kirim Ulang</button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={toast ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      >
        {toast && (
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm ${
            toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${toast.type === 'success' ? 'bg-primary' : 'bg-white'}`} />
            {toast.message}
          </div>
        )}
      </motion.div>
    </div>
  );
}

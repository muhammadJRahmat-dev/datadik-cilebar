'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Image as ImageIcon,
  Loader2,
  Save,
  Palette,
  Building2,
  MapPin,
  ShieldCheck,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [orgInfo, setOrgInfo] = useState<any>(null);
  const [orgData, setOrgData] = useState({
    name: '',
    type: 'dinas',
    logo_url: '',
    favicon_url: '',
    address: '',
    theme_color: '#2563eb',
    email: '',
    whatsapp: '',
    email_verified_at: null,
    whatsapp_verified_at: null
  });
  const [showVerifyModal, setShowVerifyModal] = useState<{ type: 'email' | 'whatsapp', target: string } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

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

      // Get Kecamatan organization data
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', 'kecamatan-cilebar')
        .single();

      if (org) {
        setOrgInfo(org);
        setOrgData({
          name: org.name || '',
          type: org.type || 'dinas',
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
      const filePath = `district/logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      // Otomatis set favicon dari logo
      setOrgData({ ...orgData, logo_url: publicUrl, favicon_url: publicUrl });
      showToast('Logo & Favicon berhasil diunggah');
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
        .eq('id', orgInfo.id);

      if (error) throw error;
      showToast('Pengaturan Kecamatan berhasil disimpan');
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
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('verification_codes')
        .insert({
          org_id: orgInfo.id,
          type,
          target,
          code,
          expires_at: expiresAt
        });

      if (error) throw error;

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
        .eq('org_id', orgInfo.id)
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

      await supabase
        .from('verification_codes')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', data.id);

      const updateData: any = {};
      if (showVerifyModal.type === 'email') {
        updateData.email_verified_at = new Date().toISOString();
      } else {
        updateData.whatsapp_verified_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', orgInfo.id);

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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Memuat Pengaturan...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Pengaturan Wilayah</h1>
          <p className="text-slate-400 font-medium text-sm">Kelola identitas pusat dan branding Kecamatan</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-2xl px-8 py-6 h-auto font-black uppercase tracking-widest gap-2 shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-500 text-white"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Simpan Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Basic Info */}
          <Card className="border border-white/5 shadow-2xl shadow-black/20 rounded-[2.5rem] bg-white/5 overflow-hidden backdrop-blur-md">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <Building2 className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-xl font-black tracking-tight text-white">Identitas Kecamatan</CardTitle>
              </div>
              <p className="text-slate-400 text-xs font-medium">Informasi resmi pusat administrasi</p>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Wilayah</label>
                  <input
                    type="text"
                    className="w-full p-4 text-sm font-medium rounded-2xl border border-white/10 bg-white/5 text-white focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all"
                    value={orgData.name}
                    onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tipe Instansi</label>
                  <select
                    className="w-full p-4 text-sm font-medium rounded-2xl border border-white/10 bg-white/5 text-white focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all appearance-none"
                    value={orgData.type}
                    onChange={(e) => setOrgData({ ...orgData, type: e.target.value })}
                  >
                    <option value="dinas" className="bg-slate-900">Dinas / Kecamatan</option>
                    <option value="umum" className="bg-slate-900">Umum</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Alamat Kantor Kecamatan</label>
                <textarea
                  className="w-full min-h-24 p-4 text-sm font-medium rounded-2xl border border-white/10 bg-white/5 text-white focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all resize-none"
                  value={orgData.address}
                  onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                />
              </div>

              {/* Email & WhatsApp Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email Resmi</label>
                    {orgData.email_verified_at ? (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="h-3 w-3" /> Terverifikasi
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                        <AlertCircle className="h-3 w-3" /> Belum Verifikasi
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="email"
                      placeholder="kecamatan@cilebar.go.id"
                      className="w-full pl-12 pr-4 py-4 text-sm font-medium rounded-2xl border border-white/10 bg-white/5 text-white focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all"
                      value={orgData.email}
                      onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                    />
                  </div>
                  {!orgData.email_verified_at && orgData.email && (
                    <Button
                      onClick={() => handleSendOTP('email')}
                      disabled={isVerifying}
                      variant="outline"
                      className="w-full rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider h-10"
                    >
                      Verifikasi Email
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">WhatsApp Center</label>
                    {orgData.whatsapp_verified_at ? (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="h-3 w-3" /> Terverifikasi
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                        <AlertCircle className="h-3 w-3" /> Belum Verifikasi
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="0812xxxxxxxx"
                      className="w-full pl-12 pr-4 py-4 text-sm font-medium rounded-2xl border border-white/10 bg-white/5 text-white focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all"
                      value={orgData.whatsapp}
                      onChange={(e) => setOrgData({ ...orgData, whatsapp: e.target.value })}
                    />
                  </div>
                  {!orgData.whatsapp_verified_at && orgData.whatsapp && (
                    <Button
                      onClick={() => handleSendOTP('whatsapp')}
                      disabled={isVerifying}
                      variant="outline"
                      className="w-full rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider h-10"
                    >
                      Verifikasi WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card className="border border-white/5 shadow-2xl shadow-black/20 rounded-[2.5rem] bg-white/5 overflow-hidden backdrop-blur-md">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <Palette className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-xl font-black tracking-tight text-white">Branding Wilayah</CardTitle>
              </div>
              <p className="text-slate-400 text-xs font-medium">Kustomisasi logo dan identitas visual</p>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 text-center block">Logo & Favicon</label>
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[2rem] border-4 border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shadow-xl transition-transform group-hover:scale-105">
                      {orgData.logo_url ? (
                        <img src={orgData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-slate-500" />
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
                      className="absolute -bottom-2 -right-2 rounded-xl shadow-lg border-2 border-slate-900 bg-white hover:bg-slate-200 text-slate-900"
                    >
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                      </label>
                    </Button>
                  </div>
                </div>

                <div className="flex-1 space-y-6 w-full">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Warna Identitas Kecamatan</label>
                    <div className="flex gap-4">
                      <input
                        type="color"
                        className="h-14 w-20 rounded-2xl border border-white/10 bg-white/5 cursor-pointer p-1"
                        value={orgData.theme_color}
                        onChange={(e) => setOrgData({ ...orgData, theme_color: e.target.value })}
                      />
                      <input
                        type="text"
                        className="flex-1 p-4 text-sm font-mono rounded-2xl border border-white/10 bg-white/5 text-white focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all"
                        value={orgData.theme_color}
                        onChange={(e) => setOrgData({ ...orgData, theme_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Info Branding</p>
                    <p className="text-xs text-slate-400 leading-relaxed">Warna ini akan digunakan sebagai identitas utama pada portal publik Kecamatan Cilebar.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-6">
          <Card className="border border-white/5 shadow-xl shadow-black/20 rounded-[2rem] bg-slate-900 text-white overflow-hidden p-8 sticky top-24">
            <h3 className="text-lg font-black tracking-tight mb-2">Live Preview</h3>
            <p className="text-slate-400 text-xs font-medium mb-6">Pratinjau tampilan di portal utama</p>

            <div className="space-y-8">
              <div className="bg-white/5 rounded-2xl p-6 flex flex-col items-center text-center gap-4 border border-white/5">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                  {orgData.logo_url ? <img src={orgData.logo_url} className="w-full h-full object-contain" /> : <ShieldCheck className="h-8 w-8 text-blue-500" />}
                </div>
                <div>
                  <h4 className="font-black text-sm tracking-tight text-white">{orgData.name || 'Nama Kecamatan'}</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Portal Resmi</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Warna Tema</p>
                  <span className="text-[10px] font-mono text-slate-400">{orgData.theme_color}</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ backgroundColor: orgData.theme_color, width: '100%' }} />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                  <p className="text-[10px] text-slate-400 leading-relaxed italic">{orgData.address || 'Alamat belum diatur'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 relative overflow-hidden border border-white/10"
          >
            <button
              onClick={() => setShowVerifyModal(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-[2rem] bg-blue-500/10 flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                {showVerifyModal.type === 'email' ? (
                  <Mail className="h-10 w-10 text-blue-500" />
                ) : (
                  <Phone className="h-10 w-10 text-blue-500" />
                )}
              </div>

              <h2 className="text-2xl font-black text-white">Verifikasi {showVerifyModal.type === 'email' ? 'Email' : 'WhatsApp'}</h2>
              <p className="text-slate-400 font-medium text-sm">
                Masukkan 6 digit kode OTP yang telah kami kirimkan ke <br />
                <span className="text-white font-bold">{showVerifyModal.target}</span>
              </p>

              <div className="pt-6 space-y-6">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full p-6 text-center text-4xl font-black tracking-[0.5em] rounded-3xl border border-white/10 bg-white/5 text-white focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all placeholder:text-slate-700"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                />

                <Button
                  onClick={handleVerifyOTP}
                  disabled={isVerifying || otpCode.length !== 6}
                  className="w-full rounded-2xl py-8 font-black uppercase tracking-widest gap-2 shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verifikasi Sekarang'}
                </Button>

                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Tidak menerima kode? <button className="text-blue-400 hover:text-blue-300 hover:underline" onClick={() => handleSendOTP(showVerifyModal.type)}>Kirim Ulang</button>
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
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200]"
      >
        {toast && (
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border ${toast.type === 'success' ? 'bg-slate-900 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-red-400 border-red-500/30'
            }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {toast.message}
          </div>
        )}
      </motion.div>
    </div>
  );
}

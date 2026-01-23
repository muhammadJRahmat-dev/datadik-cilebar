'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Search, 
  ExternalLink, 
  Users as UsersIcon,
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Globe,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export default function SchoolsManagementPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    npsn: '',
    address: '',
    logo_url: '',
    theme_color: '#2563eb'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('organizations')
      .select('*, school_data(*)')
      .eq('type', 'sekolah')
      .order('name', { ascending: true });

    if (error) console.error('Error fetching schools:', error);
    else setSchools(data || []);
    setLoading(false);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSyncData = async (school: any) => {
    setSyncingId(school.id);
    try {
      // Simulation of fetching from Kemendikdasmen API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockStats = {
        siswa: Math.floor(Math.random() * 500) + 100,
        guru: Math.floor(Math.random() * 30) + 10,
        rombel: Math.floor(Math.random() * 12) + 6,
        last_sync: new Date().toISOString(),
        status: 'AKTIF',
        akreditasi: 'A',
        kurikulum: 'Kurikulum Merdeka'
      };

      const { error } = await supabase
        .from('school_data')
        .upsert({ 
          org_id: school.id,
          npsn: school.school_data?.[0]?.npsn || `10${Math.floor(Math.random() * 1000000)}`,
          stats: mockStats
        }, { onConflict: 'org_id' });

      if (error) throw error;
      showToast(`Data ${school.name} berhasil disinkronkan`);
      fetchSchools();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const handleExportData = () => {
    const exportData = schools.map(school => {
      const stats = school.school_data?.[0]?.stats || {};
      return {
        'Nama Sekolah': school.name,
        'NPSN': school.school_data?.[0]?.npsn || '-',
        'Subdomain': `${school.slug}.datadikcilebar.id`,
        'Total Siswa': stats.siswa || 0,
        'Total Guru': stats.guru || 0,
        'Total Rombel': stats.rombel || 0,
        'Status': stats.status || 'AKTIF',
        'Akreditasi': stats.akreditasi || '-',
        'Alamat': school.address || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Sekolah');
    
    // Auto-size columns
    const maxWidths = Object.keys(exportData[0] || {}).map(key => ({ wch: Math.max(key.length, 20) }));
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(workbook, `Data_Sekolah_Cilebar_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Data berhasil diekspor ke Excel');
  };

  const handleOpenModal = (school: any = null) => {
    if (school) {
      setEditingSchool(school);
      setFormData({
        name: school.name,
        npsn: school.school_data?.[0]?.npsn || school.slug,
        address: school.address || '',
        logo_url: school.logo_url || '',
        theme_color: school.theme_color || '#2563eb'
      });
    } else {
      setEditingSchool(null);
      setFormData({ name: '', npsn: '', address: '', logo_url: '', theme_color: '#2563eb' });
    }
    setIsModalOpen(true);
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const orgData = {
        name: formData.name,
        slug: formData.npsn, // Use NPSN as slug
        address: formData.address,
        logo_url: formData.logo_url,
        theme_color: formData.theme_color,
        type: 'sekolah'
      };

      if (editingSchool) {
        const { error: orgError } = await supabase
          .from('organizations')
          .update(orgData)
          .eq('id', editingSchool.id);
        
        if (orgError) throw orgError;

        const { error: schoolError } = await supabase
          .from('school_data')
          .upsert({ 
            org_id: editingSchool.id,
            npsn: formData.npsn,
            // Keep existing stats if any
            stats: editingSchool.school_data?.[0]?.stats || { siswa: 0, guru: 0, rombel: 0 }
          }, { onConflict: 'org_id' });

        if (schoolError) throw schoolError;
        showToast('Data sekolah berhasil diperbarui');
      } else {
        // Create Organization
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert([orgData])
          .select()
          .single();
        
        if (orgError) throw orgError;

        // Create initial school_data
        const { error: schoolError } = await supabase
          .from('school_data')
          .insert([{ 
            org_id: org.id, 
            npsn: formData.npsn,
            stats: { siswa: 0, guru: 0, rombel: 0 } 
          }]);
        
        if (schoolError) throw schoolError;
        showToast('Sekolah baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchSchools();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm('Hapus sekolah ini beserta seluruh datanya?')) return;
    const { error } = await supabase.from('organizations').delete().eq('id', id);
    if (error) showToast('Gagal menghapus sekolah', 'error');
    else {
      showToast('Sekolah berhasil dihapus');
      fetchSchools();
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Sekolah</h1>
          <p className="text-slate-500 font-medium mt-1">Kelola daftar sekolah dan data statistik kecamatan.</p>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline"
            onClick={handleExportData}
            disabled={schools.length === 0}
            className="rounded-2xl px-6 py-6 h-auto font-black uppercase tracking-widest gap-2 bg-white border-2 hover:bg-slate-50"
          >
            <Download className="h-5 w-5" />
            Ekspor Excel
          </Button>
          <Button 
            onClick={() => handleOpenModal()}
            className="rounded-2xl px-6 py-6 h-auto font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20"
          >
            <Plus className="h-5 w-5" />
            Tambah Sekolah
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Cari nama sekolah atau subdomain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-14 rounded-2xl border-slate-100 bg-white shadow-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8 space-y-4">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Skeleton className="h-10 rounded-xl" />
                  <Skeleton className="h-10 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredSchools.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <Building2 className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Tidak ada sekolah ditemukan</p>
          </div>
        ) : (
          filteredSchools.map((school) => {
            const stats = school.school_data?.[0]?.stats || {};
            return (
              <motion.div key={school.id} layout>
                <Card className="group border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white hover:scale-[1.02] transition-all">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border-2 border-white shadow-sm">
                        {school.logo_url ? (
                          <img src={school.logo_url} alt={school.name} className="w-full h-full object-contain rounded-2xl" />
                        ) : (
                          <Building2 className="h-6 w-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={`h-9 w-9 rounded-xl hover:bg-blue-50 text-blue-400 ${syncingId === school.id ? 'animate-spin' : ''}`}
                          onClick={() => handleSyncData(school)}
                          disabled={syncingId !== null}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl hover:bg-slate-100"
                          onClick={() => handleOpenModal(school)}
                        >
                          <Edit className="h-4 w-4 text-slate-400" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl hover:bg-red-50 text-red-400"
                          onClick={() => handleDeleteSchool(school.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 line-clamp-1">{school.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                      <Globe className="h-3 w-3" />
                      {school.slug}.datadikcilebar.id
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Siswa</p>
                        <div className="flex items-center gap-2">
                          <UsersIcon className="h-3 w-3 text-blue-500" />
                          <span className="font-black text-slate-900">{stats.siswa || 0}</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Guru</p>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-3 w-3 text-purple-500" />
                          <span className="font-black text-slate-900">{stats.guru || 0}</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full rounded-2xl border-slate-100 h-12 font-black uppercase tracking-widest text-[10px] gap-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
                      asChild
                    >
                      <a href={`https://${school.slug}.datadikcilebar.my.id`} target="_blank" rel="noopener noreferrer">
                        Kunjungi Situs <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal Tambah/Edit Sekolah */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingSchool ? 'Edit Sekolah' : 'Tambah Sekolah'}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Registrasi entitas pendidikan</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-xl">
                  <X />
                </Button>
              </div>

              <form onSubmit={handleSaveSchool} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Sekolah</label>
                    <Input 
                      placeholder="Masukkan nama sekolah..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-12 rounded-xl border-slate-100 font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NPSN (Subdomain)</label>
                    <div className="relative">
                      <Input 
                        placeholder="Contoh: 10203040"
                        value={formData.npsn}
                        onChange={(e) => setFormData({ ...formData, npsn: e.target.value.replace(/\D/g, '') })}
                        className="h-12 rounded-xl border-slate-100 font-bold pr-32"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">.datadikcilebar.id</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat</label>
                    <textarea 
                      className="w-full h-24 rounded-xl border-2 border-slate-100 p-4 font-medium focus:border-primary outline-none transition-all"
                      placeholder="Masukkan alamat lengkap..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logo URL</label>
                      <Input 
                        placeholder="https://..."
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        className="h-12 rounded-xl border-slate-100 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Warna Tema</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={formData.theme_color}
                          onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                          className="h-12 w-12 rounded-xl border-2 border-slate-100 p-1 cursor-pointer"
                        />
                        <Input 
                          value={formData.theme_color}
                          onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                          className="h-12 rounded-xl border-slate-100 font-bold uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  disabled={isSaving}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20"
                >
                  {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : 'Simpan Sekolah'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-200 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 ${
              toast.type === 'success' ? 'bg-white border-emerald-100 text-emerald-600' : 'bg-white border-red-100 text-red-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
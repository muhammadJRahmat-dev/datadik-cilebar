'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Globe,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export default function MitraManagementPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMitra, setEditingMitra] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    logo_url: '',
    theme_color: '#2563eb'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('type', 'mitra')
      .order('name', { ascending: true });

    if (error) console.error('Error fetching partners:', error);
    else setPartners(data || []);
    setLoading(false);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (mitra: any = null) => {
    if (mitra) {
      setEditingMitra(mitra);
      setFormData({
        name: mitra.name,
        slug: mitra.slug,
        address: mitra.address || '',
        logo_url: mitra.logo_url || '',
        theme_color: mitra.theme_color || '#2563eb'
      });
    } else {
      setEditingMitra(null);
      setFormData({ name: '', slug: '', address: '', logo_url: '', theme_color: '#2563eb' });
    }
    setIsModalOpen(true);
  };

  const handleSaveMitra = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const orgData = {
        ...formData,
        type: 'mitra'
      };

      if (editingMitra) {
        const { error } = await supabase
          .from('organizations')
          .update(orgData)
          .eq('id', editingMitra.id);
        if (error) throw error;
        showToast('Data organisasi mitra berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('organizations')
          .insert([orgData]);
        if (error) throw error;
        showToast('Organisasi mitra baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchPartners();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMitra = async (id: string) => {
    if (!confirm('Hapus organisasi mitra ini?')) return;
    const { error } = await supabase.from('organizations').delete().eq('id', id);
    if (error) showToast('Gagal menghapus organisasi', 'error');
    else {
      showToast('Organisasi berhasil dihapus');
      fetchPartners();
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Manajemen Organisasi Mitra</h1>
          <p className="text-slate-400 font-medium mt-1">Kelola entitas mitra seperti PGRI, BAPOPSI, KWARRAN, dll.</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="rounded-2xl px-6 py-6 h-auto font-black uppercase tracking-widest gap-2 shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Plus className="h-5 w-5" />
          Tambah Mitra
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          placeholder="Cari nama organisasi atau subdomain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-14 rounded-2xl border-white/10 bg-white/5 focus:bg-white/10 shadow-sm font-medium text-white placeholder:text-slate-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="border border-white/5 shadow-xl shadow-black/20 rounded-[2.5rem] overflow-hidden bg-white/5">
              <CardContent className="p-8 space-y-4">
                <Skeleton className="h-12 w-12 rounded-2xl bg-white/5" />
                <Skeleton className="h-6 w-3/4 bg-white/5" />
                <Skeleton className="h-4 w-1/2 bg-white/5" />
              </CardContent>
            </Card>
          ))
        ) : filteredPartners.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
            <ShieldCheck className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Tidak ada mitra ditemukan</p>
          </div>
        ) : (
          filteredPartners.map((mitra) => (
            <motion.div key={mitra.id} layout>
              <Card className="group border border-white/5 shadow-xl shadow-black/20 rounded-[2.5rem] overflow-hidden bg-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all backdrop-blur-md relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5 shadow-sm">
                      {mitra.logo_url ? (
                        <img src={mitra.logo_url} alt={mitra.name} className="w-full h-full object-contain rounded-2xl" />
                      ) : (
                        <ShieldCheck className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
                        onClick={() => handleOpenModal(mitra)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400"
                        onClick={() => handleDeleteMitra(mitra.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white leading-tight mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">{mitra.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">
                    <Globe className="h-3 w-3" />
                    {mitra.slug}.datadikcilebar.id
                  </div>

                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-white/10 bg-white/5 hover:bg-blue-600 hover:text-white hover:border-blue-500 h-12 font-black uppercase tracking-widest text-[10px] gap-2 transition-all text-slate-300"
                    asChild
                  >
                    <a href={`https://${mitra.slug}.datadikcilebar.my.id`} target="_blank" rel="noopener noreferrer">
                      Kunjungi Situs <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Tambah/Edit Mitra */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-8 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">{editingMitra ? 'Edit Mitra' : 'Tambah Mitra'}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Registrasi entitas mitra</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-xl text-slate-400 hover:text-white hover:bg-white/10">
                  <X />
                </Button>
              </div>

              <form onSubmit={handleSaveMitra} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Organisasi</label>
                    <Input
                      placeholder="Contoh: PGRI Kecamatan Cilebar"
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData({
                          ...formData,
                          name,
                          slug: editingMitra ? formData.slug : generateSlug(name)
                        });
                      }}
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white font-bold focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subdomain (Berdasarkan Nama)</label>
                    <div className="relative">
                      <Input
                        placeholder="contoh: pgri-cilebar"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                        className="h-12 rounded-xl border-white/10 bg-white/5 text-white font-bold pr-32 focus:border-blue-500"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">.datadikcilebar.id</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium ml-1">Subdomain akan otomatis terisi saat mengetik nama organisasi.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat</label>
                    <textarea
                      className="w-full h-24 rounded-xl border border-white/10 bg-white/5 text-white p-4 font-medium focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
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
                        className="h-12 rounded-xl border-white/10 bg-white/5 text-white font-bold focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Warna Tema</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.theme_color}
                          onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                          className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.theme_color}
                          onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                          className="h-12 rounded-xl border-white/10 bg-white/5 text-white font-bold uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  disabled={isSaving}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : 'Simpan Mitra'}
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
            className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${toast.type === 'success' ? 'bg-slate-900 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-red-500/30 text-red-400'
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

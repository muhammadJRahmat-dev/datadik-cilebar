'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Post, Organization } from '@/types';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [districtOrg, setDistrictOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'berita',
    image_url: '',
    is_published: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchDistrictOrg();
    fetchPosts();
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      showToast('Gambar berhasil diunggah');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Gagal mengunggah gambar', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchDistrictOrg = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('type', 'dinas')
      .single();
    if (data) setDistrictOrg(data);
  };

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*, organizations(name)')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching posts:', error);
    else setPosts(data || []);
    setLoading(false);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtOrg) {
      showToast('Organisasi kecamatan tidak ditemukan', 'error');
      return;
    }

    setIsSaving(true);
    const slug = formData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    try {
      if (editingPost) {
        const { error } = await supabase
          .from('posts')
          .update({
            ...formData,
            slug
          })
          .eq('id', editingPost.id);

        if (error) throw error;
        showToast('Berita berhasil diperbarui!');
      } else {
        const { error } = await supabase
          .from('posts')
          .insert({
            ...formData,
            org_id: districtOrg.id,
            slug
          });

        if (error) throw error;
        showToast('Berita berhasil diterbitkan!');
      }

      setIsModalOpen(false);
      setEditingPost(null);
      setFormData({ title: '', content: '', category: 'berita', image_url: '', is_published: true });
      fetchPosts();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenModal = (post: Post | null = null) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        content: post.content || '',
        category: post.category || 'berita',
        image_url: post.image_url || '',
        is_published: post.is_published
      });
    } else {
      setEditingPost(null);
      setFormData({ title: '', content: '', category: 'berita', image_url: '', is_published: true });
    }
    setIsModalOpen(true);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Hapus berita ini?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) showToast('Gagal menghapus berita', 'error');
    else {
      showToast('Berita dihapus');
      fetchPosts();
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.organizations?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">CMS Konten</h1>
          <p className="text-slate-500 font-medium mt-1">Kelola berita, pengumuman, dan agenda kecamatan.</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          className="rounded-2xl px-6 py-6 h-auto font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20"
        >
          <Plus className="h-5 w-5" />
          Buat Konten
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Cari berita atau pengumuman..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-14 rounded-2xl border-slate-100 bg-white shadow-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredPosts.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <FileText className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Belum ada konten</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <motion.div key={post.id} layout>
              <Card className="group border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white flex flex-col h-full hover:scale-[1.02] transition-all">
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {post.image_url ? (
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-slate-200" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-900">
                      {post.category}
                    </span>
                    {!post.is_published && (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-white shadow-sm text-[10px] font-black uppercase tracking-widest">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                <CardContent className="p-8 grow flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-slate-400" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest ml-auto">
                      {post.organizations?.name}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight mb-4 line-clamp-2">{post.title}</h3>
                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                    <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-2 text-slate-500">
                      <Eye className="h-4 w-4" /> Lihat
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl hover:bg-slate-100"
                        onClick={() => handleOpenModal(post)}
                      >
                        <Edit className="h-4 w-4 text-slate-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl hover:bg-red-50 group/del"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4 text-slate-400 group-hover/del:text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Buat Konten */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingPost ? 'Edit Konten' : 'Buat Konten Baru'}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Terbitkan ke portal kecamatan</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-xl">
                  <X />
                </Button>
              </div>

              <form onSubmit={handleSavePost} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Berita</label>
                    <Input 
                      placeholder="Masukkan judul..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-12 rounded-xl border-slate-100 font-bold text-lg"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                      <select 
                        className="w-full h-12 rounded-xl border-2 border-slate-100 px-4 font-bold focus:border-primary outline-none transition-all"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      >
                        <option value="berita">Berita</option>
                        <option value="agenda">Agenda</option>
                        <option value="pengumuman">Pengumuman</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gambar Utama</label>
                      <div className="flex gap-2">
                        <div className="w-12 h-12 rounded-xl border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                          {formData.image_url ? (
                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-slate-200" />
                          )}
                        </div>
                        <Input 
                          placeholder="https://..."
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          className="h-12 rounded-xl border-slate-100 font-bold grow"
                        />
                        <input 
                          type="file" 
                          id="post-image" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isUploading}
                          className="h-12 w-12 rounded-xl shrink-0 border-slate-100"
                          onClick={() => document.getElementById('post-image')?.click()}
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Isi Konten</label>
                    <textarea 
                      className="w-full min-h-[200px] p-4 rounded-xl border-2 border-slate-100 font-medium focus:border-primary outline-none transition-all"
                      placeholder="Tulis berita di sini..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                    <input 
                      type="checkbox" 
                      id="publish" 
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="w-5 h-5 rounded-lg border-2 border-slate-200 accent-primary"
                    />
                    <label htmlFor="publish" className="font-bold text-slate-700 text-sm">Terbitkan langsung (Public)</label>
                  </div>
                </div>

                <Button 
                  disabled={isSaving}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20"
                >
                  {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : 'Terbitkan Konten'}
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
            className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 ${
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
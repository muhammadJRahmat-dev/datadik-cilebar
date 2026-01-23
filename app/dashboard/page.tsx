'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  LogOut, 
  School, 
  Users, 
  Settings, 
  // Bell, 
  Plus, 
  FileText, 
  Trash2, 
  Edit, 
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  // ChevronRight,
  Globe,
  Upload,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const KNOWN_KEYS = ['siswa', 'guru', 'pegawai', 'rombel', 'jenis', 'status', 'visi', 'misi', 'kontak_wa', 'kontak_email', 'last_sync', 'lat', 'lng', 'address'];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [profileData, setProfileData] = useState({
    visi: '',
    misi: '',
    kontak_wa: '',
    kontak_email: ''
  });
  const [orgData, setOrgData] = useState({
    name: '',
    type: 'sekolah' as 'sekolah' | 'dinas' | 'umum',
    logo_url: '',
    address: '',
    theme_color: '#2563eb'
  });
  const [dynamicFields, setDynamicFields] = useState<{key: string, value: string, type: 'text' | 'number' | 'date'}[]>([]);

  // Known keys that shouldn't appear in dynamic fields list

  // Post Modal States
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [postFormData, setPostFormData] = useState({
    title: '',
    content: '',
    category: 'berita',
    image_url: '',
    is_published: true
  });
  const [isSavingPost, setIsSavingPost] = useState(false);

  // Submission States
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [submissionFormData, setSubmissionFormData] = useState({
    file_url: '',
    file_name: '',
    description: '',
    category: 'umum'
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncDapodik = async () => {
    if (!confirm('Mulai sinkronisasi data dari Kemendikdasmen? Proses ini mungkin memakan waktu.')) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync/kemendikdasmen');
      const data = await response.json();
      
      if (data.success) {
        showToast(`Sinkronisasi berhasil! ${data.processed} sekolah diproses.`);
        // Refresh data
        window.location.reload();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      showToast('Gagal sinkronisasi: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = async (file: File, path: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Gagal mengunggah file', 'error');
      return null;
    }
  };

  const handleOpenPostModal = (post: any = null) => {
    if (post) {
      setEditingPost(post);
      setPostFormData({
        title: post.title,
        content: post.content,
        category: post.category,
        image_url: post.image_url || '',
        is_published: post.is_published
      });
    } else {
      setEditingPost(null);
      setPostFormData({
        title: '',
        content: '',
        category: 'berita',
        image_url: '',
        is_published: true
      });
    }
    setIsPostModalOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPost(true);
    try {
      if (editingPost) {
        const { error } = await supabase
          .from('posts')
          .update(postFormData)
          .eq('id', editingPost.id);
        if (error) throw error;
        setPosts(posts.map(p => p.id === editingPost.id ? { ...p, ...postFormData } : p));
        showToast('Berita berhasil diperbarui');
      } else {
        const { data, error } = await supabase
          .from('posts')
          .insert([{ ...postFormData, org_id: schoolInfo.id }])
          .select();
        if (error) throw error;
        if (data) setPosts([data[0], ...posts]);
        showToast('Berita berhasil ditambahkan');
      }
      setIsPostModalOpen(false);
    } catch (err) {
      console.error('Error saving post:', err);
      showToast('Gagal menyimpan berita', 'error');
    } finally {
      setIsSavingPost(false);
    }
  };

  useEffect(() => {
    async function getData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const npsn = session.user.user_metadata?.npsn || session.user.email?.split('@')[0];

      // Fetch School & Posts
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug, type, logo_url, address, theme_color, school_data(npsn, stats)')
        .eq('school_data.npsn', npsn)
        .single();

      if (org) {
        setSchoolInfo(org);
        setOrgData({
          name: org.name || '',
          type: (org.type as any) || 'sekolah',
          logo_url: org.logo_url || '',
          address: org.address || '',
          theme_color: org.theme_color || '#2563eb'
        });
        
        if (org.school_data?.[0]?.stats) {
          const stats = org.school_data[0].stats;
          setProfileData({
            visi: stats.visi || '',
            misi: stats.misi || '',
            kontak_wa: stats.kontak_wa || '',
            kontak_email: stats.kontak_email || ''
          });

          // Populate dynamic fields
          const dynamic = Object.entries(stats)
            .filter(([key]) => !KNOWN_KEYS.includes(key))
            .map(([key, value]) => ({ 
              key, 
              value: String(value),
              type: typeof value === 'number' ? 'number' : (String(value).match(/^\d{4}-\d{2}-\d{2}$/) ? 'date' : 'text') as any
            }));
          setDynamicFields(dynamic);
        }

        const { data: schoolPosts } = await supabase
          .from('posts')
          .select('*')
          .eq('org_id', org.id)
          .order('created_at', { ascending: false });
        
        if (schoolPosts) setPosts(schoolPosts);

        // Fetch Submissions
        const { data: schoolSubmissions } = await supabase
          .from('submissions')
          .select('*')
          .eq('org_id', org.id)
          .order('created_at', { ascending: false });
        
        if (schoolSubmissions) setSubmissions(schoolSubmissions);
      }

      setLoading(false);
    }
    getData();
  }, [router]);

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const currentStats = schoolInfo?.school_data?.[0]?.stats || {};
      
      // Convert dynamic fields array to object
      const dynamicObj = dynamicFields.reduce((acc: any, field) => {
        if (field.key.trim()) {
          let val: any = field.value;
          if (field.type === 'number') val = parseFloat(field.value) || 0;
          acc[field.key.trim()] = val;
        }
        return acc;
      }, {});

      // Remove old dynamic fields that are no longer in dynamicFields array
      // but keep KNOWN_KEYS
      const cleanedStats = Object.keys(currentStats).reduce((acc: any, key) => {
        if (KNOWN_KEYS.includes(key)) {
          acc[key] = currentStats[key];
        }
        return acc;
      }, {});

      const updatedStats = {
        ...cleanedStats,
        ...profileData,
        ...dynamicObj
      };

      // 1. Update School Data (JSONB)
      const { error: schoolError } = await supabase
        .from('school_data')
        .update({ stats: updatedStats })
        .eq('org_id', schoolInfo.id);

      if (schoolError) throw schoolError;

      // 2. Update Organization Data
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          name: orgData.name,
          type: orgData.type,
          logo_url: orgData.logo_url,
          address: orgData.address,
          theme_color: orgData.theme_color
        })
        .eq('id', schoolInfo.id);

      if (orgError) throw orgError;

      showToast('Profil sekolah berhasil diperbarui');
      // Refresh school info locally
      setSchoolInfo({
        ...schoolInfo,
        name: orgData.name,
        type: orgData.type,
        logo_url: orgData.logo_url,
        address: orgData.address,
        theme_color: orgData.theme_color,
        school_data: [{ ...schoolInfo.school_data[0], stats: updatedStats }]
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Gagal memperbarui profil', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleSendSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionFormData.file_url) {
      showToast('Pilih file terlebih dahulu', 'error');
      return;
    }
    setIsUploadingFile(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert([{ 
          ...submissionFormData, 
          org_id: schoolInfo.id,
          user_id: user.id 
        }])
        .select();
      
      if (error) throw error;
      if (data) setSubmissions([data[0], ...submissions]);
      showToast('Berkas berhasil dikirim ke Kecamatan');
      setIsSubmissionModalOpen(false);
      setSubmissionFormData({ file_url: '', file_name: '', description: '', category: 'umum' });
    } catch (err) {
      console.error('Error sending submission:', err);
      showToast('Gagal mengirim berkas', 'error');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm('Yakin ingin menghapus berita ini?')) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (!error) {
        setPosts(posts.filter(p => p.id !== id));
        showToast('Berita berhasil dihapus');
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-32 rounded-xl" />
            <Skeleton className="h-12 w-64 rounded-xl" />
            <Skeleton className="h-4 w-48 rounded-xl" />
          </div>
          <Skeleton className="h-12 w-32 rounded-2xl" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-slate-50">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-4 space-y-8">
            <Skeleton className="h-64 w-full rounded-[2.5rem]" />
            <Skeleton className="h-80 w-full rounded-[2.5rem]" />
          </div>
        </div>
      </main>
    </div>
  );

  const npsn = user?.user_metadata?.npsn || user?.email?.split('@')[0];
  const schoolName = schoolInfo?.name || 'Sekolah Anda';
  const themeColor = orgData.theme_color || '#2563eb';

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans" style={{ '--primary': themeColor } as any}>
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 pt-28 pb-16">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-2 rounded-xl">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-primary/60">Console Operator</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/dashboard/settings')}
                className="h-auto px-3 py-1.5 text-primary hover:text-primary hover:bg-primary/5 font-bold text-[10px] uppercase tracking-widest gap-2 rounded-xl border border-primary/10"
              >
                <Settings className="h-3 w-3" />
                Pengaturan
              </Button>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
              Dashboard <span className="text-primary">Sekolah</span>
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              {schoolName} <span className="w-1 h-1 bg-slate-300 rounded-full" /> NPSN: {npsn}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="flex-1 md:flex-none gap-2 border-slate-200 text-slate-600 hover:bg-white hover:text-red-600 hover:border-red-100 transition-all rounded-2xl h-12 px-6"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content: Posts (Col 8) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-8 space-y-8"
          >
            <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-[2.5rem] bg-white">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 gap-4 border-b border-slate-50">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Konten Publikasi</CardTitle>
                  <p className="text-slate-500 text-sm font-medium">Kelola berita, pengumuman, dan agenda sekolah</p>
                </div>
                <Button 
                  className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 transition-all active:scale-95" 
                  onClick={() => handleOpenPostModal()}
                >
                  <Plus className="h-5 w-5" /> Buat Konten
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <AnimatePresence mode="popLayout">
                  {posts.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-20 text-center"
                    >
                      <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform rotate-3">
                        <FileText className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Belum ada konten</h3>
                      <p className="text-slate-500 max-w-xs mx-auto">Mulai isi website sekolah Anda dengan berita atau pengumuman menarik.</p>
                    </motion.div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {posts.map((post, index) => (
                        <motion.div 
                          key={post.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group"
                        >
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                              post.category === 'pengumuman' ? 'bg-amber-50 text-amber-600' : 
                              post.category === 'agenda' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              <FileText className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                                  post.category === 'pengumuman' ? 'bg-amber-100 text-amber-700' : 
                                  post.category === 'agenda' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {post.category}
                                </span>
                                {!post.is_published && (
                                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400">
                                    Draft
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-primary transition-colors">{post.title}</h4>
                              <div className="flex items-center gap-2 mt-1.5 text-slate-400">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">
                                  {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-10 h-10 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5" 
                              onClick={() => handleOpenPostModal(post)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-10 h-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50" 
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Submissions Card */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-[2.5rem] bg-white">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 gap-4 border-b border-slate-50">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Pengiriman Berkas</CardTitle>
                  <p className="text-slate-500 text-sm font-medium">Kirim laporan atau dokumen ke Admin Kecamatan</p>
                </div>
                <Button 
                  variant="outline"
                  className="gap-2 border-primary/20 text-primary hover:bg-primary/5 rounded-2xl h-12 px-6 transition-all active:scale-95" 
                  onClick={() => setIsSubmissionModalOpen(true)}
                >
                  <Upload className="h-5 w-5" /> Kirim Berkas
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <AnimatePresence mode="popLayout">
                  {submissions.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-slate-400 text-sm font-medium">Belum ada berkas yang dikirim</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {submissions.slice(0, 5).map((sub) => (
                        <div key={sub.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-900 text-sm">{sub.file_name}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                  sub.status === 'verified' ? 'bg-green-100 text-green-700' :
                                  sub.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {sub.status}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {new Date(sub.created_at).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <a 
                            href={sub.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-primary/5 text-slate-400 hover:text-primary transition-all"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                      {submissions.length > 5 && (
                        <div className="p-4 text-center">
                          <Button variant="ghost" size="sm" className="text-primary font-bold text-xs uppercase tracking-wider">
                            Lihat Semua Berkas
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar (Col 4) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 space-y-8"
          >
            {/* Status Card */}
            <Card className="border-none shadow-2xl shadow-primary/20 bg-primary text-white overflow-hidden rounded-[2.5rem] relative group">
              <div className="absolute -right-8 -bottom-8 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
                <School className="h-48 w-48" />
              </div>
              <CardHeader className="p-8 pb-0">
                <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">Portal Aktif</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                    <span className="font-bold text-white/60 uppercase tracking-widest text-[10px]">Identitas</span>
                    <span className="font-black text-white">{npsn}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                    <span className="font-bold text-white/60 uppercase tracking-widest text-[10px]">Sinkronisasi</span>
                    <span className="font-black text-white">
                      {schoolInfo?.school_data?.[0]?.stats?.last_sync ? new Date(schoolInfo.school_data[0].stats.last_sync).toLocaleDateString('id-ID') : 'Ready'}
                    </span>
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={handleSyncDapodik}
                    disabled={isSyncing}
                    className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 transition-all active:scale-95 mt-4"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : 'Sync Dapodik'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Analysis Card */}
            {schoolInfo?.school_data?.[0]?.stats && (
              <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <Users className="h-5 w-5 text-slate-400" />
                    <CardTitle className="text-xl font-black tracking-tight text-slate-900">Analisis Data</CardTitle>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">Metrik kualitas data sekolah Anda</p>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-8">
                  {(() => {
                    const s = schoolInfo.school_data[0].stats;
                    const ratio = s.guru > 0 ? (s.siswa / s.guru).toFixed(1) : 'N/A';
                    const completeness = [
                      s.visi, s.misi, s.kontak_wa, s.kontak_email, s.address, s.lat
                    ].filter(Boolean).length;
                    const score = Math.round((completeness / 6) * 100);

                    return (
                      <>
                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rasio Siswa/Guru</p>
                              <p className="text-2xl font-black text-slate-800">1 : {ratio}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                              Number(ratio) < 20 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {Number(ratio) < 20 ? 'Ideal' : 'Padat'}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${Number(ratio) < 20 ? 'bg-green-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min((Number(ratio) / 40) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kelengkapan Profil</p>
                              <p className="text-2xl font-black text-slate-800">{score}%</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{completeness}/6 Field</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-1000"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Profile Website Card */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-1">
                  <Settings className="h-5 w-5 text-slate-400" />
                  <CardTitle className="text-xl font-black tracking-tight text-slate-900">Konfigurasi</CardTitle>
                </div>
                <p className="text-slate-500 text-xs font-medium">Update data publik yang tampil di website</p>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nama Sekolah</label>
                    <input 
                      type="text"
                      className="w-full p-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all"
                      placeholder="Nama Sekolah"
                      value={orgData.name}
                      onChange={(e) => setOrgData({...orgData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tipe Instansi</label>
                    <select 
                      className="w-full p-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all appearance-none"
                      value={orgData.type}
                      onChange={(e) => setOrgData({...orgData, type: e.target.value as any})}
                    >
                      <option value="sekolah">Sekolah</option>
                      <option value="dinas">Dinas</option>
                      <option value="umum">Umum</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alamat Sekolah</label>
                  <textarea 
                    className="w-full min-h-20 p-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all resize-none"
                    placeholder="Alamat lengkap sekolah..."
                    value={orgData.address}
                    onChange={(e) => setOrgData({...orgData, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Logo Sekolah</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                        {orgData.logo_url ? (
                          <img src={orgData.logo_url} alt="Logo Preview" className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <input 
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="logo-upload"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setIsUploadingLogo(true);
                                const url = await handleFileUpload(file, 'logos');
                                if (url) setOrgData({...orgData, logo_url: url});
                                setIsUploadingLogo(false);
                              }
                            }}
                          />
                          <label 
                            htmlFor="logo-upload"
                            className="flex items-center justify-center gap-2 w-full p-3 text-xs font-bold rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all"
                          >
                            {isUploadingLogo ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <Upload className="h-4 w-4 text-primary" />
                            )}
                            {isUploadingLogo ? 'Mengunggah...' : 'Upload Logo Baru'}
                          </label>
                        </div>
                        <input 
                          type="text"
                          className="w-full p-3 text-[10px] font-medium rounded-xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all"
                          placeholder="Atau tempel URL gambar..."
                          value={orgData.logo_url}
                          onChange={(e) => setOrgData({...orgData, logo_url: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Warna Tema</label>
                    <div className="flex gap-3">
                      <input 
                        type="color"
                        className="h-14 w-20 rounded-2xl border-2 border-slate-50 bg-slate-50/50 cursor-pointer"
                        value={orgData.theme_color}
                        onChange={(e) => setOrgData({...orgData, theme_color: e.target.value})}
                      />
                      <input 
                        type="text"
                        className="flex-1 p-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all"
                        value={orgData.theme_color}
                        onChange={(e) => setOrgData({...orgData, theme_color: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visi Sekolah</label>
                  <textarea 
                    className="w-full min-h-24 p-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all resize-none"
                    placeholder="Apa visi sekolah Anda?"
                    value={profileData.visi}
                    onChange={(e) => setProfileData({...profileData, visi: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Misi Sekolah</label>
                  <textarea 
                    className="w-full min-h-24 p-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all resize-none"
                    placeholder="Sebutkan misi sekolah Anda..."
                    value={profileData.misi}
                    onChange={(e) => setProfileData({...profileData, misi: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email</label>
                    <input 
                      type="email"
                      className="w-full p-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all"
                      placeholder="sekolah@email.com"
                      value={profileData.kontak_email}
                      onChange={(e) => setProfileData({...profileData, kontak_email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">WhatsApp</label>
                    <input 
                      type="text"
                      className="w-full p-4 text-sm font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all"
                      placeholder="0812..."
                      value={profileData.kontak_wa}
                      onChange={(e) => setProfileData({...profileData, kontak_wa: e.target.value})}
                    />
                  </div>
                </div>

                {/* Dynamic Data Section */}
                <div className="pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Tambahan (Dynamic)</label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDynamicFields([...dynamicFields, { key: '', value: '', type: 'text' }])}
                      className="h-8 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Tambah Field
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {dynamicFields.map((field, index) => (
                      <div key={index} className="flex flex-col gap-2 p-4 rounded-2xl border-2 border-slate-50 bg-slate-50/30 group/field relative">
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            className="flex-1 p-3 text-xs font-bold rounded-xl border-2 border-slate-100 bg-white focus:border-primary/20 focus:outline-none transition-all"
                            placeholder="Nama Data (e.g. Luas Tanah)"
                            value={field.key}
                            onChange={(e) => {
                              const newFields = [...dynamicFields];
                              newFields[index].key = e.target.value;
                              setDynamicFields(newFields);
                            }}
                          />
                          <select 
                            className="w-24 p-3 text-[10px] font-black uppercase tracking-widest rounded-xl border-2 border-slate-100 bg-white focus:border-primary/20 focus:outline-none transition-all appearance-none"
                            value={field.type}
                            onChange={(e) => {
                              const newFields = [...dynamicFields];
                              newFields[index].type = e.target.value as any;
                              setDynamicFields(newFields);
                            }}
                          >
                            <option value="text">TEXT</option>
                            <option value="number">NUM</option>
                            <option value="date">DATE</option>
                          </select>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0"
                            onClick={() => setDynamicFields(dynamicFields.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <input 
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          className="w-full p-3 text-xs font-medium rounded-xl border-2 border-slate-100 bg-white focus:border-primary/20 focus:outline-none transition-all"
                          placeholder={`Nilai ${field.key || 'Data'}...`}
                          value={field.value}
                          onChange={(e) => {
                            const newFields = [...dynamicFields];
                            newFields[index].value = e.target.value;
                            setDynamicFields(newFields);
                          }}
                        />
                      </div>
                    ))}
                    {dynamicFields.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic text-center py-2">Belum ada data tambahan</p>
                    )}
                  </div>
                </div>

                <Button 
                  className="w-full bg-slate-900 hover:bg-black text-white rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 transition-all active:scale-95" 
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline"
                className="h-24 rounded-3xl border-2 border-slate-50 bg-white hover:bg-primary/5 hover:border-primary/20 transition-all flex flex-col gap-2 group"
                onClick={() => {
                  const slug = schoolInfo?.slug;
                  if (!slug) return;
                  const host = window.location.host;
                  const url = host.includes('localhost') 
                    ? `http://${slug}.localhost:3000` 
                    : `https://${slug}.datadikcilebar.my.id`;
                  window.open(url, '_blank');
                }}
              >
                <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                  <ExternalLink className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Lihat Web</span>
              </Button>

              <Button 
                variant="outline"
                className="h-24 rounded-3xl border-2 border-slate-50 bg-white hover:bg-slate-50 transition-all flex flex-col gap-2 group"
                onClick={() => {
                  const npsn = schoolInfo?.school_data?.[0]?.npsn;
                  if (npsn) window.open(`https://referensi.data.kemdikbud.go.id/tabs.php?npsn=${npsn}`, '_blank');
                }}
              >
                <div className="p-2 bg-slate-100 rounded-xl group-hover:scale-110 transition-transform">
                  <Globe className="h-5 w-5 text-slate-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Ref. Kemdikbud</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Submission Modal */}
      <AnimatePresence>
        {isSubmissionModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubmissionModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Kirim Berkas</h3>
                  <p className="text-slate-500 text-sm font-medium">Unggah dokumen untuk Admin Kecamatan</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsSubmissionModalOpen(false)} className="rounded-2xl">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <form onSubmit={handleSendSubmission} className="p-8 space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700 ml-1">File Dokumen (PDF/Gambar/Doc)</label>
                  <div 
                    className={`border-2 border-dashed rounded-[2rem] p-10 text-center transition-all ${
                      submissionFormData.file_url ? 'border-green-200 bg-green-50' : 'border-slate-200 hover:border-primary/30 hover:bg-slate-50'
                    }`}
                  >
                    {isUploadingFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-sm font-bold text-primary">Mengunggah file...</p>
                      </div>
                    ) : submissionFormData.file_url ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-green-100 p-4 rounded-[1.5rem] text-green-600">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-bold text-green-700">{submissionFormData.file_name}</p>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSubmissionFormData({ ...submissionFormData, file_url: '', file_name: '' })}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
                        >
                          Ganti File
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-slate-100 p-5 rounded-[1.5rem] text-slate-400">
                          <Upload className="h-10 w-10" />
                        </div>
                        <div>
                          <p className="text-slate-900 font-bold">Pilih file atau tarik ke sini</p>
                          <p className="text-slate-400 text-xs mt-1">Maksimal 10MB (PDF, JPG, PNG, DOCX)</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          id="submission-file" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingFile(true);
                              const url = await handleFileUpload(file, 'submissions');
                              if (url) {
                                setSubmissionFormData({ ...submissionFormData, file_url: url, file_name: file.name });
                              }
                              setIsUploadingFile(false);
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          onClick={() => document.getElementById('submission-file')?.click()}
                          className="bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl px-6 h-10 shadow-sm"
                        >
                          Pilih File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Kategori</label>
                  <select 
                    value={submissionFormData.category}
                    onChange={(e) => setSubmissionFormData({ ...submissionFormData, category: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl h-12 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="umum">Umum</option>
                    <option value="laporan">Laporan Bulanan</option>
                    <option value="arsip">Arsip Sekolah</option>
                    <option value="pengajuan">Pengajuan Dana/Sarpras</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Keterangan (Opsional)</label>
                  <textarea 
                    value={submissionFormData.description}
                    onChange={(e) => setSubmissionFormData({ ...submissionFormData, description: e.target.value })}
                    placeholder="Tambahkan catatan singkat..."
                    className="w-full bg-slate-50 border-none rounded-[1.5rem] p-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary/20 transition-all min-h-25"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsSubmissionModalOpen(false)}
                    className="flex-1 rounded-2xl h-14 font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isUploadingFile || !submissionFormData.file_url}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Kirim Sekarang
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Modal */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPostModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-slate-50">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight">{editingPost ? 'Edit Konten' : 'Konten Baru'}</CardTitle>
                  <p className="text-slate-500 text-sm font-medium">Lengkapi detail informasi di bawah ini</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-2xl w-12 h-12 hover:bg-slate-100 transition-all"
                  onClick={() => setIsPostModalOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </CardHeader>
              <form onSubmit={handleSavePost}>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Judul Konten</label>
                    <input 
                      required
                      type="text"
                      className="w-full p-4 text-lg font-bold rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all"
                      placeholder="Judul yang menarik..."
                      value={postFormData.title}
                      onChange={(e) => setPostFormData({...postFormData, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kategori</label>
                      <select 
                        className="w-full p-4 font-bold rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all appearance-none"
                        value={postFormData.category}
                        onChange={(e) => setPostFormData({...postFormData, category: e.target.value})}
                      >
                        <option value="berita">Berita</option>
                        <option value="pengumuman">Pengumuman</option>
                        <option value="agenda">Agenda</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visibilitas</label>
                      <select 
                        className="w-full p-4 font-bold rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all appearance-none"
                        value={postFormData.is_published ? 'true' : 'false'}
                        onChange={(e) => setPostFormData({...postFormData, is_published: e.target.value === 'true'})}
                      >
                        <option value="true">Publik (Live)</option>
                        <option value="false">Draft (Privat)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gambar Unggulan</label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-2xl border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                        {postFormData.image_url ? (
                          <img src={postFormData.image_url} alt="Post Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-slate-200" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <input 
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="post-image-upload"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setIsUploadingPostImage(true);
                                const url = await handleFileUpload(file, 'posts');
                                if (url) setPostFormData({...postFormData, image_url: url});
                                setIsUploadingPostImage(false);
                              }
                            }}
                          />
                          <label 
                            htmlFor="post-image-upload"
                            className="flex items-center justify-center gap-2 w-full p-3 text-xs font-bold rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all"
                          >
                            {isUploadingPostImage ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <Upload className="h-4 w-4 text-primary" />
                            )}
                            {isUploadingPostImage ? 'Mengunggah...' : 'Upload Gambar'}
                          </label>
                        </div>
                        <input 
                          type="text"
                          className="w-full p-3 text-[10px] font-medium rounded-xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all"
                          placeholder="Atau tempel URL gambar..."
                          value={postFormData.image_url}
                          onChange={(e) => setPostFormData({...postFormData, image_url: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Isi Konten</label>
                    <textarea 
                      required
                    className="w-full min-h-62.5 p-4 font-medium rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:border-primary/20 focus:bg-white focus:outline-none transition-all resize-none"
                      placeholder="Tuliskan isi berita di sini secara lengkap..."
                      value={postFormData.content}
                      onChange={(e) => setPostFormData({...postFormData, content: e.target.value})}
                    />
                  </div>
                </CardContent>
                <div className="p-8 pt-0 flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-14 rounded-2xl font-bold border-slate-100 hover:bg-slate-50 transition-all"
                    onClick={() => setIsPostModalOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-2 bg-primary hover:bg-primary/90 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-95" 
                    disabled={isSavingPost}
                  >
                    {isSavingPost ? 'Menyimpan...' : 'Simpan & Publikasikan'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-200"
          >
            <div className={`px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border-2 ${
              toast.type === 'success' ? 'bg-white border-green-100 text-slate-900' : 'bg-white border-red-100 text-slate-900'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500" />
              )}
              <span className="font-bold text-sm">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

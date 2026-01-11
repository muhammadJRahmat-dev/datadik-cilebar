'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Files, 
  Search, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter,
  FileIcon,
  MoreVertical,
  ExternalLink,
  School,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Submission } from '@/types';

export default function FileManagerPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select('*, organizations(name, logo_url)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      showToast('Gagal memuat data file', 'error');
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: 'verified' | 'rejected') => {
    const { error } = await supabase
      .from('submissions')
      .update({ status })
      .eq('id', id);

    if (error) {
      showToast('Gagal memperbarui status', 'error');
    } else {
      showToast(`Status berhasil diperbarui menjadi ${status}`);
      fetchSubmissions();
    }
  };

  const handleDeleteSubmission = async (id: string, fileUrl: string) => {
    if (!confirm('Hapus file ini selamanya?')) return;

    try {
      // 1. Delete from storage if it's a Supabase storage URL
      if (fileUrl.includes('storage/v1/object/public/submissions/')) {
        const filePath = fileUrl.split('submissions/')[1];
        await supabase.storage.from('submissions').remove([filePath]);
      }

      // 2. Delete from database
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('File berhasil dihapus');
      fetchSubmissions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const isImage = (fileName: string) => {
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName);
  };

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.file_name.toLowerCase().includes(search.toLowerCase()) || 
                          s.organizations?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">File Manager</h1>
        <p className="text-slate-500 font-medium mt-1">Kelola dokumen dan kiriman file dari sekolah.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Cari nama file atau sekolah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-slate-100 bg-white shadow-sm font-medium"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'verified', 'rejected'].map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? 'default' : 'outline'}
              onClick={() => setFilterStatus(s)}
              className={`rounded-xl h-14 px-6 font-bold capitalize tracking-tight ${
                filterStatus === s ? 'shadow-lg shadow-primary/20' : 'bg-white border-slate-100'
              }`}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : filteredSubmissions.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <Files className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Tidak ada file ditemukan</p>
          </div>
        ) : (
          filteredSubmissions.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="group border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white hover:scale-[1.02] transition-all">
                <div className="aspect-video bg-slate-50 flex items-center justify-center relative overflow-hidden">
                  {isImage(s.file_name) ? (
                    <img src={s.file_url} alt={s.file_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <FileIcon className="h-16 w-16 text-slate-200 group-hover:scale-110 transition-transform duration-500" />
                  )}
                  
                  <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm z-10 ${
                    s.status === 'verified' ? 'bg-emerald-500 text-white' : 
                    s.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {s.status === 'pending' && <Clock className="h-3 w-3" />}
                    {s.status === 'verified' && <CheckCircle className="h-3 w-3" />}
                    {s.status === 'rejected' && <XCircle className="h-3 w-3" />}
                    {s.status}
                  </div>

                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button 
                      variant="white" 
                      size="icon" 
                      className="rounded-xl shadow-xl h-12 w-12"
                      asChild
                    >
                      <a href={s.file_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-5 w-5" />
                      </a>
                    </Button>
                    <Button 
                      variant="white" 
                      size="icon" 
                      className="rounded-xl shadow-xl h-12 w-12 text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteSubmission(s.id, s.file_url)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                      {s.organizations?.logo_url ? (
                        <img src={s.organizations.logo_url} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        <School className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Pengirim</span>
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">{s.organizations?.name}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 text-sm">{s.file_name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>

                  <div className="mt-6 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-grow rounded-xl border-slate-100 hover:bg-slate-50 gap-2 font-bold h-11 text-xs"
                      asChild
                    >
                      <a href={s.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" /> Unduh
                      </a>
                    </Button>
                    {s.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="icon" 
                          className="rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 h-11 w-11"
                          onClick={() => handleUpdateStatus(s.id, 'verified')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="destructive"
                          className="rounded-xl shadow-lg shadow-red-200 h-11 w-11"
                          onClick={() => handleUpdateStatus(s.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

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
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5 text-red-600" />}
            <span className="font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
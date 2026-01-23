'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Building2,
  Files,
  FileText,
  TrendingUp,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Submission } from '@/types';

export default function AdminKecamatanOverview() {
  const [loading, setLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalUsers: 0,
    totalFiles: 0,
    totalPosts: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch aggregate stats
      const [
        { count: schoolsCount },
        { count: usersCount },
        { count: filesCount },
        { count: postsCount }
      ] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('type', 'sekolah'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('submissions').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalSchools: schoolsCount || 0,
        totalUsers: usersCount || 0,
        totalFiles: filesCount || 0,
        totalPosts: postsCount || 0,
      });

      // 2. Fetch recent submissions with org names
      const { data: submissions, error: subError } = await supabase
        .from('submissions')
        .select(`
          *,
          organizations (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!subError && submissions) {
        setRecentSubmissions(submissions as any);
      }

    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight text-transparent bg-clip-text bg-linear-to-r from-slate-900 to-slate-500">Overview Dashboard</h1>
        <p className="text-slate-500 font-medium mt-1">Selamat datang kembali, Admin Kecamatan Cilebar.</p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { label: 'Total Sekolah', value: stats.totalSchools, icon: Building2, color: 'bg-blue-500' },
          { label: 'Total User', value: stats.totalUsers, icon: Users, color: 'bg-purple-500' },
          { label: 'File Kiriman', value: stats.totalFiles, icon: Files, color: 'bg-amber-500' },
          { label: 'Konten Berita', value: stats.totalPosts, icon: FileText, color: 'bg-emerald-500' },
        ].map((item, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</CardTitle>
                <div className={`${item.color} p-2 rounded-xl text-white shadow-lg shadow-${item.color.split('-')[1]}-200`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-10 w-20 rounded-xl" />
                ) : (
                  <div className="text-4xl font-black text-slate-900 tracking-tighter">{item.value}</div>
                )}
                <div className="mt-4 flex items-center gap-2 text-emerald-500">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">+12% Bulan Ini</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Submissions */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black tracking-tight">Kiriman File Terbaru</CardTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Update terakhir dari sekolah</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl">
              <Files className="h-6 w-6 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <div className="grow space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : recentSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <Files className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Belum ada kiriman file</p>
                </div>
              ) : (
                recentSubmissions.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="grow">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-slate-800 line-clamp-1">{sub.file_name}</p>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${sub.status === 'verified' ? 'bg-emerald-100 text-emerald-600' :
                            sub.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                          {sub.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{(sub as any).organizations?.name || 'Sekolah'}</span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Clock className="h-3 w-3" />
                          {new Date(sub.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white hover:shadow-md rounded-xl transition-all">
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {recentSubmissions.length > 0 && (
              <button className="w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:border-primary/20 hover:text-primary transition-all">
                Lihat Semua Kiriman
              </button>
            )}
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-slate-900 text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <CardHeader className="p-8 pb-0 relative z-10">
            <CardTitle className="text-xl font-black tracking-tight">Aktivitas Sistem</CardTitle>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Log sistem terkini</p>
          </CardHeader>
          <CardContent className="p-8 relative z-10">
            <div className="space-y-8">
              {[
                { time: '2 menit lalu', event: 'Sinkronisasi Dapodik Berhasil', user: 'System', color: 'bg-emerald-500' },
                { time: '1 jam lalu', event: 'User Baru Terdaftar', user: 'SDN Cikande I', color: 'bg-blue-500' },
                { time: '3 jam lalu', event: 'Update Profil Sekolah', user: 'SMKN Cilebar', color: 'bg-purple-500' },
              ].map((log, i) => (
                <div key={i} className="relative pl-6 border-l-2 border-slate-800 pb-2 group">
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${log.color} border-4 border-slate-900 group-hover:scale-125 transition-transform`} />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">{log.time}</p>
                  <p className="text-sm font-bold text-white mt-2 leading-tight group-hover:text-primary transition-colors">{log.event}</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">{log.user}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Health Status</p>
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-6 w-1.5 bg-emerald-500 rounded-full" />
                  ))}
                </div>
                <span className="text-sm font-black">Sistem Normal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
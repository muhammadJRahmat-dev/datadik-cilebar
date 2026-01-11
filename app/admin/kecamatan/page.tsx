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
  ArrowUpRight,
  School
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminKecamatanOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalUsers: 0,
    totalFiles: 0,
    totalPosts: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
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
    } catch (err) {
      console.error('Error fetching admin stats:', err);
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
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Overview Dashboard</h1>
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
                <div className={`${item.color} p-2 rounded-xl text-white`}>
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
            <Files className="h-6 w-6 text-slate-300" />
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
              ) : stats.totalFiles === 0 ? (
                <div className="text-center py-12">
                  <Files className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Belum ada kiriman file</p>
                </div>
              ) : (
                /* List of files will go here */
                <p className="text-slate-400 text-center py-8">Fitur dalam pengembangan...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black tracking-tight">Aktivitas Sistem</CardTitle>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Log sistem terkini</p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-8">
              {[
                { time: '2 menit lalu', event: 'Sinkronisasi Dapodik Berhasil', user: 'System' },
                { time: '1 jam lalu', event: 'User Baru Terdaftar', user: 'SDN Cikande I' },
                { time: '3 jam lalu', event: 'Update Profil Sekolah', user: 'SMKN Cilebar' },
              ].map((log, i) => (
                <div key={i} className="relative pl-6 border-l-2 border-slate-800 pb-2">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-slate-900" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">{log.time}</p>
                  <p className="text-sm font-bold text-white mt-2 leading-tight">{log.event}</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">{log.user}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
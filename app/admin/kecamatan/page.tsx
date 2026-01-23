'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Building2,
  Files,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Submission, Organization } from '@/types';

export default function AdminKecamatanOverview() {
  const [loading, setLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [systemStatus, setSystemStatus] = useState<'online' | 'checking' | 'error'>('checking');
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalUsers: 0,
    totalFiles: 0,
    totalPosts: 0,
  });


  const checkSystemStatus = useCallback(async () => {
    try {
      const { error } = await supabase.from('organizations').select('id', { head: true, count: 'exact' }).limit(1);
      setSystemStatus(error ? 'error' : 'online');
    } catch {
      setSystemStatus('error');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await checkSystemStatus();

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
        setRecentSubmissions(submissions as (Submission & { organizations: Pick<Organization, 'name'> })[]);
      }

    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [checkSystemStatus]);

  useEffect(() => {
    fetchData();
    const statusInterval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(statusInterval);
  }, [fetchData, checkSystemStatus]);

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
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black text-slate-900 tracking-tight text-transparent bg-clip-text bg-linear-to-r from-slate-900 to-slate-500 uppercase"
          >
            Command Center
          </motion.h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
            Kecamatan Cilebar &bull; Karawang
          </p>
        </div>

        <div className="flex items-center gap-3 px-6 py-3 bg-white shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${systemStatus === 'online' ? 'bg-emerald-400' : 'bg-red-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${systemStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
            System {systemStatus === 'online' ? 'Connected' : systemStatus === 'checking' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { label: 'Total Sekolah', value: stats.totalSchools, icon: Building2, color: 'bg-blue-600', trend: '+2 Sekolah' },
          { label: 'Total Operator', value: stats.totalUsers, icon: Users, color: 'bg-purple-600', trend: '+5 Baru' },
          { label: 'File Masuk', value: stats.totalFiles, icon: Files, color: 'bg-amber-600', trend: '89% Diverifikasi' },
          { label: 'Berita Publik', value: stats.totalPosts, icon: FileText, color: 'bg-emerald-600', trend: '+12 Minggu Ini' },
        ].map((item, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden group hover:scale-[1.05] transition-all duration-500 bg-white relative">
              <div className={`absolute top-0 right-0 w-32 h-32 ${item.color.replace('bg-', 'text-')}/5 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</CardTitle>
                <div className={`${item.color} p-3 rounded-2xl text-white shadow-lg shadow-${item.color.split('-')[1]}-200 transform group-hover:rotate-12 transition-transform`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {loading ? (
                  <Skeleton className="h-12 w-20 rounded-2xl" />
                ) : (
                  <div className="text-5xl font-black text-slate-900 tracking-tighter">{item.value}</div>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.trend}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Submissions */}
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/40 rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="p-10 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                <ShieldCheck className="h-7 w-7 text-primary" />
                Validasi Kiriman File
              </CardTitle>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Sinkronisasi data sekolah terkini</p>
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-primary transition-colors">
                <Zap className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-10 pt-6">
            <div className="space-y-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-50/50 p-6 rounded-[2rem]">
                    <Skeleton className="w-14 h-14 rounded-2xl" />
                    <div className="grow space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                ))
              ) : recentSubmissions.length === 0 ? (
                <div className="text-center py-20 bg-slate-50/50 rounded-[3rem]">
                  <Files className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Antrian Kiriman Kosong</p>
                </div>
              ) : (
                recentSubmissions.map((sub) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-5 p-6 rounded-[2rem] hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 ${sub.file_name.toLowerCase().includes('pdf') ? 'bg-red-500 shadow-red-100' :
                      sub.file_name.toLowerCase().includes('xlsx') ? 'bg-emerald-500 shadow-emerald-100' :
                        'bg-blue-500 shadow-blue-100'
                      }`}>
                      <FileText className="h-7 w-7" />
                    </div>
                    <div className="grow">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-black text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">{sub.file_name}</p>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-xs ${sub.status === 'verified' ? 'bg-emerald-100 text-emerald-600' :
                          sub.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                          {sub.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">{(sub as any).organizations?.name || 'Sekolah'}</span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          {new Date(sub.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <button className="p-3 bg-white shadow-md border border-slate-100 rounded-2xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all hover:bg-primary hover:text-white">
                      <ExternalLink className="h-5 w-5" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
            {recentSubmissions.length > 0 && (
              <button className="w-full mt-10 py-5 rounded-[2rem] border-2 border-dashed border-slate-100 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all">
                Buka Arsip Dokumen
              </button>
            )}
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[3rem] overflow-hidden bg-slate-900 text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />

          <CardHeader className="p-10 pb-6 relative z-10">
            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Activity className="h-7 w-7 text-primary animate-pulse" />
              Sistem Log
            </CardTitle>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Monitoring aktivitas real-time</p>
          </CardHeader>
          <CardContent className="p-10 pt-4 relative z-10">
            <div className="space-y-10">
              {[
                { time: '2 Menit Lalu', event: 'Sinkronisasi Dapodik Berhasil', user: 'SYSTEM CRON', color: 'bg-emerald-500' },
                { time: '45 Menit Lalu', event: 'Login Operator Sekolah', user: 'SDN CILEBAR II', color: 'bg-blue-500' },
                { time: '2 Jam Lalu', event: 'Verifikasi Dokumen SK', user: 'ADMIN KECAMATAN', color: 'bg-primary' },
                { time: '3 Jam Lalu', event: 'Update Kuota Siswa', user: 'SMKN 1 CILEBAR', color: 'bg-purple-500' },
              ].map((log, i) => (
                <div key={i} className="relative pl-8 border-l-2 border-slate-800 pb-1 group">
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${log.color} border-4 border-slate-900 group-hover:scale-150 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-2">{log.time}</p>
                  <p className="text-base font-black text-white leading-tight group-hover:text-primary transition-colors">{log.event}</p>
                  <div className="mt-3 inline-flex px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">{log.user}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 p-8 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-[2.5rem] border border-white/10 shadow-inner">
              <div className="flex justify-between items-center mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Security Audit</p>
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex gap-1.5 items-end h-10">
                  {[40, 70, 45, 90, 65, 85].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [`${h}%`, `${h - 15}%`, `${h}%`] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 bg-primary rounded-t-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    />
                  ))}
                </div>
                <div className="grow">
                  <span className="block text-xl font-black text-white tracking-tight">PROTECTED</span>
                  <span className="block text-[8px] font-black uppercase tracking-widest text-emerald-500 mt-1">End-to-End Encryption Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
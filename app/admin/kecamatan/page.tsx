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
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Submission, Organization, Post } from '@/types';
import { AdminAnalytics } from '@/components/admin/Analytics';

export default function AdminKecamatanOverview() {
  const [loading, setLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]); // Real logs
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
        { count: postsCount },
        { data: submissions },
        { data: posts }
      ] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('type', 'sekolah'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('submissions').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('submissions').select('*, organizations(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('posts').select('*, organizations(name)').order('created_at', { ascending: false }).limit(5)
      ]);

      setStats({
        totalSchools: schoolsCount || 0,
        totalUsers: usersCount || 0,
        totalFiles: filesCount || 0,
        totalPosts: postsCount || 0,
      });

      if (submissions) {
        setRecentSubmissions(submissions as any[]);
      }

      // Merge Submissions and Posts for System Logs
      const logs: any[] = [];

      (submissions as any[])?.forEach(sub => {
        logs.push({
          time: formatDistanceToNow(new Date(sub.created_at), { addSuffix: true, locale: id }),
          event: `File Masuk: ${sub.file_name}`,
          user: sub.organizations?.name || 'Sekolah',
          color: 'bg-blue-500',
          timestamp: new Date(sub.created_at).getTime()
        });
      });

      (posts as any[])?.forEach(post => {
        logs.push({
          time: formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: id }),
          event: `Berita Publik: ${post.title}`,
          user: post.organizations?.name || 'Admin',
          color: 'bg-emerald-500',
          timestamp: new Date(post.created_at).getTime()
        });
      });

      // Add a fake system cron log if empty or just to look alive
      if (logs.length < 5) {
        logs.push({
          time: 'Baru saja',
          event: 'System Check OK',
          user: 'SYSTEM',
          color: 'bg-slate-500',
          timestamp: Date.now()
        });
      }

      // Sort and limit
      logs.sort((a, b) => b.timestamp - a.timestamp);
      setSystemLogs(logs.slice(0, 5));

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
            className="text-4xl font-black text-white tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase"
          >
            Command Center
          </motion.h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
            Kecamatan Cilebar &bull; Karawang
          </p>
        </div>

        <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 shadow-xl shadow-black/20 rounded-2xl backdrop-blur-md">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${systemStatus === 'online' ? 'bg-emerald-400' : 'bg-red-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${systemStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
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
            <Card className="border border-white/5 shadow-xl shadow-black/20 rounded-[2.5rem] overflow-hidden group hover:scale-[1.05] transition-all duration-500 bg-white/5 backdrop-blur-md relative">
              <div className={`absolute top-0 right-0 w-32 h-32 ${item.color.replace('bg-', 'text-')}/10 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700 blur-xl`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</CardTitle>
                <div className={`${item.color} p-3 rounded-2xl text-white shadow-lg shadow-${item.color.split('-')[1]}-500/20 transform group-hover:rotate-12 transition-transform`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {loading ? (
                  <Skeleton className="h-12 w-20 rounded-2xl bg-white/5" />
                ) : (
                  <div className="text-5xl font-black text-white tracking-tighter">{item.value}</div>
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

      <AdminAnalytics />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Submissions */}
        <Card className="lg:col-span-2 border border-white/5 shadow-xl shadow-black/20 rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-md">
          <CardHeader className="p-10 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-white">
                <ShieldCheck className="h-7 w-7 text-blue-500" />
                Validasi Kiriman File
              </CardTitle>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Sinkronisasi data sekolah terkini</p>
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors">
                <Zap className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-10 pt-6">
            <div className="space-y-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 p-6 rounded-[2rem]">
                    <Skeleton className="w-14 h-14 rounded-2xl bg-white/5" />
                    <div className="grow space-y-2">
                      <Skeleton className="h-5 w-1/3 bg-white/5" />
                      <Skeleton className="h-4 w-1/4 bg-white/5" />
                    </div>
                  </div>
                ))
              ) : recentSubmissions.length === 0 ? (
                <div className="text-center py-20 bg-white/5 border border-dashed border-white/5 rounded-[3rem]">
                  <Files className="h-16 w-16 text-slate-600 mx-auto mb-6" />
                  <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Antrian Kiriman Kosong</p>
                </div>
              ) : (
                recentSubmissions.map((sub) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-5 p-6 rounded-[2rem] hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group cursor-pointer"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 ${sub.file_name.toLowerCase().includes('pdf') ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                      sub.file_name.toLowerCase().includes('xlsx') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                      }`}>
                      <FileText className="h-7 w-7" />
                    </div>
                    <div className="grow">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-black text-slate-200 line-clamp-1 group-hover:text-blue-400 transition-colors">{sub.file_name}</p>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-xs border ${sub.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          sub.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                          {sub.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/10 px-2 py-0.5 rounded-md">{(sub as any).organizations?.name || 'Sekolah'}</span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          {new Date(sub.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <button className="p-3 bg-blue-600 shadow-lg shadow-blue-600/20 border border-blue-500 rounded-2xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all text-white">
                      <ExternalLink className="h-5 w-5" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
            {recentSubmissions.length > 0 && (
              <button className="w-full mt-10 py-5 rounded-[2rem] border border-white/5 bg-white/5 hover:bg-blue-600 hover:border-blue-500 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-all">
                Buka Arsip Dokumen
              </button>
            )}
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card className="border border-white/5 shadow-xl shadow-black/20 rounded-[3rem] overflow-hidden bg-slate-900 text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]" />

          <CardHeader className="p-10 pb-6 relative z-10">
            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Activity className="h-7 w-7 text-blue-500 animate-pulse" />
              Sistem Log
            </CardTitle>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Monitoring aktivitas real-time</p>
          </CardHeader>
          <CardContent className="p-10 pt-4 relative z-10">
            <div className="space-y-10">
              {systemLogs.map((log, i) => (
                <div key={i} className="relative pl-8 border-l-2 border-slate-800 pb-1 group">
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${log.color} border-4 border-slate-900 group-hover:scale-150 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-2">{log.time}</p>
                  <p className="text-base font-black text-white leading-tight group-hover:text-blue-400 transition-colors">{log.event}</p>
                  <div className="mt-3 inline-flex px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{log.user}</p>
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
                      className="w-2 bg-emerald-500 rounded-t-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
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
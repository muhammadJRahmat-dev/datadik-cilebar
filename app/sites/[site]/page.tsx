'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { School, Users, GraduationCap, MapPin, Calendar, BookOpen, Globe, ShieldCheck, Award, Phone, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Organization, Post } from '@/types';

const CilebarMap = dynamic(() => import('@/components/map/CilebarMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-2xl" />
});

export default function SchoolPage() {
  const params = useParams();
  const site = params?.site as string;
  const [school, setSchool] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!site) return;
    try {
      setLoading(true);
      // 1. Fetch School Data
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          type,
          logo_url,
          address,
          theme_color,
          school_data (
            npsn,
            stats,
            dynamic_info
          )
        `)
        .eq('slug', site)
        .single();

      if (orgError) throw orgError;
      setSchool(org);

      // 2. Fetch School Posts
      const { data: schoolPosts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          organizations (
            name,
            slug
          )
        `)
        .eq('org_id', org.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (!postsError) setPosts(schoolPosts as Post[]);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [site]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar />

        <main className="grow pt-24 pb-24">
          {loading ? (
            <div className="container mx-auto px-4 space-y-8">
              <Skeleton className="h-64 w-full rounded-[3rem] bg-white/5" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Skeleton className="h-96 w-full rounded-[2.5rem] bg-white/5" />
                <Skeleton className="h-96 w-full lg:col-span-2 rounded-[2.5rem] bg-white/5" />
              </div>
            </div>
          ) : school ? (
            <div className="container mx-auto px-4 space-y-8">
              {/* Header Profile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
              >
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20" />
                <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-8">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-white p-4 shadow-2xl shadow-black/20 shrink-0 flex items-center justify-center border-4 border-white/10">
                    {school.logo_url ? (
                      <div className="relative w-full h-full">
                        <Image src={school.logo_url} alt={school.name} fill className="object-contain" />
                      </div>
                    ) : (
                      <School className="h-16 w-16 text-slate-300" />
                    )}
                  </div>
                  <div className="text-center md:text-left flex-1 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-2">
                      <ShieldCheck className="h-3 w-3" />
                      Terverifikasi
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
                      {school.name}
                    </h1>
                    <p className="text-slate-400 font-medium max-w-2xl text-sm md:text-base leading-relaxed">
                      {school.address || "Alamat belum tersedia"}
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                      {school.school_data?.[0]?.npsn && (
                        <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold font-mono">
                          NPSN: {school.school_data[0].npsn}
                        </span>
                      )}
                      <span className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        Status: Aktif
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Info (Col 4) */}
                <div className="lg:col-span-4 space-y-8">
                  {/* Stats Grid */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 gap-4"
                  >
                    {[
                      { label: 'Siswa', value: school.school_data?.[0]?.stats?.siswa || '-', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                      { label: 'Guru', value: school.school_data?.[0]?.stats?.guru || '-', icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                    ].map((stat, i) => (
                      <motion.div key={i} variants={itemVariants}>
                        <Card className={`border ${stat.border} ${stat.bg} backdrop-blur-md shadow-lg rounded-[2rem]`}>
                          <CardContent className="p-6 flex flex-col items-center text-center">
                            <stat.icon className={`h-8 w-8 ${stat.color} mb-3`} />
                            <div className="text-2xl font-black text-white tracking-tight">{stat.value}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Dynamic Info */}
                  <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                          <BookOpen className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-white">Informasi Sekolah</h3>
                      </div>

                      <div className="space-y-4">
                        {school.school_data?.[0]?.dynamic_info ? (
                          Object.entries(school.school_data[0].dynamic_info).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{key}</span>
                              <span className="text-sm font-black text-white text-right">{value as React.ReactNode}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-slate-500 text-sm italic">Belum ada informasi tambahan</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-white/10 space-y-3">
                        <div className="flex items-center gap-3 text-slate-400 text-sm">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="line-clamp-2">{school.address}</span>
                        </div>
                        {school.school_data?.[0]?.stats?.kontak_email && (
                          <div className="flex items-center gap-3 text-slate-400 text-sm">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span>{school.school_data[0].stats.kontak_email}</span>
                          </div>
                        )}
                        {school.school_data?.[0]?.stats?.kontak_wa && (
                          <div className="flex items-center gap-3 text-slate-400 text-sm">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span>{school.school_data[0].stats.kontak_wa}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Map */}
                  <div className="h-64 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-slate-900 relative">
                    <CilebarMap schools={[
                      {
                        id: school.id,
                        name: school.name,
                        lat: school.school_data?.[0]?.stats?.lat || -6.1956,
                        lng: school.school_data?.[0]?.stats?.lng || 107.3600,
                        slug: school.slug,
                        npsn: school.school_data?.[0]?.npsn
                      }
                    ]} />
                  </div>
                </div>

                {/* Main Content (Col 8) */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Visi Misi */}
                  {(school.school_data?.[0]?.stats?.visi || school.school_data?.[0]?.stats?.misi) && (
                    <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
                      <CardContent className="p-10 space-y-8">
                        {school.school_data?.[0]?.stats?.visi && (
                          <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                              <Award className="h-5 w-5 text-yellow-500" /> Visi
                            </h3>
                            <p className="text-slate-300 text-lg font-medium leading-relaxed italic">
                              "{school.school_data[0].stats.visi}"
                            </p>
                          </div>
                        )}
                        {school.school_data?.[0]?.stats?.misi && (
                          <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                              <Globe className="h-5 w-5 text-blue-500" /> Misi
                            </h3>
                            <p className="text-slate-400 leading-relaxed whitespace-pre-line">
                              {school.school_data[0].stats.misi}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Posts Grid */}
                  <div>
                    <h3 className="text-2xl font-black text-white mb-6 px-4">Berita & Kegiatan</h3>
                    {posts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {posts.map((post) => (
                          <a key={post.id} href={`/posts/${post.slug}`} className="group block">
                            <Card className="h-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
                              <div className="p-8 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border ${post.category === 'pengumuman' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    post.category === 'agenda' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                    {post.category}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    {new Date(post.created_at).toLocaleDateString('id-ID')}
                                  </span>
                                </div>
                                <h4 className="text-xl font-black text-white mb-4 line-clamp-2 group-hover:text-blue-400 transition-colors">
                                  {post.title}
                                </h4>
                                <p className="text-slate-400 text-sm line-clamp-3 mb-6 grow">
                                  {post.content?.replace(/<[^>]*>/g, '').slice(0, 120)}...
                                </p>
                                <div className="flex items-center text-xs font-bold text-slate-500 group-hover:text-white transition-colors uppercase tracking-widest gap-2">
                                  Baca Selengkapnya <div className="h-1 w-8 bg-blue-500 rounded-full" />
                                </div>
                              </div>
                            </Card>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 rounded-[3rem] bg-white/5 border border-dashed border-white/10 text-center">
                        <p className="text-slate-500 font-medium">Belum ada berita yang dipublikasikan.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="container mx-auto px-4 py-20 text-center text-white">
              <h1 className="text-4xl font-bold mb-4">Sekolah Tidak Ditemukan</h1>
              <Button asChild>
                <a href="/home">Kembali ke Beranda</a>
              </Button>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

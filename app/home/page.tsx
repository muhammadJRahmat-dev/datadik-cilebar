'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, Map as MapIcon, School, Users, Search, Filter, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Organization, Post } from '@/types';

// Dynamic import for the map to avoid SSR issues with Leaflet
const CilebarMap = dynamic(() => import('@/components/map/CilebarMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full rounded-3xl" />
});

export default function HomePage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [partners, setPartners] = useState<Organization[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;
  const [activeCategory, setActiveCategory] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Semua');
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalSiswa: 0,
    totalGuru: 0,
    byType: [] as { type: string, count: number, siswa: number }[]
  });
  const [loading, setLoading] = useState(true);

  const schoolTypes = ['Semua', 'TK', 'KB', 'SPS', 'SD', 'SMP', 'SMK'];

  useEffect(() => {
    async function fetchData() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const hasSupabase = !!url && !!key;

      if (!hasSupabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: orgs, error: orgError } = await supabase
          .from('organizations')
          .select(`
            id,
            name,
            slug,
            type,
            logo_url,
            school_data (
              npsn,
              stats
            )
          `)
          .in('type', ['sekolah', 'mitra']);

        if (orgError) throw orgError;

        if (orgs) {
          const formattedSchools = orgs
            .filter(o => o.type === 'sekolah')
            .map(org => {
              const schoolData = org.school_data?.[0] || {};
              const sStats = schoolData.stats || {};
              const lat = sStats.lat;
              const lng = sStats.lng;
              const siswa = sStats.siswa ?? 0;
              const guru = sStats.guru ?? 0;
              const jenis = sStats.jenis || (org.name.includes('SD') ? 'SD' : org.name.includes('SMP') ? 'SMP' : org.name.includes('SMK') ? 'SMK' : 'Lainnya');

              return {
                id: org.id,
                name: org.name,
                slug: org.slug,
                logo_url: org.logo_url,
                jenis,
                lat: lat ?? (-6.2146 + (Math.random() - 0.5) * 0.08),
                lng: lng ?? (107.3000 + (Math.random() - 0.5) * 0.08),
                siswa,
                guru,
                npsn: schoolData.npsn,
                ...sStats
              };
            });

          const formattedPartners = orgs
            .filter(o => o.type === 'mitra')
            .map(org => ({
              id: org.id,
              name: org.name,
              slug: org.slug,
              type: 'mitra' as any,
              logo_url: org.logo_url,
              theme_color: '#2563eb',
              created_at: ''
            }));

          setSchools(formattedSchools);
          setPartners(formattedPartners);

          const typeMap = new Map<string, { count: number, siswa: number }>();
          const totals = formattedSchools.reduce((acc, curr) => {
            const type = curr.jenis || 'Lainnya';
            const currentTypeData = typeMap.get(type) || { count: 0, siswa: 0 };
            typeMap.set(type, {
              count: currentTypeData.count + 1,
              siswa: currentTypeData.siswa + (curr.siswa || 0)
            });

            return {
              totalSchools: acc.totalSchools + 1,
              totalSiswa: acc.totalSiswa + (curr.siswa || 0),
              totalGuru: acc.totalGuru + (curr.guru || 0),
            };
          }, { totalSchools: 0, totalSiswa: 0, totalGuru: 0 });

          const byType = Array.from(typeMap.entries()).map(([type, data]) => ({
            type,
            count: data.count,
            siswa: data.siswa
          })).sort((a, b) => b.count - a.count);

          setStats({ ...totals, byType });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchPosts() {
      const from = (currentPage - 1) * postsPerPage;
      const to = from + postsPerPage - 1;

      let query = supabase
        .from('posts')
        .select(`
          *,
          organizations (
            name,
            slug
          )
        `, { count: 'exact' })
        .eq('is_published', true);

      if (activeCategory !== 'semua') {
        query = query.eq('category', activeCategory);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!error) {
        setLatestPosts(data as Post[]);
      }
    }

    fetchPosts();
  }, [currentPage, activeCategory]);

  const filteredSchools = useMemo(() => {
    let result = schools;

    if (searchQuery) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.npsn?.includes(searchQuery)
      );
    }

    if (selectedType !== 'Semua') {
      result = result.filter(s => s.jenis === selectedType);
    }

    return result;
  }, [searchQuery, selectedType, schools]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

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
      transition: { duration: 0.5, ease: "easeOut" }
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

        <main className="grow pt-24">
          {/* Hero Section */}
          <section id="tentang" className="relative py-24 md:py-32 lg:py-48 overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="text-center lg:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-blue-500/20 backdrop-blur-md"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Sistem Informasi Pendidikan Terpadu
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 text-white leading-[0.9] uppercase"
                  >
                    Smart Data <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">
                      Cilebar
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="text-lg md:text-xl text-slate-400 max-w-2xl lg:mx-0 mx-auto mb-12 leading-relaxed font-medium"
                  >
                    Portal transparansi data pendidikan Kecamatan Cilebar. Menghubungkan sekolah, siswa, dan masyarakat dalam satu ekosistem data modern.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="flex flex-wrap justify-center lg:justify-start gap-4"
                  >
                    <Button size="lg" className="rounded-2xl px-10 py-8 h-auto font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-500/30 hover:scale-105 transition-all group" asChild>
                      <a href="#peta">
                        Jelajahi Peta
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-2xl px-10 py-8 h-auto font-black uppercase tracking-widest bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all" asChild>
                      <a href="#statistik">Lihat Statistik</a>
                    </Button>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="hidden lg:block relative"
                >
                  <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full -z-10 animate-pulse" />
                  <div className="relative group overflow-hidden rounded-[3rem] shadow-2xl shadow-black/50 border border-white/10 animate-float bg-slate-900/50 backdrop-blur-sm">
                    {/* Placeholder content since hero-bg.png might be bright */}
                    <div className="w-full h-[500px] flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                      <LayoutGrid className="w-48 h-48 text-white/5" />
                    </div>
                  </div>

                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-6 -left-6 p-6 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 flex items-center gap-4 z-20"
                  >
                    <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/30">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Live Sync</p>
                      <p className="text-lg font-black text-white">100% Aktif</p>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-6 -right-6 p-6 bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 flex items-center gap-4 text-white z-20"
                  >
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
                      <School className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Sekolah</p>
                      <p className="text-lg font-black text-white">{stats.totalSchools || '-'}</p>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </section>

          <div className="container mx-auto px-4 py-16">
            <section id="statistik" className="mb-24">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
              >
                {[
                  { title: 'Total Sekolah', value: stats.totalSchools, icon: School, color: 'bg-blue-500', text: 'text-blue-400' },
                  { title: 'Total Siswa', value: stats.totalSiswa.toLocaleString('id-ID'), icon: Users, color: 'bg-indigo-500', text: 'text-indigo-400' },
                  { title: 'Total Guru', value: stats.totalGuru.toLocaleString('id-ID'), icon: LayoutGrid, color: 'bg-violet-500', text: 'text-violet-400' },
                ].map((stat, i) => (
                  <motion.div key={i} variants={itemVariants}>
                    <Card className="overflow-hidden border border-white/5 shadow-2xl shadow-black/20 bg-white/5 backdrop-blur-md group hover:bg-white/10 transition-all duration-500 rounded-3xl relative">
                      <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color} opacity-10 rounded-bl-[100px] transition-all group-hover:scale-110`} />
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.title}</CardTitle>
                        <div className={`p-2 rounded-xl bg-white/5 ${stat.text}`}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <Skeleton className="h-12 w-24 rounded-xl bg-white/10" />
                        ) : (
                          <div className="text-5xl font-black text-white tracking-tighter">{stat.value}</div>
                        )}
                        <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">Institusi Terdata</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {!loading && stats.byType.length > 0 && (
                <Card className="border border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem] bg-slate-900/50 backdrop-blur-xl text-white relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                  <CardHeader className="relative z-10 p-10 pb-0">
                    <CardTitle className="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter">
                      <div className="p-3 bg-blue-600 rounded-2xl">
                        <LayoutGrid className="h-6 w-6 text-white" />
                      </div>
                      Sebaran Sekolah per Jenjang
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 p-10 pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                      {stats.byType.map((item) => (
                        <div key={item.type} className="space-y-3 group">
                          <div className="flex justify-between items-end">
                            <span className="font-black uppercase tracking-widest text-sm text-slate-400 group-hover:text-blue-400 transition-colors">{item.type}</span>
                            <span className="text-2xl font-black tracking-tighter">{item.count} <span className="text-[10px] text-slate-500 uppercase tracking-widest">Unit</span></span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${(item.count / stats.totalSchools) * 100}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            <section id="peta" className="mb-24">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2.5 rounded-xl">
                    <MapIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-white">Peta Sebaran</h2>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      placeholder="Cari nama sekolah atau NPSN..."
                      className="pl-10 pr-4 py-2 rounded-full border border-white/10 bg-white/5 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 w-full sm:w-75 transition-all text-sm font-medium text-white placeholder:text-slate-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                    <Filter className="h-4 w-4 text-slate-500 shrink-0" />
                    {schoolTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${selectedType === type
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:border-blue-500/30 hover:text-blue-400'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative h-[600px] bg-slate-900">
                <CilebarMap schools={filteredSchools} />
                {filteredSchools.length === 0 && !loading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center p-8 bg-slate-900 rounded-[2.5rem] shadow-xl border border-white/10">
                      <School className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                      <p className="font-black text-xl tracking-tight text-white">Sekolah Tidak Ditemukan</p>
                      <p className="text-slate-400 text-sm mt-1">Gunakan kata kunci atau filter lain.</p>
                      <Button
                        variant="link"
                        onClick={() => { setSearchQuery(''); setSelectedType('Semua'); }}
                        className="mt-4 font-black uppercase tracking-tighter text-blue-400"
                      >
                        Reset Filter
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {partners.length > 0 && (
              <section id="mitra" className="mb-24 py-20 bg-white/5 backdrop-blur-md rounded-[4rem] border border-white/10 overflow-hidden relative">
                <div className="container mx-auto px-8 relative z-10">
                  <div className="text-center mb-16">
                    <h2 className="text-4xl font-black tracking-tight uppercase mb-4 text-white">Organisasi Mitra</h2>
                    <div className="w-20 h-1.5 bg-blue-500 mx-auto rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
                    {partners.map((partner) => (
                      <motion.a
                        key={partner.id}
                        href={`/sites/${partner.slug}`}
                        whileHover={{ scale: 1.05 }}
                        className="flex flex-col items-center group cursor-pointer"
                      >
                        <div className="w-28 h-28 bg-white/10 rounded-[2.5rem] flex items-center justify-center shadow-xl border border-white/10 group-hover:border-blue-500/50 transition-all p-6 group-hover:bg-white/20">
                          {partner.logo_url ? (
                            <div className="relative w-full h-full">
                              <Image src={partner.logo_url} alt={partner.name} fill className="object-contain" />
                            </div>
                          ) : (
                            <Users className="h-10 w-10 text-slate-500 group-hover:text-blue-400 transition-colors" />
                          )}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-all text-center mt-6">
                          {partner.name}
                        </span>
                      </motion.a>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section id="berita" className="mb-24">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <BookOpen className="h-7 w-7 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase leading-none text-white">Berita Terkini</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Dapatkan info terupdate di Cilebar</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                  {['semua', 'berita', 'pengumuman', 'agenda'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeCategory === cat
                        ? 'bg-blue-600 text-white shadow-xl'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
              >
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <motion.div key={`skeleton-${i}`} variants={itemVariants}>
                        <Card className="rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden bg-white/5 h-full p-10 backdrop-blur-md">
                          <Skeleton className="h-6 w-24 mb-6 rounded-xl bg-white/10" />
                          <Skeleton className="h-10 w-full mb-4 rounded-xl bg-white/10" />
                          <Skeleton className="h-10 w-3/4 mb-10 rounded-xl bg-white/10" />
                          <Skeleton className="h-20 w-full mb-8 rounded-xl bg-white/10" />
                          <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-32 rounded-lg bg-white/10" />
                            <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  ) : latestPosts.length > 0 ? (
                    latestPosts.map((post) => (
                      <motion.div
                        layout
                        key={post.id}
                        variants={itemVariants}
                      >
                        <a href={`/posts/${post.slug}`} className="block h-full group">
                          <Card className="border border-white/5 shadow-xl hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-700 rounded-[3.5rem] overflow-hidden bg-white/5 backdrop-blur-md flex flex-col h-full cursor-pointer relative hover:border-blue-500/30 hover:bg-white/10">
                            <div className="p-10 flex flex-col h-full">
                              <div className="flex justify-between items-start mb-8">
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-xs ${post.category === 'pengumuman' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                                  post.category === 'agenda' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                  }`}>
                                  {post.category}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <CardTitle className="text-2xl font-black tracking-tight text-white group-hover:text-blue-400 transition-colors leading-tight mb-6 line-clamp-3">
                                {post.title}
                              </CardTitle>
                              <CardContent className="p-0 grow">
                                <p className="text-slate-400 text-sm line-clamp-4 leading-relaxed font-medium">
                                  {post.content?.replace(/<[^>]*>/g, '').slice(0, 180)}...
                                </p>
                              </CardContent>
                              <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <School className="h-4 w-4 text-slate-400" />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 line-clamp-1 max-w-[150px]">
                                    {(post as any).organizations?.name || 'Sekolah'}
                                  </span>
                                </div>
                                <div className="w-12 h-12 bg-white/5 border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-500 rounded-2xl flex items-center justify-center text-white transition-all transform group-hover:rotate-12">
                                  <ArrowRight className="h-6 w-6" />
                                </div>
                              </div>
                            </div>
                          </Card>
                        </a>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-32 text-center bg-white/5 rounded-[4rem] border-2 border-dashed border-white/10">
                      <div className="bg-white/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <BookOpen className="h-10 w-10 text-slate-500" />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight text-white mb-2">Belum ada berita</h3>
                      <p className="text-slate-500 font-medium uppercase tracking-[0.2em] text-[10px]">Cek kembali beberapa saat lagi</p>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, Map as MapIcon, School, Users, Search, Filter, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Dynamic import for the map to avoid SSR issues with Leaflet
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CilebarMap = dynamic(() => import('@/components/map/CilebarMap'), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-muted animate-pulse rounded-xl" />
});

export default function HomePage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<any[]>([]);
  const [latestPosts, setLatestPosts] = useState<any[]>([]);
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
      const hasSupabase = !!url && !!key && !url.includes('placeholder.supabase.co');
      if (!hasSupabase) {
        setLoading(false);
        return;
      }
      try {
        // 1. Fetch Schools
        const { data: orgs, error: orgError } = await supabase
          .from('organizations')
          .select(`
            id,
            name,
            slug,
            school_data (
              npsn,
              stats
            )
          `);

        if (orgError) throw orgError;

        if (orgs) {
          const formattedSchools = orgs.map(org => {
            const schoolData = org.school_data?.[0] || {};
            const stats = schoolData.stats || {};
            
            return {
              id: org.id,
              name: org.name,
              slug: org.slug,
              lat: stats.lat || (-6.2146 + (Math.random() - 0.5) * 0.05),
              lng: stats.lng || (107.3000 + (Math.random() - 0.5) * 0.05),
              npsn: schoolData.npsn,
              ...stats
            };
          });

          setSchools(formattedSchools);
          setFilteredSchools(formattedSchools);

          // Calculate aggregate stats
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

        // 2. Fetch Latest Posts
        const { data: posts, error: postError } = await supabase
          .from('posts')
          .select(`
            id,
            title,
            content,
            category,
            created_at,
            organizations (
              name,
              slug
            )
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (!postError) setLatestPosts(posts || []);

      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
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
    
    setFilteredSchools(result);
  }, [searchQuery, selectedType, schools]);

  const filteredPosts = activeCategory === 'semua' 
    ? latestPosts 
    : latestPosts.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="grow pt-16">
        {/* Hero Section */}
        <section id="tentang" className="relative py-24 md:py-32 overflow-hidden bg-white border-b">
          <div className="absolute inset-0 bg-grid-slate-200 mask-[linear-gradient(180deg,white,transparent)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05),transparent_70%)]" />
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Portal Resmi Dapodik Cilebar
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 text-slate-900 leading-[0.9] uppercase">
              Smart Data <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-blue-600 to-indigo-600">
                Pendidikan
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              Sistem informasi terpadu untuk pemetaan, monitoring, dan transparansi data pendidikan di wilayah Kecamatan Cilebar, Karawang.
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Button size="lg" className="rounded-2xl px-10 py-8 h-auto font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 transition-all" asChild>
                <a href="#peta">Jelajahi Sekolah</a>
              </Button>
              <Button size="lg" variant="outline" className="rounded-2xl px-10 py-8 h-auto font-black uppercase tracking-widest bg-white border-2 hover:bg-slate-50 hover:scale-105 transition-all" asChild>
                <a href="#statistik">Data Statistik</a>
              </Button>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16">
          {/* Stats Grid */}
          <section id="statistik" className="mb-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card className="overflow-hidden border-none shadow-2xl bg-white group hover:scale-[1.05] transition-all duration-500 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Sekolah</CardTitle>
                  <div className="p-2 bg-primary/5 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                    <School className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-12 w-24 bg-slate-100 animate-pulse rounded-xl" />
                  ) : (
                    <div className="text-5xl font-black text-slate-900 tracking-tighter">{stats.totalSchools}</div>
                  )}
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Institusi Pendidikan</p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-none shadow-2xl bg-white group hover:scale-[1.05] transition-all duration-500 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Siswa</CardTitle>
                  <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Users className="h-5 w-5 text-blue-600 group-hover:text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-12 w-32 bg-slate-100 animate-pulse rounded-xl" />
                  ) : (
                    <div className="text-5xl font-black text-slate-900 tracking-tighter">{stats.totalSiswa.toLocaleString('id-ID')}</div>
                  )}
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Peserta Didik Aktif</p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-none shadow-2xl bg-white group hover:scale-[1.05] transition-all duration-500 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Guru</CardTitle>
                  <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <LayoutGrid className="h-5 w-5 text-indigo-600 group-hover:text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-12 w-28 bg-slate-100 animate-pulse rounded-xl" />
                  ) : (
                    <div className="text-5xl font-black text-slate-900 tracking-tighter">{stats.totalGuru.toLocaleString('id-ID')}</div>
                  )}
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Pendidik Terdata</p>
                </CardContent>
              </Card>
            </div>

            {/* Distribution Chart */}
            {!loading && stats.byType.length > 0 && (
              <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-slate-900 text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <CardHeader className="relative z-10 p-10 pb-0">
                  <CardTitle className="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter">
                    <div className="p-3 bg-primary rounded-2xl">
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
                          <span className="font-black uppercase tracking-widest text-sm text-slate-400 group-hover:text-primary transition-colors">{item.type}</span>
                          <span className="text-2xl font-black tracking-tighter">{item.count} <span className="text-[10px] text-slate-500 uppercase tracking-widest">Unit</span></span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                            style={{ width: `${(item.count / stats.totalSchools) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

        {/* Map Section */}
        <section id="peta" className="mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <MapIcon className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold tracking-tight">Peta Sebaran Sekolah</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Cari nama sekolah atau NPSN..." 
                  className="pl-10 pr-4 py-2 rounded-full border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-75 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                {schoolTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all shrink-0 ${
                      selectedType === type 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'bg-white border text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden border-none shadow-2xl relative h-125 bg-slate-100">
            <CilebarMap schools={filteredSchools} />
            {filteredSchools.length === 0 && !loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl border">
                  <School className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-xl">Sekolah Tidak Ditemukan</p>
                  <p className="text-muted-foreground">Coba ubah kata kunci atau filter pencarian Anda.</p>
                  <Button 
                    variant="link" 
                    onClick={() => {setSearchQuery(''); setSelectedType('Semua');}}
                    className="mt-2"
                  >
                    Reset Pencarian
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <p>Menampilkan <strong>{filteredSchools.length}</strong> dari <strong>{schools.length}</strong> sekolah</p>
            {selectedType !== 'Semua' && (
              <p>Filter: <span className="text-primary font-bold">{selectedType}</span></p>
            )}
          </div>
        </section>

        {/* Latest News Aggregator */}
        <section id="berita" className="mb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight uppercase leading-none">Berita Terkini</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Update terbaru dari seluruh sekolah di Cilebar</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] w-fit">
              {['semua', 'berita', 'pengumuman', 'agenda'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    activeCategory === cat 
                      ? 'bg-white text-primary shadow-xl shadow-slate-200/50' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredPosts.length > 0 ? filteredPosts.map((post) => (
                <motion.div
                  layout
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white flex flex-col h-full">
                    <CardHeader className="p-8 pb-0">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${
                          post.category === 'pengumuman' ? 'bg-amber-100 text-amber-600' : 
                          post.category === 'agenda' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {post.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <h3 className="text-xl font-black group-hover:text-primary transition-colors line-clamp-2 leading-tight tracking-tight mb-2">
                        {post.title}
                      </h3>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 grow flex flex-col justify-between">
                      <div>
                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6 font-medium">
                          {(post.content || '').replace(/<[^>]*>/g, '').substring(0, 120)}...
                        </p>
                      </div>

                      <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-2xl group-hover:bg-primary/5 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100">
                          <School className="h-4 w-4 text-slate-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 truncate uppercase tracking-tighter">
                          {post.organizations?.name}
                        </span>
                      </div>

                      <Button variant="ghost" className="w-full justify-between font-black uppercase tracking-widest text-[10px] group/btn hover:bg-primary hover:text-white rounded-xl py-6 transition-all duration-300" asChild>
                        <a 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            const slug = post.organizations?.slug;
                            if (!slug) return;
                            const host = window.location.host;
                            const url = host.includes('localhost') 
                              ? `http://${slug}.localhost:3000` 
                              : `https://${slug}.datadikcilebar.my.id`;
                            window.open(url, '_blank');
                          }}
                        >
                          Baca Selengkapnya
                          <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-24 text-center bg-white rounded-[3rem] shadow-xl shadow-slate-100/50 border-2 border-dashed border-slate-100"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="h-8 w-8 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Belum ada konten</h3>
                  <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium mt-2">Tidak ada {activeCategory === 'semua' ? 'konten' : activeCategory} yang ditemukan untuk saat ini.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>

    <Footer />
  </div>
);
}

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
            jml_siswa,
            jml_guru,
            lat,
            lng,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="pt-32 pb-20 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
              <Skeleton className="w-40 h-40 rounded-3xl bg-slate-800" />
              <div className="grow space-y-4">
                <div className="flex gap-2 justify-center md:justify-start">
                  <Skeleton className="h-6 w-24 rounded-full bg-slate-800" />
                  <Skeleton className="h-6 w-24 rounded-full bg-slate-800" />
                </div>
                <Skeleton className="h-16 w-3/4 md:w-2/3 rounded-2xl bg-slate-800 mx-auto md:mx-0" />
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <Skeleton className="h-4 w-40 bg-slate-800" />
                  <Skeleton className="h-4 w-32 bg-slate-800" />
                  <Skeleton className="h-4 w-48 bg-slate-800" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="container mx-auto px-4 py-12 grow max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-48 rounded-3xl" />
                <Skeleton className="h-48 rounded-3xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-8 w-48 rounded-xl" />
                <Skeleton className="h-[400px] rounded-3xl" />
              </div>
            </div>
            <div className="space-y-8">
              <Skeleton className="h-96 rounded-3xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <School className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Sekolah Tidak Ditemukan</h1>
          <p className="text-muted-foreground">Maaf, data untuk sekolah "{site}" belum terdaftar.</p>
          <Button asChild>
            <a href="/">Kembali ke Beranda</a>
          </Button>
        </div>
      </div>
    );
  }

  const data = school.school_data?.[0] || {};
  const isSchool = school.type === 'sekolah';
  const sStats = data.stats || data.dynamic_info || {};
  const schoolAddress = school.address || sStats.address || 'Kecamatan Cilebar, Karawang, Jawa Barat';
  const schoolEmail = sStats.kontak_email || 'info@cilebar.datadik.id';
  const schoolWA = sStats.kontak_wa || '';
  const themeColor = school.theme_color || '#2563eb';

  const KNOWN_KEYS = ['siswa', 'guru', 'pegawai', 'rombel', 'jenis', 'status', 'visi', 'misi', 'kontak_wa', 'kontak_email', 'last_sync', 'lat', 'lng', 'address'];
  const dynamicInfo = Object.entries(sStats)
    .filter(([key]) => !KNOWN_KEYS.includes(key))
    .map(([key, value]) => ({ label: key, value: String(value) }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ '--primary': themeColor } as any}>
      <Navbar />

      <header className="bg-slate-900 text-white pt-32 pb-16 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="w-40 h-40 bg-white rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white/20 overflow-hidden relative">
              {school.logo_url ? (
                <Image src={school.logo_url} alt={school.name} width={160} height={160} className="object-contain p-4" />
              ) : (
                <div className="p-8 bg-slate-50 rounded-full">
                  {isSchool ? <School className="h-12 w-12 text-slate-400" /> : <Users className="h-12 w-12 text-slate-400" />}
                </div>
              )}
            </div>
            <div className="text-center md:text-left grow">
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-(--primary) text-white text-[10px] font-black uppercase tracking-widest">
                  {school.type === 'mitra' ? 'ORGANISASI MITRA' : (school.type || sStats.jenis || 'SEKOLAH')}
                </span>
                <span className="px-3 py-1 rounded-full bg-green-500 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                  {sStats.status || 'AKTIF'}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase leading-none">
                {school.name}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-400 font-medium">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-(--primary)" /> {schoolAddress}
                </span>
                {isSchool && (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-(--primary)" /> NPSN: {data.npsn || '-'}
                  </span>
                )}
              </div>
            </div>
            <div className="hidden lg:block">
              <Button size="lg" className="rounded-2xl font-bold px-8 py-8 h-auto shadow-xl shadow-primary/20 bg-(--primary) hover:opacity-90" asChild>
                <a href={schoolWA ? `https://wa.me/${schoolWA.replace(/\D/g, '')}` : '#'} target="_blank">
                  HUBUNGI KAMI
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 grow max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-12"
        >
          <div className="lg:col-span-2 space-y-12">
            <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6">
                    <Award className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Visi</h3>
                  <p className="text-slate-600 text-sm leading-relaxed italic">
                    {sStats.visi ? `"${sStats.visi}"` : `Visi belum diatur oleh operator.`}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-6">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Misi</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {sStats.misi || `Misi belum diatur oleh operator.`}
                  </p>
                </CardContent>
              </Card>
            </motion.section>

            {isSchool && (
              <motion.section variants={itemVariants}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-(--primary)" /> Lokasi Sekolah
                  </h2>
                </div>
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                  <CardContent className="p-0">
                    <CilebarMap schools={[{
                      id: school.id,
                      name: school.name,
                      lat: (sStats.lat ?? data.lat) || -6.2146,
                      lng: (sStats.lng ?? data.lng) || 107.3000,
                      slug: school.slug,
                      npsn: data.npsn
                    }]} />
                  </CardContent>
                </Card>
              </motion.section>
            )}

            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-(--primary)" /> Berita & Pengumuman
                </h2>
              </div>
              <div className="grid gap-4">
                {posts.length > 0 ? posts.map((item) => (
                  <Card key={item.id} className="group hover:shadow-xl transition-all border-none shadow-md overflow-hidden rounded-2xl bg-white">
                    <a href={`/posts/${item.slug}`}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${item.category === 'pengumuman' ? 'bg-amber-100 text-amber-600' :
                            item.category === 'agenda' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                            {item.category}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-bold uppercase tracking-tighter">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="font-bold text-xl group-hover:text-(--primary) transition-colors line-clamp-2 text-slate-800 tracking-tight">{item.title}</h3>
                      </CardContent>
                    </a>
                  </Card>
                )) : (
                  <div className="py-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                    <BookOpen className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Belum ada berita</h3>
                  </div>
                )}
              </div>
            </motion.section>
          </div>

          <div className="space-y-8">
            {isSchool && (
              <motion.div variants={itemVariants}>
                <Card className="shadow-2xl border-none bg-white rounded-3xl overflow-hidden">
                  <div className="bg-slate-900 p-6 text-white">
                    <h3 className="text-xl font-black uppercase tracking-widest">Statistik Cepat</h3>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                          <Users className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa</p>
                          <p className="text-2xl font-black text-slate-800 leading-none">{sStats.siswa?.toLocaleString('id-ID') || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                          <GraduationCap className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guru</p>
                          <p className="text-2xl font-black text-slate-800 leading-none">{sStats.guru?.toLocaleString('id-ID') || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rombel</p>
                          <p className="text-2xl font-black text-slate-800 leading-none">{sStats.rombel || 0}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {dynamicInfo.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="shadow-2xl border-none bg-white rounded-3xl overflow-hidden">
                  <div className="bg-slate-50 p-6 border-b border-slate-100">
                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-800">Informasi Tambahan</h3>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {dynamicInfo.map((info, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{info.label}</span>
                        <span className="text-sm font-black text-slate-700">{info.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

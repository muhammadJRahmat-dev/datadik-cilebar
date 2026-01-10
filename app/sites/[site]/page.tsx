'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Users, GraduationCap, MapPin, Calendar, BookOpen, Loader2, ArrowLeft, Globe, ShieldCheck, Award, Phone, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';

const CilebarMap = dynamic(() => import('@/components/map/CilebarMap'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-muted animate-pulse rounded-3xl" />
});

export default function SchoolPage() {
  const params = useParams();
  const site = params.site as string;
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchool() {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select(`
            id,
            name,
            slug,
            school_data (
              npsn,
              address,
              stats
            )
          `)
          .eq('slug', site)
          .single();

        if (error) throw error;
        setSchool(data);
      } catch (err) {
        console.error('Error fetching school:', err);
      } finally {
        setLoading(false);
      }
    }

    if (site) fetchSchool();
  }, [site]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">Memuat data sekolah...</p>
        </div>
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
  const stats = data.stats || {};

  const news = [
    { id: 1, title: 'Penerimaan Peserta Didik Baru 2026', date: '10 Jan 2026', category: 'Pengumuman' },
    { id: 2, title: 'Rapat Orang Tua Murid Semester Genap', date: '08 Jan 2026', category: 'Agenda' },
    { id: 3, title: 'Juara 1 Lomba Cerdas Cermat Tingkat Kecamatan', date: '05 Jan 2026', category: 'Berita' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* School Header */}
      <header className="bg-slate-900 text-white pt-32 pb-16 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="w-40 h-40 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.3)] border-4 border-white/20 overflow-hidden transform hover:scale-105 transition-transform duration-500">
              <School className="h-20 w-20 text-slate-900" />
            </div>
            <div className="text-center md:text-left grow">
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em]">
                  {stats.jenis || 'SEKOLAH'}
                </span>
                <span className="px-3 py-1 rounded-full bg-green-500 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                  {stats.status || 'AKTIF'}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase leading-none">
                {school.name}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-400 font-medium">
                <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                  <MapPin className="h-4 w-4 text-primary" /> {data.address || 'Kecamatan Cilebar, Karawang'}
                </span>
                <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                  <ShieldCheck className="h-4 w-4 text-primary" /> NPSN: {data.npsn || '-'}
                </span>
                <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                  <Globe className="h-4 w-4 text-primary" /> cilebar.datadik.id
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <Button size="lg" className="rounded-2xl font-bold px-8 py-8 h-auto shadow-xl shadow-primary/20">
                HUBUNGI SEKOLAH
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 grow max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Overview Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group">
                <CardContent className="p-8">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                    <Award className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Visi & Misi</h3>
                  <p className="text-slate-600 text-sm leading-relaxed italic">
                    "Terwujudnya insan yang cerdas, kompetitif, dan berakhlak mulia melalui layanan pendidikan yang berkualitas dan inklusif di wilayah Cilebar."
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group">
                <CardContent className="p-8">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Kurikulum</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Menggunakan Kurikulum Merdeka yang disesuaikan dengan kearifan lokal untuk mencetak generasi yang inovatif dan siap menghadapi tantangan zaman.
                  </p>
                </CardContent>
              </Card>
            </section>
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" /> Lokasi Sekolah
                </h2>
              </div>
              <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                  <CilebarMap schools={[{
                    id: school.id,
                    name: school.name,
                    lat: -6.2146, // Default Cilebar center for now
                    lng: 107.3000,
                    slug: school.slug,
                    npsn: data.npsn
                  }]} />
                </CardContent>
              </Card>
              <p className="mt-4 text-sm text-slate-500 flex items-center gap-2 px-2">
                <MapPin className="h-4 w-4" /> {data.address || 'Kecamatan Cilebar, Karawang, Jawa Barat'}
              </p>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" /> Berita & Pengumuman
                </h2>
                <Button variant="ghost" className="text-primary font-bold">Lihat Semua</Button>
              </div>
              <div className="grid gap-4">
                {news.map((item) => (
                  <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 border-none shadow-md cursor-pointer overflow-hidden rounded-2xl bg-white">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-primary/10 text-primary rounded-lg">{item.category}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-bold uppercase tracking-tighter"><Calendar className="h-3 w-3" /> {item.date}</span>
                      </div>
                      <h3 className="font-bold text-xl group-hover:text-primary transition-colors line-clamp-2 text-slate-800 tracking-tight">{item.title}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="shadow-2xl border-none bg-white rounded-3xl overflow-hidden">
              <div className="bg-slate-900 p-6 text-white">
                <h3 className="text-xl font-black uppercase tracking-widest">Statistik Cepat</h3>
                <p className="text-xs text-slate-400 font-medium">Data Terupdate Dapodik 2026</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa</p>
                      <p className="text-2xl font-black text-slate-800 leading-none">{stats.siswa?.toLocaleString('id-ID') || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-green-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guru</p>
                      <p className="text-2xl font-black text-slate-800 leading-none">{stats.guru?.toLocaleString('id-ID') || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-orange-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rombel</p>
                      <p className="text-2xl font-black text-slate-800 leading-none">{stats.rombel || 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-white shadow-2xl border-none rounded-3xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
              <CardContent className="p-8 relative z-10">
                <h3 className="font-black text-2xl mb-4 tracking-tighter uppercase leading-none">Butuh Bantuan?</h3>
                <p className="text-sm text-white/80 mb-8 leading-relaxed font-medium">Hubungi bagian administrasi sekolah untuk informasi lebih lanjut mengenai pendaftaran atau program sekolah.</p>
                <div className="space-y-3">
                  <Button variant="secondary" className="w-full font-black uppercase tracking-widest rounded-xl py-6 shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Hubungi WA
                  </Button>
                  <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white font-black uppercase tracking-widest rounded-xl py-6 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email Kami
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

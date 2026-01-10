'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Users, GraduationCap, MapPin, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
    <div className="min-h-screen bg-background">
      {/* School Header */}
      <header className="bg-primary text-primary-foreground py-12 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
              <School className="h-16 w-16 text-primary" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight uppercase">{school.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-primary-foreground/90">
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm">
                  <MapPin className="h-4 w-4" /> {data.address || 'Kecamatan Cilebar, Karawang'}
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm font-mono">
                  NPSN: {data.npsn || '-'}
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm">
                  {stats.jenis || 'SEKOLAH'} - {stats.status || 'Aktif'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" /> Berita & Pengumuman
                </h2>
                <Button variant="ghost" className="text-primary">Lihat Semua</Button>
              </div>
              <div className="grid gap-4">
                {news.map((item) => (
                  <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary cursor-pointer overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-primary/10 text-primary rounded">{item.category}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium"><Calendar className="h-3 w-3" /> {item.date}</span>
                      </div>
                      <h3 className="font-bold text-xl group-hover:text-primary transition-colors line-clamp-2">{item.title}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-xl border-none bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <CardTitle className="text-xl font-bold uppercase tracking-tight">Data Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-muted-foreground">Siswa</span>
                  </div>
                  <span className="text-2xl font-bold">{stats.siswa?.toLocaleString('id-ID') || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-muted-foreground">Guru</span>
                  </div>
                  <span className="text-2xl font-bold">{stats.guru?.toLocaleString('id-ID') || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                      <Loader2 className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-muted-foreground">Rombel</span>
                  </div>
                  <span className="text-2xl font-bold">{stats.rombel || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground shadow-2xl border-none">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Hubungi Kami</h3>
                <p className="text-sm text-primary-foreground/80 mb-4">Butuh informasi lebih lanjut? Silakan hubungi tata usaha sekolah kami.</p>
                <Button variant="secondary" className="w-full font-bold">Kirim Pesan</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t py-12 bg-muted/30 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <School className="h-5 w-5 text-muted-foreground" />
            <span className="font-bold text-muted-foreground uppercase tracking-widest">Datadik Cilebar</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {school.name}. Didukung oleh Datadik Cilebar.
          </p>
        </div>
      </footer>
    </div>
  );

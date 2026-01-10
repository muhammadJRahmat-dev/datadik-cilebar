'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Users, GraduationCap, MapPin, Calendar, BookOpen } from 'lucide-react';

export default function SchoolPage() {
  const params = useParams();
  const site = params.site as string;

  // This would normally come from Supabase based on the 'site' slug
  const schoolInfo = {
    name: site.toUpperCase().replace(/-/g, ' '),
    npsn: '20212345',
    address: 'Jl. Raya Cilebar No. 123, Karawang',
    students: 350,
    teachers: 24,
    accreditation: 'A',
    themeColor: '#2563eb',
  };

  const news = [
    { id: 1, title: 'Penerimaan Peserta Didik Baru 2026', date: '10 Jan 2026', category: 'Pengumuman' },
    { id: 2, title: 'Rapat Orang Tua Murid Semester Genap', date: '08 Jan 2026', category: 'Agenda' },
    { id: 3, title: 'Juara 1 Lomba Cerdas Cermat Tingkat Kecamatan', date: '05 Jan 2026', category: 'Berita' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* School Header */}
      <header className="bg-primary text-primary-foreground py-12 shadow-lg" style={{ backgroundColor: schoolInfo.themeColor }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-inner">
              <School className="h-16 w-16 text-primary" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{schoolInfo.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-primary-foreground/90">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {schoolInfo.address}</span>
                <span className="flex items-center gap-1 font-mono">NPSN: {schoolInfo.npsn}</span>
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
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" /> Berita & Pengumuman
              </h2>
              <div className="grid gap-4">
                {news.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded">{item.category}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {item.date}</span>
                      </div>
                      <h3 className="font-bold text-lg hover:text-primary transition-colors">{item.title}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">Lihat Semua Berita</Button>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistik Sekolah</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" /> <span>Siswa</span>
                  </div>
                  <span className="font-bold">{schoolInfo.students}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4" /> <span>Guru</span>
                  </div>
                  <span className="font-bold">{schoolInfo.teachers}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-muted-foreground">Akreditasi</span>
                  <span className="font-bold text-primary">{schoolInfo.accreditation}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50 border-none">
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Hubungi Kami</h3>
                <p className="text-sm text-muted-foreground mb-4">Butuh informasi lebih lanjut? Silakan hubungi tata usaha sekolah kami.</p>
                <Button className="w-full">Kirim Pesan</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 {schoolInfo.name}. Didukung oleh Datadik Cilebar.</p>
        </div>
      </footer>
    </div>
  );
}

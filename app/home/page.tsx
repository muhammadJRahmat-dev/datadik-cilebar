'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, Map as MapIcon, School, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Dynamic import for the map to avoid SSR issues with Leaflet
const CilebarMap = dynamic(() => import('@/components/map/CilebarMap'), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-muted animate-pulse rounded-xl flex items-center justify-center">Memuat Peta...</div>
});

export default function HomePage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalSiswa: 0,
    totalGuru: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: orgs, error } = await supabase
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

        if (error) throw error;

        if (orgs) {
          const formattedSchools = orgs.map(org => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            // Default coordinates if not provided in DB yet
            lat: -6.2146 + (Math.random() - 0.5) * 0.05, 
            lng: 107.3000 + (Math.random() - 0.5) * 0.05,
            npsn: org.school_data?.[0]?.npsn,
            ...org.school_data?.[0]?.stats
          }));

          setSchools(formattedSchools);

          // Calculate aggregate stats
          const totals = formattedSchools.reduce((acc, curr) => ({
            totalSchools: acc.totalSchools + 1,
            totalSiswa: acc.totalSiswa + (curr.siswa || 0),
            totalGuru: acc.totalGuru + (curr.guru || 0),
          }), { totalSchools: 0, totalSiswa: 0, totalGuru: 0 });

          setStats(totals);
        }
      } catch (err) {
        console.error('Error fetching schools:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight uppercase">Datadik Cilebar</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Beranda</a>
            <a href="#peta" className="text-sm font-medium hover:text-primary transition-colors">Peta Sekolah</a>
            <a href="#statistik" className="text-sm font-medium hover:text-primary transition-colors">Statistik</a>
            <Button size="sm">Login Admin</Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-12 md:py-20">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Smart Data Pendidikan <span className="text-primary">Kecamatan Cilebar</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Pusat data informasi pendidikan terpadu untuk monitoring, pemetaan, dan publikasi sekolah di wilayah Cilebar.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="rounded-full" asChild>
              <a href="#peta">Jelajahi Sekolah</a>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" asChild>
              <a href="#statistik">Data Statistik</a>
            </Button>
          </div>
        </section>

        {/* Stats Grid */}
        <section id="statistik" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-primary/10 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Sekolah</CardTitle>
              <School className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{loading ? '...' : stats.totalSchools}</div>
              <p className="text-xs text-muted-foreground mt-1">Sekolah Terdaftar</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-primary/10 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Siswa</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{loading ? '...' : stats.totalSiswa.toLocaleString('id-ID')}</div>
              <p className="text-xs text-muted-foreground mt-1">Peserta Didik Aktif</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-primary/10 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Guru</CardTitle>
              <LayoutGrid className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{loading ? '...' : stats.totalGuru.toLocaleString('id-ID')}</div>
              <p className="text-xs text-muted-foreground mt-1">Pendidik & Tenaga Kependidikan</p>
            </CardContent>
          </Card>
        </section>

        {/* Map Section */}
        <section id="peta" className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <MapIcon className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Peta Sebaran Sekolah</h2>
          </div>
          <div className="rounded-xl overflow-hidden border shadow-2xl">
            <CilebarMap schools={schools} />
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <School className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground uppercase">Datadik Cilebar</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Datadik Cilebar. Sistem Informasi Data Pendidikan Terpadu.
          </p>
        </div>
      </footer>
    </div>
  );
}

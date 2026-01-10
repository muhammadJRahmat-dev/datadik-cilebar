'use client';

import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, Map as MapIcon, School, Users } from 'lucide-react';

// Dynamic import for the map to avoid SSR issues with Leaflet
const CilebarMap = dynamic(() => import('@/components/map/CilebarMap'), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-muted animate-pulse rounded-xl flex items-center justify-center">Memuat Peta...</div>
});

// Dummy data for schools
const dummySchools = [
  { id: '1', name: 'SDN Cilebar 1', lat: -6.2146, lng: 107.3000, slug: 'sdn-cilebar-1' },
  { id: '2', name: 'SDN Cilebar 2', lat: -6.2200, lng: 107.3100, slug: 'sdn-cilebar-2' },
  { id: '3', name: 'SMPN 1 Cilebar', lat: -6.2100, lng: 107.2900, slug: 'smpn-1-cilebar' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight">DATADIK CILEBAR</span>
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
            <Button size="lg" className="rounded-full">Jelajahi Sekolah</Button>
            <Button size="lg" variant="outline" className="rounded-full">Data Statistik</Button>
          </div>
        </section>

        {/* Stats Grid */}
        <section id="statistik" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sekolah</CardTitle>
              <School className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">SD, SMP, dan SMA</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Siswa</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4,281</div>
              <p className="text-xs text-muted-foreground">Tahun Ajaran 2025/2026</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Guru</CardTitle>
              <LayoutGrid className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">186</div>
              <p className="text-xs text-muted-foreground">PNS & Honorer</p>
            </CardContent>
          </Card>
        </section>

        {/* Map Section */}
        <section id="peta" className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <MapIcon className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Peta Sebaran Sekolah</h2>
          </div>
          <CilebarMap schools={dummySchools} />
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">© 2026 Datadik Cilebar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

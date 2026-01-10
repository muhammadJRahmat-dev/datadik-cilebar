'use client';

import Link from 'next/link';
import { School, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mainDomain = 'datadikcilebar.my.id';
  // Logic to determine if we are on a subdomain or localhost
  const getHomeUrl = () => {
    if (typeof window === 'undefined') return '/';
    const host = window.location.host;
    if (host.includes('localhost')) return 'http://localhost:3000';
    return `https://${mainDomain}`;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link 
          href={getHomeUrl()} 
          className="flex items-center gap-2 group"
        >
          <div className="bg-primary p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform">
            <School className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className={`font-bold text-xl tracking-tight leading-none ${
              isScrolled ? 'text-primary' : 'text-primary'
            }`}>DATADIK</span>
            <span className={`text-[10px] font-bold tracking-[0.2em] uppercase leading-none ${
              isScrolled ? 'text-muted-foreground' : 'text-primary/70'
            }`}>Cilebar - Karawang</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href={getHomeUrl()} className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors">Beranda</Link>
          <Link href={`${getHomeUrl()}#statistik`} className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors">Statistik</Link>
          <Link href={`${getHomeUrl()}#peta`} className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors">Peta</Link>
          <Button asChild className="font-bold uppercase tracking-wider shadow-lg hover:shadow-primary/20">
            <Link href="https://dapo.kemdikbud.go.id" target="_blank">Cek Dapodik</Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-primary"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-2xl p-4 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
          <Link href={getHomeUrl()} className="font-bold py-2 border-b">BERANDA</Link>
          <Link href={`${getHomeUrl()}#statistik`} className="font-bold py-2 border-b">STATISTIK</Link>
          <Link href={`${getHomeUrl()}#peta`} className="font-bold py-2 border-b">PETA</Link>
          <Button asChild className="w-full">
            <Link href="https://dapo.kemdikbud.go.id" target="_blank">CEK DAPODIK</Link>
          </Button>
        </div>
      )}
    </nav>
  );
}

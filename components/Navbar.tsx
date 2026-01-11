'use client';

import Link from 'next/link';
import { School, Menu, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Check for subdomain to fetch org branding
    const host = window.location.host;
    const mainDomain = 'datadikcilebar.my.id';
    const isSubdomain = host !== mainDomain && host !== `www.${mainDomain}` && !host.includes('localhost:3000');
    
    if (isSubdomain || (host.includes('localhost') && host.split('.').length > 1)) {
      const slug = host.split('.')[0];
      if (slug && slug !== 'www' && slug !== 'localhost') {
        setLoading(true);
        supabase
          .from('organizations')
          .select('name, logo_url, theme_color')
          .eq('slug', slug)
          .single()
          .then(({ data }) => {
            if (data) setOrg(data);
            setLoading(false);
          });
      }
    }

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

  const themeColor = org?.theme_color || '#2563eb';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'
    }`} style={{ '--nav-primary': themeColor } as any}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link 
          href={getHomeUrl()} 
          className="flex items-center gap-2 group"
        >
          <div className="bg-[var(--nav-primary)] p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center overflow-hidden w-10 h-10">
            {org?.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain" />
            ) : (
              <School className="h-6 w-6 text-white" />
            )}
          </div>
          <div className="flex flex-col max-w-[150px] sm:max-w-none">
            <span className={`font-bold text-lg sm:text-xl tracking-tight leading-none text-[var(--nav-primary)] truncate`}>
              {org?.name ? org.name.split(' ')[0] : 'DATADIK'}
            </span>
            <span className={`text-[9px] sm:text-[10px] font-bold tracking-[0.1em] sm:tracking-[0.2em] uppercase leading-none mt-1 ${
              isScrolled ? 'text-muted-foreground' : 'text-[var(--nav-primary)]/70'
            } truncate`}>
              {org?.name ? org.name.split(' ').slice(1).join(' ') : 'Cilebar - Karawang'}
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href={getHomeUrl()} className="text-sm font-bold uppercase tracking-wider hover:text-[var(--nav-primary)] transition-colors">Beranda</Link>
          <Link href={`${getHomeUrl()}#statistik`} className="text-sm font-bold uppercase tracking-wider hover:text-[var(--nav-primary)] transition-colors">Statistik</Link>
          <Link href={`${getHomeUrl()}#peta`} className="text-sm font-bold uppercase tracking-wider hover:text-[var(--nav-primary)] transition-colors">Peta</Link>
          
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" asChild className="font-bold uppercase tracking-wider text-[var(--nav-primary)] hover:bg-[var(--nav-primary)]/5">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="font-bold uppercase tracking-wider shadow-lg hover:shadow-primary/20 bg-[var(--nav-primary)] hover:opacity-90 transition-opacity">
              <Link href="https://dapo.kemdikbud.go.id" target="_blank">Cek Dapodik</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-[var(--nav-primary)]"
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
          <div className="flex flex-col gap-2 mt-2">
            <Button variant="outline" asChild className="w-full border-[var(--nav-primary)] text-[var(--nav-primary)] hover:bg-[var(--nav-primary)]/5 font-bold">
              <Link href="/login">LOGIN OPERATOR</Link>
            </Button>
            <Button asChild className="w-full bg-[var(--nav-primary)] hover:opacity-90 font-bold">
              <Link href="https://dapo.kemdikbud.go.id" target="_blank">CEK DAPODIK</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}

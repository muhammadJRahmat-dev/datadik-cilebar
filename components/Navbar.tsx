'use client';

import Link from 'next/link';
import { School, Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [isSchoolsOpen, setIsSchoolsOpen] = useState(false);
  const [isPartnersOpen, setIsPartnersOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUser(data);
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUser(data);
          });
      } else {
        setUser(null);
      }
    });

    // Check for subdomain to fetch org branding
    const host = window.location.host;
    const mainDomain = 'datadikcilebar.my.id';
    const isSubdomain = host !== mainDomain && host !== `www.${mainDomain}` && !host.includes('localhost:3000');

    if (isSubdomain || (host.includes('localhost') && host.split('.').length > 1)) {
      const slug = host.split('.')[0];
      if (slug && slug !== 'www' && slug !== 'localhost') {
        supabase
          .from('organizations')
          .select('name, logo_url, theme_color')
          .eq('slug', slug)
          .single()
          .then(({ data }) => {
            if (data) setOrg(data);
          });
      }
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const hasSupabase = !!url && !!key && !url.includes('placeholder.supabase.co');
    if (hasSupabase) {
      supabase
        .from('organizations')
        .select('name, slug, type')
        .order('name', { ascending: true })
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setSchools(data.filter((o) => o.type === 'sekolah').slice(0, 10));
            setPartners(data.filter((o) => o.type !== 'sekolah').slice(0, 10));
          }
        });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const getHomeUrl = () => '/';

  const themeColor = org?.theme_color || '#2563eb';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'
      }`} style={{ '--nav-primary': themeColor } as any}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link
          href={getHomeUrl()}
          className="flex items-center gap-3 group"
        >
          <div className="bg-(--nav-primary) p-2.5 rounded-2xl shadow-xl shadow-(--nav-primary)/20 group-hover:scale-110 transition-all duration-500 flex items-center justify-center overflow-hidden w-11 h-11 relative">
            <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
            {org?.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain relative z-10" />
            ) : (
              <School className="h-6 w-6 text-white relative z-10" />
            )}
          </div>
          <div className="flex flex-col">
            <span className={`font-black text-xl sm:text-2xl tracking-tighter leading-none text-(--nav-primary) group-hover:tracking-tight transition-all duration-500`}>
              {org?.name ? org.name.split(' ')[0] : 'DATADIK'}
            </span>
            <span className={`text-[9px] sm:text-[10px] font-black tracking-[0.3em] uppercase leading-none mt-1.5 ${isScrolled ? 'text-slate-400' : 'text-(--nav-primary)/60'
              } truncate`}>
              {org?.name ? org.name.split(' ').slice(1).join(' ') : 'CILEBAR - KRW'}
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href={getHomeUrl()} className="text-sm font-bold uppercase tracking-wider hover:text-(--nav-primary) transition-colors">Beranda</Link>
          <Link href={`${getHomeUrl()}#tentang`} className="text-sm font-bold uppercase tracking-wider hover:text-(--nav-primary) transition-colors">Tentang</Link>
          <Link href={`${getHomeUrl()}#statistik`} className="text-sm font-bold uppercase tracking-wider hover:text-(--nav-primary) transition-colors">Statistik</Link>
          <Link href={`${getHomeUrl()}#peta`} className="text-sm font-bold uppercase tracking-wider hover:text-(--nav-primary) transition-colors">Peta</Link>

          <div className="relative">
            <button
              className="text-sm font-bold uppercase tracking-wider hover:text-(--nav-primary) transition-colors inline-flex items-center gap-1"
              onClick={() => { setIsPartnersOpen(!isPartnersOpen); setIsSchoolsOpen(false); }}
            >
              Organisasi Mitra <ChevronDown className="h-4 w-4" />
            </button>
            {isPartnersOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border shadow-xl rounded-xl p-2 z-100">
                {partners.length > 0 ? partners.map((p) => (
                  <Link key={p.slug} href={`/sites/${p.slug}`} className="block px-3 py-2 rounded-lg hover:bg-(--nav-primary)/5">
                    {p.name}
                  </Link>
                )) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Belum ada data</div>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              className="text-sm font-bold uppercase tracking-wider hover:text-(--nav-primary) transition-colors inline-flex items-center gap-1"
              onClick={() => { setIsSchoolsOpen(!isSchoolsOpen); setIsPartnersOpen(false); }}
            >
              Sekolah <ChevronDown className="h-4 w-4" />
            </button>
            {isSchoolsOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border shadow-xl rounded-xl p-2 z-100">
                {schools.length > 0 ? schools.map((s) => (
                  <Link key={s.slug} href={`/sites/${s.slug}`} className="block px-3 py-2 rounded-lg hover:bg-(--nav-primary)/5">
                    {s.name}
                  </Link>
                )) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Belum ada data</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {user ? (
              <Button variant="ghost" asChild className="font-bold uppercase tracking-wider text-(--nav-primary) hover:bg-(--nav-primary)/5">
                <Link href={user.role === 'admin_kecamatan' ? '/admin/kecamatan' : '/dashboard'}>Dashboard</Link>
              </Button>
            ) : (
              <Button variant="ghost" asChild className="font-bold uppercase tracking-wider text-(--nav-primary) hover:bg-(--nav-primary)/5">
                <Link href="/login">Login</Link>
              </Button>
            )}
            <Button asChild className="font-bold uppercase tracking-wider shadow-lg hover:shadow-primary/20 bg-(--nav-primary) hover:opacity-90 transition-opacity">
              <Link href="https://dapo.kemendikdasmen.go.id/progres/3/022132" target="_blank">Cek Dapodik</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-(--nav-primary)"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-2xl p-4 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
          <Link href={getHomeUrl()} className="font-bold py-2 border-b">BERANDA</Link>
          <Link href={`${getHomeUrl()}#tentang`} className="font-bold py-2 border-b">TENTANG</Link>
          <Link href={`${getHomeUrl()}#statistik`} className="font-bold py-2 border-b">STATISTIK</Link>
          <Link href={`${getHomeUrl()}#peta`} className="font-bold py-2 border-b">PETA</Link>

          <div className="border-t pt-2">
            <button
              className="w-full text-left font-bold py-2 flex items-center justify-between"
              onClick={() => setIsPartnersOpen(!isPartnersOpen)}
            >
              ORGANISASI MITRA <ChevronDown className="h-4 w-4" />
            </button>
            {isPartnersOpen && (
              <div className="flex flex-col gap-1 pl-2">
                {partners.length > 0 ? partners.map((p) => (
                  <Link key={p.slug} href={`/sites/${p.slug}`} className="py-2 text-sm">
                    {p.name}
                  </Link>
                )) : <span className="py-2 text-sm text-muted-foreground">Belum ada data</span>}
              </div>
            )}
          </div>
          <div>
            <button
              className="w-full text-left font-bold py-2 flex items-center justify-between"
              onClick={() => setIsSchoolsOpen(!isSchoolsOpen)}
            >
              SEKOLAH <ChevronDown className="h-4 w-4" />
            </button>
            {isSchoolsOpen && (
              <div className="flex flex-col gap-1 pl-2">
                {schools.length > 0 ? schools.map((s) => (
                  <Link key={s.slug} href={`/sites/${s.slug}`} className="py-2 text-sm">
                    {s.name}
                  </Link>
                )) : <span className="py-2 text-sm text-muted-foreground">Belum ada data</span>}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {user ? (
              <Button variant="outline" asChild className="w-full border-(--nav-primary) text-(--nav-primary) hover:bg-(--nav-primary)/5 font-bold">
                <Link href={user.role === 'admin_kecamatan' ? '/admin/kecamatan' : '/dashboard'}>DASHBOARD</Link>
              </Button>
            ) : (
              <Button variant="outline" asChild className="w-full border-(--nav-primary) text-(--nav-primary) hover:bg-(--nav-primary)/5 font-bold">
                <Link href="/login">LOGIN OPERATOR</Link>
              </Button>
            )}
            <Button asChild className="w-full bg-(--nav-primary) hover:opacity-90 font-bold">
              <Link href="https://dapo.kemendikdasmen.go.id/progres/3/022132" target="_blank">CEK DAPODIK</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  Files, 
  FileText, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';

const menuItems = [
  { name: 'Overview', href: '/admin/kecamatan', icon: LayoutDashboard },
  { name: 'Manajemen User', href: '/admin/kecamatan/users', icon: Users },
  { name: 'File Manager', href: '/admin/kecamatan/files', icon: Files },
  { name: 'Konten / CMS', href: '/admin/kecamatan/posts', icon: FileText },
  { name: 'Sekolah', href: '/admin/kecamatan/schools', icon: Building2 },
  { name: 'Organisasi Mitra', href: '/admin/kecamatan/mitra', icon: ShieldCheck },
  { name: 'Pengaturan', href: '/admin/kecamatan/settings', icon: Settings },
];

export default function AdminKecamatanLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const checkAdmin = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }

    // Check if user is admin_kecamatan in profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error || profile?.role !== 'admin_kecamatan') {
      // If no profile yet, check if it's first time or bypass for dev if needed
      // For now, let's redirect if not admin
      console.error('Not authorized as admin kecamatan');
      router.push('/dashboard'); // Fallback to school dashboard
      return;
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Memverifikasi Hak Akses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-50`}
      >
        <div className="p-6 flex items-center gap-4">
          <div className="bg-primary p-2 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-black text-xl tracking-tighter"
            >
              ADMIN <span className="text-primary">KEC.</span>
            </motion.span>
          )}
        </div>

        <nav className="mt-8 flex-grow px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={`
                  flex items-center gap-4 p-3 rounded-2xl transition-all group cursor-pointer
                  ${isActive ? 'bg-primary text-white' : 'hover:bg-slate-800 text-slate-400'}
                `}>
                  <item.icon className={`h-6 w-6 ${isActive ? 'text-white' : 'group-hover:text-white'}`} />
                  {isSidebarOpen && (
                    <span className="font-bold tracking-tight">{item.name}</span>
                  )}
                  {isActive && isSidebarOpen && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-4 text-slate-400 hover:text-white hover:bg-red-500/10 rounded-2xl py-6"
            onClick={handleLogout}
          >
            <LogOut className="h-6 w-6" />
            {isSidebarOpen && <span className="font-bold">Keluar</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-40 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-xl"
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </Button>

          <div className="flex items-center gap-4 px-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-black text-slate-900 leading-none">Admin Kecamatan</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cilebar, Karawang</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-white shadow-sm">
              <Users className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

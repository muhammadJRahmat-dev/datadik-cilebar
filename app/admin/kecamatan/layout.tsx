import Link from 'next/link';
import Image from 'next/image';
import { CommandMenu } from '@/components/CommandMenu';
import { RealtimeProvider } from '@/components/providers/RealtimeProvider';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Bell,
  Users,
  LayoutDashboard,
  Building2,
  FileText,
  Settings
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/admin/kecamatan', icon: LayoutDashboard },
  { name: 'Sekolah', href: '/admin/kecamatan/schools', icon: Building2 },
  { name: 'Berita & Konten', href: '/admin/kecamatan/posts', icon: FileText },
  { name: 'Manajemen User', href: '/admin/kecamatan/users', icon: Users },
  { name: 'Pengaturan', href: '/admin/kecamatan/settings', icon: Settings },
];

export default function AdminKecamatanLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  // Mock user for now
  const user = { full_name: 'Administrator', avatar_url: null };

  const handleLogout = () => {
    // Implement logout logic
    window.location.href = '/login';
  };

  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans selection:bg-blue-500/30 overflow-hidden relative">
        {/* Dynamic Background */}
        <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-600/5 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-indigo-600/5 rounded-full blur-[120px] animate-pulse delay-1000" />
        </div>

        {/* Mobile Backdrop Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{
            width: isSidebarOpen ? 288 : 80, // 72 = 288px, 20 = 80px
            x: isSidebarOpen ? 0 : 0
          }}
          className={`
            fixed top-0 bottom-0 z-50 
            bg-slate-900/90 backdrop-blur-xl border-r border-white/5 
            transition-all duration-300 flex flex-col 
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            md:relative md:block
            h-full
          `}
          // Override framer-motion style on mobile to handle CSS transform class priority
          style={{ width: undefined }}
        >
          <div className="p-6 flex items-center gap-4 border-b border-white/5 h-20">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20 shrink-0">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 md:opacity-0'}`}>
              <span className="font-black text-xl tracking-tighter text-white leading-none whitespace-nowrap">ADMIN</span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none whitespace-nowrap">Kecamatan</span>
            </div>
          </div>

          <nav className="mt-8 flex-grow px-4 space-y-2 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`
                                flex items-center gap-4 p-3 rounded-2xl transition-all group cursor-pointer relative overflow-hidden
                                ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'hover:bg-white/5 text-slate-400 hover:text-white'}
                            `}>
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className={`font-bold tracking-tight text-sm whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 md:hidden'}`}>
                      {item.name}
                    </span>
                    {isActive && isSidebarOpen && (
                      <motion.div layoutId="activeCheck" className="ml-auto">
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-white/5">
            <Button
              variant="ghost"
              className={`w-full ${isSidebarOpen ? 'justify-start' : 'justify-center'} gap-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl py-6 transition-all`}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span className="font-bold whitespace-nowrap">Keluar</span>}
            </Button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className={`flex-grow transition-all duration-300 relative z-10 w-full md:w-auto overflow-y-auto h-screen`}>
          {/* Header */}
          <header className="bg-slate-900/50 backdrop-blur-md border-b border-white/5 p-4 sticky top-0 z-30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="rounded-xl hover:bg-white/5 text-slate-400 hover:text-white"
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <span className="font-black text-lg tracking-tight text-white hidden md:block">
                Dashboard Admin
              </span>
            </div>

            <div className="flex items-center gap-6 px-4">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 text-slate-400 hover:text-white relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </Button>
              <div className="flex items-center gap-4 pl-6 border-l border-white/5">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-black text-white leading-none">{user?.full_name || 'Admin User'}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Administrator</p>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10 shadow-sm overflow-hidden">
                  {user?.avatar_url ? (
                    <Image src={user.avatar_url} alt="Avatar" width={40} height={40} className="object-cover" />
                  ) : (
                    <Users className="h-5 w-5 text-slate-500" />
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
        <CommandMenu />
      </div>
    </RealtimeProvider>
  );
}

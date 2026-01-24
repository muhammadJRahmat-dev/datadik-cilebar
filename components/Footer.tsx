'use client';

import { School, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Footer() {
  const [org, setOrg] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const host = window.location.host;
    const mainDomain = 'datadikcilebar.my.id';
    const isSubdomain = host !== mainDomain && host !== `www.${mainDomain}` && !host.includes('localhost:3000');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const hasSupabase = !!url && !!key;
    if ((isSubdomain || (host.includes('localhost') && host.split('.').length > 1)) && hasSupabase) {
      const slug = host.split('.')[0];
      if (slug && slug !== 'www' && slug !== 'localhost') {
        supabase
          .from('organizations')
          .select('name, address, school_data(stats)')
          .eq('slug', slug)
          .single()
          .then(({ data }) => {
            if (data) setOrg(data);
          });
      }
    }
  }, []);

  const stats = org?.school_data?.[0]?.stats || {};
  const email = stats.kontak_email || 'admin@datadikcilebar.my.id';
  const phone = stats.kontak_wa || '+62 812-XXXX-XXXX';
  const address = org?.address || stats.address || 'Kantor Korwilcambidik Cilebar, Kec. Cilebar, Karawang, Jawa Barat';

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                <School className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-white tracking-tight uppercase leading-none">
                {org ? org.name : <>DATADIK <span className="text-primary-foreground/70">CILEBAR</span></>}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              {org
                ? `Portal informasi resmi ${org.name}. Menyajikan data pendidikan, berita, dan pengumuman terbaru secara transparan.`
                : 'Portal manajemen data pendidikan terpadu untuk wilayah Kecamatan Cilebar, Karawang. Memudahkan akses informasi sekolah, siswa, dan guru dalam satu platform modern.'
              }
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-primary hover:text-white transition-all"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-primary hover:text-white transition-all"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-primary hover:text-white transition-all"><Instagram className="h-4 w-4" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 uppercase tracking-wider border-b-2 border-primary w-fit pb-1">Tautan Cepat</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/" className="hover:text-primary transition-colors">Beranda Utama</Link></li>
              {!org && (
                <>
                  <li><Link href="/#statistik" className="hover:text-primary transition-colors">Statistik Pendidikan</Link></li>
                  <li><Link href="/#peta" className="hover:text-primary transition-colors">Peta Lokasi Sekolah</Link></li>
                </>
              )}
              <li><a href="https://dapo.kemdikbud.go.id" target="_blank" className="hover:text-primary transition-colors">Portal Dapodik Pusat</a></li>
            </ul>
          </div>

          {/* Categories / Info */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 uppercase tracking-wider border-b-2 border-primary w-fit pb-1">
              {org ? 'Informasi' : 'Jenjang Sekolah'}
            </h4>
            <ul className="space-y-4 text-sm">
              {org ? (
                <>
                  <li><span className="text-slate-500 font-bold uppercase tracking-tighter block text-[10px]">NPSN</span> {org?.school_data?.[0]?.npsn || '-'}</li>
                  <li><span className="text-slate-500 font-bold uppercase tracking-tighter block text-[10px]">Status</span> {stats.status || 'AKTIF'}</li>
                  <li><span className="text-slate-500 font-bold uppercase tracking-tighter block text-[10px]">Tipe</span> {org.type || 'SEKOLAH'}</li>
                </>
              ) : (
                <>
                  <li><Link href="/#peta" className="hover:text-primary transition-colors">SD (Sekolah Dasar)</Link></li>
                  <li><Link href="/#peta" className="hover:text-primary transition-colors">SMP (Sekolah Menengah Pertama)</Link></li>
                  <li><Link href="/#peta" className="hover:text-primary transition-colors">SMK (Sekolah Menengah Kejuruan)</Link></li>
                  <li><Link href="/#peta" className="hover:text-primary transition-colors">PAUD & TK</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 uppercase tracking-wider border-b-2 border-primary w-fit pb-1">Kontak Kami</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>{phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span className="break-all">{email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold text-center md:text-left">
            © {new Date().getFullYear()} {org ? org.name : 'DATADIK CILEBAR'}. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

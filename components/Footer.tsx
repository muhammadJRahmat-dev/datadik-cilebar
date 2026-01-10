import { School, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
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
              <span className="font-bold text-2xl text-white tracking-tight">DATADIK <span className="text-primary-foreground/70">CILEBAR</span></span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Portal manajemen data pendidikan terpadu untuk wilayah Kecamatan Cilebar, Karawang. Memudahkan akses informasi sekolah, siswa, dan guru dalam satu platform modern.
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
              <li><Link href="/#statistik" className="hover:text-primary transition-colors">Statistik Pendidikan</Link></li>
              <li><Link href="/#peta" className="hover:text-primary transition-colors">Peta Lokasi Sekolah</Link></li>
              <li><a href="https://dapo.kemdikbud.go.id" target="_blank" className="hover:text-primary transition-colors">Portal Dapodik Pusat</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 uppercase tracking-wider border-b-2 border-primary w-fit pb-1">Jenjang Sekolah</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/#peta" className="hover:text-primary transition-colors">SD (Sekolah Dasar)</Link></li>
              <li><Link href="/#peta" className="hover:text-primary transition-colors">SMP (Sekolah Menengah Pertama)</Link></li>
              <li><Link href="/#peta" className="hover:text-primary transition-colors">SMK (Sekolah Menengah Kejuruan)</Link></li>
              <li><Link href="/#peta" className="hover:text-primary transition-colors">PAUD & TK</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 uppercase tracking-wider border-b-2 border-primary w-fit pb-1">Kontak Kami</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>Kantor Korwilcambidik Cilebar, Kec. Cilebar, Karawang, Jawa Barat</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>+62 812-XXXX-XXXX</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>admin@datadikcilebar.my.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            © {new Date().getFullYear()} DATADIK CILEBAR. ALL RIGHTS RESERVED.
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

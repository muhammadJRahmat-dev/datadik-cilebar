🏗️ MASTER BLUEPRINT V4: Datadik Cilebar (Trae AI Edition)Project Name: Datadik CilebarTarget Waktu: 1 Hari (Speed Run)Stack: Next.js 14 (App Router), Supabase, Vercel, Shadcn UI.Konsep: Smart Multi-tenant System (1 Codebase, Banyak Sekolah).1. Arsitektur "Smart System"A. Dynamic Data (JSONB)Agar sekolah bisa menambah data unik tanpa coding ulang, kita gunakan kolom dynamic_info (JSONB) di database.Contoh Kasus: Sekolah A ingin input "Luas Tanah", Sekolah B ingin input "Daya Listrik".Solusi: Admin Panel memiliki fitur "Form Builder Sederhana" (Add Key-Value Pair).Storage: Disimpan sebagai {"luas_tanah": "500m", "daya_listrik": "900w"}.B. Smart Routing (Middleware)Main Domain (datadikcilebar.my.id): Landing page kecamatan, peta gabungan, berita aggregator.Subdomain (sdn1.datadik...): Profil sekolah spesifik, berita sekolah tersebut.2. Struktur Database (Supabase SQL)Copy kode SQL ini dan jalankan di Supabase SQL Editor sebelum mulai coding.-- 1. Tabel Organizations (Tenant)
create table organizations (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null, -- subdomain
  name text not null,
  type text not null, -- 'sekolah', 'dinas', 'umum'
  logo_url text,
  address text,
  theme_color text default '#2563eb',
  created_at timestamp with time zone default now()
);

-- 2. Tabel School Data (Smart JSONB)
create table school_data (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references organizations(id) not null,
  npsn text,
  lat float, lng float, -- Koordinat Peta
  jml_siswa int default 0,
  jml_guru int default 0,
  -- SMART FIELD: Data fleksibel (aset, fasilitas, dll)
  dynamic_info jsonb default '{}'::jsonb, 
  last_updated timestamp with time zone default now()
);

-- 3. Tabel Posts (Berita)
create table posts (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references organizations(id) not null,
  title text not null,
  slug text not null,
  content text,
  category text, -- 'berita', 'agenda', 'pengumuman'
  image_url text,
  is_published boolean default true,
  created_at timestamp with time zone default now()
);

-- 4. Storage & Policies (Security)
insert into storage.buckets (id, name, public) values ('assets', 'assets', true);
create policy "Public Read" on storage.objects for select using ( bucket_id = 'assets' );
create policy "Admin Write" on storage.objects for insert with check ( bucket_id = 'assets' );
3. PROMPT MASTER UNTUK TRAE AIInstruksi: Copy-paste prompt di bawah ini satu per satu ke dalam chat Trae AI. Tunggu sampai satu tahap selesai dan diverifikasi (tidak error) baru lanjut ke tahap berikutnya.TAHAP 1: Setup & Environment (Fondasi)"Halo Trae. Saya ingin membangun aplikasi Next.js 14 (App Router) dengan TypeScript.Langkah 1: Setup ProjectInisialisasi project Next.js baru.Install Shadcn UI (init default).Install dependencies wajib ini:lucide-react (Icons)@supabase/supabase-js (Database)react-leaflet leaflet (Maps - Wajib handle SSR nanti)react-hook-form zod (Form handling)date-fns (Formatting)Langkah 2: Setup Client SupabaseBuat file lib/supabase.ts untuk inisialisasi client.Gunakan environment variables NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.Buat file types/index.ts dan definisikan interface TypeScript yang SAMA PERSIS dengan struktur tabel database (Organizations, SchoolData, Posts). Pastikan kolom dynamic_info bertipe Record<string, any>.Jangan buat halaman dulu, siapkan saja library dan koneksinya."TAHAP 2: Middleware & Routing (Inti Sistem)"Oke, sekarang kita buat sistem Multi-tenant.Tugas:Buat file middleware.ts di root.Logic Middleware:Ambil hostname dari request headers.Tentukan rootDomain (misal: localhost:3000 untuk dev, datadikcilebar.my.id untuk prod).Jika hostname == rootDomain (atau www), rewrite URL ke /home (Landing Page Pusat).Jika hostname adalah subdomain (contoh: sdn1.rootDomain), rewrite URL ke /sites/[subdomain] (Halaman Sekolah).Buat struktur folder:app/home/page.tsx (Buat dummy text "Halaman Pusat").app/sites/[site]/page.tsx (Buat dummy text "Halaman Sekolah: [site]").Pastikan middleware mengecualikan folder _next, api, static, dan file gambar agar tidak error."TAHAP 3: Komponen Peta & Landing Page Pusat"Sekarang kerjakan app/home/page.tsx.Tugas:Buat komponen components/map/CilebarMap.tsx.PENTING: Gunakan dynamic import dengan ssr: false saat memanggil komponen ini di page parent, karena Leaflet butuh window object.Tampilkan peta wilayah Cilebar.Fetch data school_data join organizations dari Supabase.Tampilkan Marker sekolah. Saat diklik, muncul Popup nama sekolah & link ke subdomainnya.Di halaman utama (app/home/page.tsx), tampilkan Peta tersebut di bagian atas (Hero Section).Di bawah peta, buat Grid List berita terbaru (posts) yang diambil dari SEMUA organisasi."TAHAP 4: Halaman Dinamis Sekolah (Subdomain)"Sekarang kerjakan app/sites/[site]/page.tsx.Tugas:Halaman ini menerima params site (slug organisasi).Fetch data organizations berdasarkan slug tersebut.Jika data tidak ditemukan, tampilkan 404.Jika ada, render layout profil sekolah:Header dengan Logo & Nama Sekolah.Tab Menu: Profil, Data, Berita.Tab Data: Tampilkan data statis (Guru/Siswa) DAN data dinamis (dynamic_info JSONB). Loop key-value dari JSON tersebut dan tampilkan dalam tabel rapi.Tab Berita: Tampilkan list postingan HANYA milik organisasi ini."TAHAP 5: Dashboard Admin (Smart Form)"Terakhir, buat Dashboard Admin di /app/admin.Tugas:Buat form input data sekolah (components/admin/SchoolDataForm.tsx).Fitur Smart Form (PENTING):Selain input field tetap (NPSN, Siswa), tambahkan fitur 'Dynamic Fields'.Gunakan useFieldArray dari react-hook-form.User bisa klik 'Add Info', lalu muncul dua input: Label (misal: Luas Tanah) dan Value (misal: 1000m2).Saat Submit, gabungkan field dinamis ini menjadi JSON object dan simpan ke kolom dynamic_info di Supabase.Buat fitur upload gambar logo yang langsung upload ke Supabase Storage bucket assets."4. Checklist Anti-Error (Baca Sebelum Build)Handling Map SSR:Jika muncul error window is not defined pada Leaflet, pastikan import di page.tsx menggunakan:const MapCilebar = dynamic(() => import('@/components/map/CilebarMap'), { ssr: false });
Supabase RLS:Jika data tidak muncul di frontend, cek menu Authentication > Policies di Supabase. Pastikan tabel organizations dan posts memiliki policy "Enable Read Access for All".Image Hostname:Jika gambar dari Supabase tidak muncul, tambahkan domain supabase ke next.config.js:images: {
  remotePatterns: [{ protocol: 'https', hostname: 'punya-anda.supabase.co' }]
}

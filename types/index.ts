export interface Organization {
  id: string;
  slug: string;
  name: string;
  type: 'sekolah' | 'dinas' | 'umum';
  logo_url?: string;
  address?: string;
  theme_color: string;
  created_at: string;
}

export interface SchoolData {
  id: string;
  org_id: string;
  npsn?: string;
  lat?: number;
  lng?: number;
  jml_siswa: number;
  jml_guru: number;
  dynamic_info: Record<string, any>;
  last_updated: string;
}

export interface Post {
  id: string;
  org_id: string;
  title: string;
  slug: string;
  content?: string;
  category: 'berita' | 'agenda' | 'pengumuman';
  image_url?: string;
  is_published: boolean;
  created_at: string;
  organizations?: Organization;
}

export interface Profile {
  id: string;
  role: 'admin_kecamatan' | 'operator' | 'visitor';
  full_name?: string;
  npsn?: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  org_id: string;
  user_id?: string;
  file_url: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  description?: string;
  category: 'umum' | 'laporan' | 'arsip' | 'pengajuan';
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  organizations?: Organization;
}

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
}

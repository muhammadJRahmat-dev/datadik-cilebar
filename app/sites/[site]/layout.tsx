import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

type Props = {
  params: { site: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: school } = await supabase
    .from('organizations')
    .select('name, school_data(stats)')
    .eq('slug', params.site)
    .single();

  if (!school) {
    return {
      title: 'Sekolah Tidak Ditemukan',
    };
  }

  const stats = (school.school_data as any)?.[0]?.stats || {};
  const npsn = (school.school_data as any)?.[0]?.npsn || '';
  const description = stats.visi || `Portal Resmi ${school.name} - NPSN: ${npsn}. Informasi profil, berita, dan statistik pendidikan di Kecamatan Cilebar, Karawang.`;
  const keywords = [
    school.name,
    'Datadik Cilebar',
    'Dapodik Karawang',
    'Profil Sekolah',
    stats.jenis || 'Sekolah',
    npsn,
    'Kecamatan Cilebar'
  ].filter(Boolean).join(', ');

  const siteUrl = `https://${params.site}.datadikcilebar.my.id`;

  return {
    title: {
      default: school.name,
      template: `%s | ${school.name}`,
    },
    description: description,
    keywords: keywords,
    authors: [{ name: 'Operator ' + school.name }],
    creator: 'Datadik Cilebar Team',
    publisher: 'Datadik Cilebar',
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: school.name,
      description: description,
      url: siteUrl,
      siteName: 'Datadik Cilebar',
      type: 'website',
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title: school.name,
      description: description,
      site: '@datadikcilebar',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

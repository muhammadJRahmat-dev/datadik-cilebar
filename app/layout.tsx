import ErrorBoundary from '@/components/ErrorBoundary';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Datadik Cilebar - Portal Data Pendidikan Kecamatan Cilebar",
    template: "%s | Datadik Cilebar"
  },
  description: "Portal resmi manajemen data pendidikan (Dapodik) Kecamatan Cilebar, Karawang. Informasi lengkap SD, SMP, SMK, dan PAUD.",
  keywords: ["Datadik", "Cilebar", "Dapodik", "Sekolah Cilebar", "Pendidikan Karawang"],
  authors: [{ name: "Datadik Cilebar Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Datadik Cilebar - Portal Data Pendidikan",
    description: "Sistem informasi terpadu untuk pemetaan, monitoring, dan transparansi data pendidikan di Kecamatan Cilebar",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ErrorBoundary>
      <html lang="id">
        <head>
          <meta name="theme-color" content="#2563eb" />
        </head>
        <body className={inter.className}>{children}</body>
      </html>
    </ErrorBoundary>
  );
}

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
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

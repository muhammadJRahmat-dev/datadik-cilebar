'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function VerifikasiPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Verifikasi Data</h1>
          <p className="text-slate-400 font-medium mt-1">Verifikasi data yang dikirim oleh operator sekolah.</p>
        </div>
      </div>

      <Card className="border border-white/5 shadow-xl shadow-black/20 rounded-[2.5rem] overflow-hidden bg-white/5 backdrop-blur-md">
        <CardHeader className="p-8 pb-0">
          <h2 className="text-xl font-bold text-white">Data Menunggu Verifikasi</h2>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center text-slate-500 font-bold uppercase tracking-widest text-xs py-12">
            Tidak ada data yang memerlukan verifikasi saat ini.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

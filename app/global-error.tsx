'use client';

import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50">
        <div className="min-h-screen flex flex-col">
          <nav className="bg-white border-b border-slate-100 p-4">
            <div className="container mx-auto flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Home className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">Datadik Cilebar</span>
            </div>
          </nav>
          
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <h1 className="text-4xl font-black text-slate-900">Terjadi Kesalahan</h1>
              <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
              <p className="text-slate-600">
                Maaf, terjadi kesalahan tak terduga. Tim kami telah diberitahu dan sedang bekerja untuk memperbaikinya.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-slate-800 text-slate-100 p-4 rounded-xl text-left text-sm font-mono">
                  <p className="font-bold mb-2">Error Details:</p>
                  <p className="text-red-400">{error.message}</p>
                  {error.digest && <p className="mt-2">Digest: {error.digest}</p>}
                </div>
              )}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                  Coba Lagi
                </button>
                <Link 
                  href="/"
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                >
                  Ke Beranda
                </Link>
              </div>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

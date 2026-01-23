import { Home, RefreshCw } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-100 p-4">
        <div className="container mx-auto flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">Datadik Cilebar</span>
        </div>
      </nav>
      
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <RefreshCw className="h-16 w-16 text-primary animate-spin" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary/20 border-t-transparent animate-spin" style={{ animationDirection: 'reverse' }} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Memuat...</h2>
          <p className="text-slate-600">Mohon tunggu sebentar</p>
        </div>
      </main>
    </div>
  );
}

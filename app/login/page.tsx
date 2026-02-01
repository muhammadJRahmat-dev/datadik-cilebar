'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2, AlertCircle, School, Lock, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  identifier: z.string().min(3, 'NPSN atau Email minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      // Determine if it's NPSN or email
      const isEmail = values.identifier.includes('@');
      const loginEmail = isEmail ? values.identifier : `${values.identifier.trim()}@datadikcilebar.id`;

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: values.password,
      });

      if (authError) throw authError;

      // Check role for redirection
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'admin_kecamatan') {
        router.push('/admin/kecamatan');
      } else {
        router.push('/dashboard');
      }

      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message === 'Invalid login credentials' ? 'Login gagal. Periksa NPSN/Email dan Password Anda.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 font-sans selection:bg-blue-500/30">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-[40%] -right-[10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] bg-violet-600/10 rounded-full blur-[100px] animate-pulse delay-2000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md px-6 z-10"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Sistem Informasi Datadik
          </motion.div>
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl font-black text-white tracking-tight mb-2"
          >
            Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Back</span>
          </motion.h1>
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-slate-400 text-sm font-medium"
          >
            Masuk untuk mengelola data sekolah Anda
          </motion.p>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl rounded-[2rem] overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <CardHeader className="text-center pb-0 pt-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-2 transform rotate-3 group-hover:rotate-6 transition-transform duration-500">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-medium"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">NPSN / Email</label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                  <Input
                    {...register('identifier')}
                    placeholder="Contoh: 202123456"
                    className="relative bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 rounded-xl pl-10 py-6 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                </div>
                {errors.identifier && <p className="text-xs text-red-400 ml-1 font-medium">{errors.identifier.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
                  <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold">Lupa Password?</button>
                </div>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="relative bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 rounded-xl pl-10 py-6 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                </div>
                {errors.password && <p className="text-xs text-red-400 ml-1 font-medium">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] group/btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    Masuk Dashboard
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <div className="bg-slate-900/30 p-4 text-center border-t border-white/5 backdrop-blur-sm">
            <p className="text-xs text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} Korwil Cilebar &bull; Pendiidikan Dasar
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

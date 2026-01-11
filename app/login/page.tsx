'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2, AlertCircle, School } from 'lucide-react';

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
      const loginEmail = isEmail ? values.identifier : `${values.identifier}@datadikcilebar.id`;

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
      setError(err.message === 'Invalid login credentials' ? 'NPSN/Email atau Password salah.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md px-4 z-10"
      >
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30">
                <ShieldCheck className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">Login Operator</CardTitle>
            <CardDescription className="text-slate-400">
              Masuk menggunakan NPSN Sekolah Anda
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">NPSN / Email</label>
                <div className="relative">
                  <Input
                    {...register('identifier')}
                    placeholder="Masukkan NPSN atau Email"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl pl-10 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
                {errors.identifier && <p className="text-xs text-red-400 ml-1">{errors.identifier.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl focus:ring-blue-500/50 focus:border-blue-500/50"
                />
                {errors.password && <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>}
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk ke Dashboard'
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-slate-500">
                Lupa password? Hubungi Admin Korwil Cilebar
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-slate-500 text-sm">
          &copy; 2026 Datadik Cilebar. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}

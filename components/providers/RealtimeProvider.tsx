'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type RealtimeContextType = {
    notifications: any[];
};

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const [notification, setNotification] = useState<{
        title: string;
        message: string;
        type: 'info' | 'success' | 'alert';
        details?: any; // For navigation payload
    } | null>(null);

    const router = useRouter();

    useEffect(() => {
        // Subscribe to new submissions
        const submissionChannel = supabase
            .channel('admin-dashboard-submissions')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'submissions',
                },
                (payload) => {
                    console.log('New submission received!', payload);
                    setNotification({
                        title: 'File Masuk Baru',
                        message: `File baru "${payload.new.file_name}" telah diunggah.`,
                        type: 'info',
                        details: payload.new
                    });
                    parseAndPlaySound('/sounds/notification.mp3');
                }
            )
            .subscribe();

        // Subscribe to new posts/news
        const newsChannel = supabase
            .channel('admin-dashboard-posts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'posts',
                },
                (payload) => {
                    console.log('New post received!', payload);
                    setNotification({
                        title: 'Berita Publik Baru',
                        message: `Berita "${payload.new.title}" baru saja diterbitkan.`,
                        type: 'success',
                        details: payload.new
                    });
                    parseAndPlaySound('/sounds/notification.mp3');
                }
            )
            .subscribe();

        const parseAndPlaySound = (path: string) => {
            const audio = new Audio(path);
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play failed', e));
        };

        return () => {
            supabase.removeChannel(submissionChannel);
            supabase.removeChannel(newsChannel);
        };
    }, []);

    // Auto-dismiss notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    return (
        <RealtimeContext.Provider value={{ notifications: [] }}>
            {children}

            {/* Global Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-8 right-8 z-[100] max-w-sm w-full"
                    >
                        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem] shadow-2xl shadow-black/50 flex items-start gap-4 relative overflow-hidden group cursor-pointer"
                            onClick={() => {
                                if (notification.type === 'info') router.push('/admin/kecamatan/files');
                                setNotification(null);
                            }}
                        >
                            <div className={`absolute top-0 bottom-0 left-0 w-1 ${notification.type === 'info' ? 'bg-blue-500' : 'bg-emerald-500'
                                }`} />

                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notification.type === 'info' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                {notification.type === 'info' ? <FileText className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                            </div>

                            <div className="grow pt-1">
                                <h4 className="font-black text-white text-sm tracking-tight">{notification.title}</h4>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1 line-clamp-2">
                                    {notification.message}
                                </p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">{notification.type === 'info' ? 'Klik untuk verifikasi' : 'Notifikasi Sistem'}</p>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); setNotification(null); }}
                                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </RealtimeContext.Provider>
    );
}

export const useRealtime = () => useContext(RealtimeContext);

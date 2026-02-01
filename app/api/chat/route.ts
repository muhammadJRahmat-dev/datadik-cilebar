import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { message } = await req.json();
        const lowerMsg = message.toLowerCase();

        // Simulated AI Logic (Rule-based)
        // In the future, replace this with OpenAI/Anthropic API call

        let responseText = "Maaf, saya tidak mengerti perintah tersebut. Coba 'Buat berita baru' atau 'Cek status sistem'.";
        let action = null;

        // 1. Navigation Intents
        if (lowerMsg.includes('buat berita') || lowerMsg.includes('tulis berita') || lowerMsg.includes('post baru')) {
            responseText = "Baik, saya akan membuka formulir pembuatan berita baru untuk Anda.";
            action = { type: 'navigate', payload: '/admin/kecamatan/posts' };
        }
        else if (lowerMsg.includes('tambah user') || lowerMsg.includes('user baru') || lowerMsg.includes('akun baru')) {
            responseText = "Siap, membuka halaman manajemen user.";
            action = { type: 'navigate', payload: '/admin/kecamatan/users' };
        }
        else if (lowerMsg.includes('mitra baru') || lowerMsg.includes('tambah mitra')) {
            responseText = "Membuka formulir pendaftaran mitra baru.";
            action = { type: 'navigate', payload: '/admin/kecamatan/mitra' };
        }
        else if (lowerMsg.includes('pengaturan') || lowerMsg.includes('setting') || lowerMsg.includes('profil')) {
            responseText = "Membuka pengaturan kecamatan.";
            action = { type: 'navigate', payload: '/admin/kecamatan/settings' };
        }

        // 2. Data/Query Intents
        else if (lowerMsg.includes('status') || lowerMsg.includes('kesehatan sistem') || lowerMsg.includes('online')) {
            responseText = "Sistem saat ini terpantau **ONLINE** dan stabil. Semua layanan berjalan normal.";
            action = { type: 'toast', payload: 'System Status: ONLINE' };
        }
        else if (lowerMsg.includes('jumlah sekolah') || lowerMsg.includes('data sekolah')) {
            const { count } = await supabase
                .from('organizations')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'sekolah');

            responseText = `Saat ini terdapat **${count || 0} sekolah** yang terdaftar di sistem. Anda bisa melihat detailnya di menu Sekolah.`;
            action = { type: 'navigate', payload: '/admin/kecamatan/schools' };
        }
        else if (lowerMsg.includes('halo') || lowerMsg.includes('hi') || lowerMsg.includes('bantu')) {
            responseText = "Halo! Saya adalah asisten pintar Datadik Cilebar. Saya bisa membantu Anda menavigasi menu atau mengecek status sistem. Coba ketik 'Buat berita baru'.";
        }

        return NextResponse.json({
            role: 'assistant',
            content: responseText,
            action: action
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

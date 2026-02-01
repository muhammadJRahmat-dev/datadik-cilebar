'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Search,
    FileText,
    Building2,
    LayoutDashboard,
    Moon,
    Sun,
    Laptop,
    Send,
    Bot,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export function CommandMenu() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [mode, setMode] = React.useState<'command' | 'chat'>('command');
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [inputValue, setInputValue] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
                setMode('command'); // Reset to command mode on open
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg = inputValue;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg })
            });
            const data = await res.json();

            setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);

            if (data.action?.type === 'navigate') {
                setTimeout(() => {
                    router.push(data.action.payload);
                    setOpen(false);
                }, 1000);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, terjadi kesalahan pada server.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-slate-900 border border-white/10 shadow-2xl shadow-black/50"
                    >
                        {mode === 'command' ? (
                            <Command className="w-full bg-transparent">
                                <div className="flex items-center border-b border-white/5 px-4" cmdk-input-wrapper="">
                                    <Search className="mr-2 h-5 w-5 shrink-0 text-slate-400" />
                                    <Command.Input
                                        placeholder="Type a command or search..."
                                        className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 text-white font-medium disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">ESC</span>
                                    </div>
                                </div>

                                <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                                    <Command.Empty className="py-6 text-center text-sm text-slate-500 font-medium">
                                        No results found.
                                    </Command.Empty>

                                    <Command.Group heading="Ask AI" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-2">
                                        <Command.Item
                                            onSelect={() => {
                                                setMode('chat');
                                                setMessages([{ role: 'assistant', content: 'Halo! Ada yang bisa saya bantu hari ini?' }]);
                                            }}
                                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-purple-600 hover:text-white transition-all cursor-pointer aria-selected:bg-purple-600 aria-selected:text-white group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-white/20 group-hover:text-white">
                                                <Bot className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span>Tanya Datadik Assistant...</span>
                                                <span className="text-[10px] text-slate-500 group-hover:text-purple-200">AI Powered Helper</span>
                                            </div>
                                        </Command.Item>
                                    </Command.Group>

                                    <Command.Separator className="my-1 h-px bg-white/5" />

                                    <Command.Group heading="Navigation" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-2">
                                        <Command.Item
                                            onSelect={() => { router.push('/dashboard'); setOpen(false); }}
                                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-blue-600 hover:text-white transition-all cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white group"
                                        >
                                            <LayoutDashboard className="h-4 w-4" />
                                            <span>Dashboard</span>
                                        </Command.Item>
                                        <Command.Item
                                            onSelect={() => { router.push('/admin/kecamatan'); setOpen(false); }}
                                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-blue-600 hover:text-white transition-all cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white group"
                                        >
                                            <Building2 className="h-4 w-4" />
                                            <span>Admin Area</span>
                                        </Command.Item>
                                    </Command.Group>

                                    <Command.Group heading="Quick Actions" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-2">
                                        <Command.Item
                                            onSelect={() => { router.push('/admin/kecamatan/posts'); setOpen(false); }}
                                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-blue-600 hover:text-white transition-all cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white group"
                                        >
                                            <FileText className="h-4 w-4" />
                                            <span>Create New Post</span>
                                        </Command.Item>
                                        <Command.Item
                                            onSelect={() => { router.push('/admin/kecamatan/users'); setOpen(false); }}
                                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-blue-600 hover:text-white transition-all cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white group"
                                        >
                                            <User className="h-4 w-4" />
                                            <span>Add New User</span>
                                        </Command.Item>
                                    </Command.Group>

                                </Command.List>
                            </Command>
                        ) : (
                            // Chat Interface
                            <div className="flex flex-col h-[400px]">
                                <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/5">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg hover:bg-white/10"
                                        onClick={() => setMode('command')}
                                    >
                                        <ArrowLeft className="h-4 w-4 text-slate-400" />
                                    </Button>
                                    <span className="font-bold text-white text-sm">Datadik Assistant</span>
                                    <span className="ml-auto text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-1 rounded">Beta</span>
                                </div>

                                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-purple-600'
                                                }`}>
                                                {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                                            </div>
                                            <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.role === 'user'
                                                    ? 'bg-white/10 text-white rounded-tr-none'
                                                    : 'bg-purple-500/10 text-purple-100 border border-purple-500/20 rounded-tl-none'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                                                <Bot className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 rounded-tl-none flex items-center gap-2">
                                                <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                                                <span className="text-xs text-purple-400 font-medium">Sedang mengetik...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-white/5 bg-slate-900/50">
                                    <div className="flex gap-2">
                                        <input
                                            autoFocus
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Ketik pertanyaan atau perintah..."
                                            className="flex-grow bg-transparent border-none outline-none text-white text-sm placeholder:text-slate-500"
                                        />
                                        <Button
                                            size="icon"
                                            className="h-8 w-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-white"
                                            onClick={handleSendMessage}
                                            disabled={isLoading}
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'command' && (
                            <div className="border-t border-white/5 p-3 flex items-center justify-between text-[10px] font-medium text-slate-500 bg-slate-900/50">
                                <div className="flex gap-4">
                                    <span><strong>↑↓</strong> to navigate</span>
                                    <span><strong>↵</strong> to select</span>
                                </div>
                                <div>
                                    <span className="text-purple-400 font-bold">New:</span> Ask AI Available
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

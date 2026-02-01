'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Submission, Organization } from '@/types';
import { motion } from 'framer-motion';

const data = [
    { name: 'Jan', submissions: 40, verified: 24, amt: 2400 },
    { name: 'Feb', submissions: 30, verified: 13, amt: 2210 },
    { name: 'Mar', submissions: 20, verified: 98, amt: 2290 },
    { name: 'Apr', submissions: 27, verified: 39, amt: 2000 },
    { name: 'May', submissions: 18, verified: 48, amt: 2181 },
    { name: 'Jun', submissions: 23, verified: 38, amt: 2500 },
    { name: 'Jul', submissions: 34, verified: 43, amt: 2100 },
];

const schoolData = [
    { name: 'SD', value: 400 },
    { name: 'SMP', value: 300 },
    { name: 'SMA', value: 300 },
    { name: 'SMK', value: 200 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export function AdminAnalytics() {
    const [activityData, setActivityData] = useState<any[]>([]);
    const [schoolDistribution, setSchoolDistribution] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                // 1. Fetch Submissions for Activity Chart (Last 7 months)
                const { data: submissions } = await supabase
                    .from('submissions')
                    .select('created_at, status');

                // Process Submissions by Month
                const monthMap = new Map<string, { name: string, submissions: number, verified: number }>();
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                // Initialize last 6 months
                const today = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const monthName = months[d.getMonth()];
                    monthMap.set(monthName, { name: monthName, submissions: 0, verified: 0 });
                }

                (submissions as Partial<Submission>[])?.forEach(sub => {
                    const date = new Date(sub.created_at!);
                    const monthName = months[date.getMonth()];
                    if (monthMap.has(monthName)) {
                        const entry = monthMap.get(monthName)!;
                        entry.submissions++;
                        if (sub.status === 'verified') entry.verified++;
                    }
                });

                setActivityData(Array.from(monthMap.values()));

                // 2. Fetch Organizations for Distribution Chart
                const { data: schools } = await supabase
                    .from('organizations')
                    .select('name')
                    .eq('type', 'sekolah');

                // Process Schools by Level (SD, SMP, SMA, SMK)
                const counts = { SD: 0, SMP: 0, SMA: 0, SMK: 0, PAUD: 0, Lainnya: 0 };

                (schools as Partial<Organization>[])?.forEach(school => {
                    const name = (school.name || '').toUpperCase();
                    if (name.includes('SD')) counts.SD++;
                    else if (name.includes('SMP')) counts.SMP++;
                    else if (name.includes('SMA')) counts.SMA++;
                    else if (name.includes('SMK')) counts.SMK++;
                    else if (name.includes('PAUD') || name.includes('TK')) counts.PAUD++;
                    else counts.Lainnya++;
                });

                const distData = Object.entries(counts)
                    .filter(([_, value]) => value > 0)
                    .map(([name, value]) => ({ name, value }));

                setSchoolDistribution(distData);

            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            <div className="lg:col-span-2 h-[450px] bg-slate-900/50 rounded-[2.5rem] animate-pulse border border-white/5" />
            <div className="h-[450px] bg-slate-900/50 rounded-[2.5rem] animate-pulse border border-white/5" />
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Activity Chart */}
            <Card className="lg:col-span-2 border border-white/5 shadow-xl shadow-black/20 rounded-[2.5rem] bg-slate-900 overflow-hidden">
                <CardHeader className="p-8 pb-2">
                    <CardTitle className="text-xl font-black text-white tracking-tight">Aktivitas Upload File</CardTitle>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tren 6 bulan terakhir</p>
                </CardHeader>
                <CardContent className="p-8 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityData}>
                            <defs>
                                <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorVer" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                            />
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e293b" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}
                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                labelStyle={{ display: 'none' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="submissions"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorSub)"
                            />
                            <Area
                                type="monotone"
                                dataKey="verified"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorVer)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Distribution Chart */}
            <Card className="border border-white/5 shadow-xl shadow-black/20 rounded-[2.5rem] bg-slate-900 overflow-hidden">
                <CardHeader className="p-8 pb-2">
                    <CardTitle className="text-xl font-black text-white tracking-tight">Distribusi Sekolah</CardTitle>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Berdasarkan jenjang pendidikan</p>
                </CardHeader>
                <CardContent className="p-8 h-[350px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={schoolDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {schoolDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}
                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <p className="text-3xl font-black text-white">
                            {schoolDistribution.reduce((acc, curr) => acc + curr.value, 0)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

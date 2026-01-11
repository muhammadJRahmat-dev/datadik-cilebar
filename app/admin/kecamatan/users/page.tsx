'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Key, 
  Shield, 
  School,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    npsn: '',
    full_name: '',
    role: 'operator',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching users:', error);
    else setUsers(data || []);
    setLoading(false);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0, n = charset.length; i < 8; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    setFormData({ ...formData, password: retVal });
  };

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        npsn: user.npsn || '',
        full_name: user.full_name || '',
        role: user.role,
        password: '' // Reset password field for security
      });
    } else {
      setEditingUser(null);
      setFormData({
        npsn: '',
        full_name: '',
        role: 'operator',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const url = '/api/admin/users';
      const method = editingUser ? 'PATCH' : 'POST';
      const body = editingUser 
        ? { id: editingUser.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan user');
      
      showToast(editingUser ? 'User berhasil diperbarui!' : 'User berhasil dibuat!');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Hapus user ini selamanya?')) return;
    
    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Gagal menghapus user');
      
      showToast('User berhasil dihapus');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.npsn?.includes(search)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen User</h1>
          <p className="text-slate-500 font-medium mt-1">Kelola akun operator sekolah dan admin.</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          className="rounded-2xl px-6 py-6 h-auto font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20"
        >
          <Plus className="h-5 w-5" />
          Tambah User
        </Button>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-8 pb-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Cari berdasarkan nama atau NPSN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-medium"
            />
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">NPSN</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dibuat</th>
                  <th className="pb-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4"><Skeleton className="h-10 w-40 rounded-xl" /></td>
                      <td className="py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-4"></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      Tidak ada user ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 uppercase">
                            {u.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{u.full_name || 'No Name'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {u.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          u.role === 'admin_kecamatan' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 font-bold text-slate-600 tracking-tight">{u.npsn || '-'}</td>
                      <td className="py-4 text-xs font-bold text-slate-400">
                        {new Date(u.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" onClick={() => handleOpenModal(u)}>
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500" onClick={() => handleDeleteUser(u.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Tambah User */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingUser ? 'Edit User' : 'Tambah User Baru'}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{editingUser ? 'Update data akses user' : 'Buat akun akses sistem'}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-xl">
                  <Plus className="rotate-45" />
                </Button>
              </div>

              <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role User</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['operator', 'admin_kecamatan'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: r })}
                          className={`p-4 rounded-2xl border-2 transition-all text-left group ${
                            formData.role === r ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center transition-colors ${
                            formData.role === r ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                          }`}>
                            {r === 'admin_kecamatan' ? <Shield className="h-4 w-4" /> : <School className="h-4 w-4" />}
                          </div>
                          <p className={`font-black uppercase tracking-widest text-[10px] ${
                            formData.role === r ? 'text-primary' : 'text-slate-400'
                          }`}>{r.replace('_', ' ')}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NPSN (Untuk Operator)</label>
                    <Input 
                      placeholder="Masukkan NPSN..."
                      value={formData.npsn}
                      onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                      className="h-12 rounded-xl border-slate-100 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <Input 
                      placeholder="Masukkan nama..."
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="h-12 rounded-xl border-slate-100 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password {editingUser && '(Kosongkan jika tidak ingin mengubah)'}</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder={editingUser ? "Kosongkan jika tidak diubah" : "Masukkan password..."}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-12 rounded-xl border-slate-100 font-bold"
                        required={!editingUser}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={generatePassword}
                        className="h-12 w-12 rounded-xl p-0 border-slate-100 hover:bg-slate-50"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gunakan password yang kuat</p>
                  </div>
                </div>

                <Button 
                  disabled={isSaving}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20"
                >
                  {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : (editingUser ? 'Update User' : 'Simpan User')}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 ${
              toast.type === 'success' ? 'bg-white border-emerald-100 text-emerald-600' : 'bg-white border-red-100 text-red-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
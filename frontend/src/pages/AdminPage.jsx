import { useEffect, useState } from 'react';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        request('/admin/stats'),
        request('/admin/users')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    const isSelf = id === user.id;
    const confirmText = isSelf
      ? `"${name}" — bu sizning hisobingiz! O'chirsangiz tizimdan chiqasiz. Davom etasizmi?`
      : `"${name}" foydalanuvchisini o'chirmoqchimisiz?`;

    if (!window.confirm(confirmText)) return;

    try {
      await request(`/admin/users/${id}`, { method: 'DELETE' });
      if (isSelf) {
        logout();
      } else {
        loadAll();
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="font-bold opacity-30 uppercase tracking-widest text-[10px]">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 bg-error/10 rounded-full py-1.5 px-4 text-[10px] font-bold tracking-widest uppercase mb-3 text-error">
          ⚙️ Boshqaruv
        </div>
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Admin panel</h1>
        <p className="text-sm opacity-40 mt-1 font-medium">Tizim statistikasi va foydalanuvchilarni boshqarish</p>
      </div>

      {message && (
        <div className="alert alert-error rounded-xl animate-slide-down">
          <span className="text-sm">{message}</span>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-primary to-primary/80 text-primary-content shadow-xl shadow-primary/10 card-hover overflow-hidden">
            <div className="blob w-32 h-32 bg-white/10 -right-8 -top-8"></div>
            <div className="card-body relative">
              <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Foydalanuvchilar</p>
              <p className="text-5xl font-black">{stats.users}</p>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-secondary to-secondary/80 text-secondary-content shadow-xl shadow-secondary/10 card-hover overflow-hidden">
            <div className="blob w-32 h-32 bg-white/10 -right-8 -top-8"></div>
            <div className="card-body relative">
              <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Hojatxonalar</p>
              <p className="text-5xl font-black">{stats.toilets}</p>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-neutral to-neutral/80 text-neutral-content shadow-xl card-hover overflow-hidden">
            <div className="blob w-32 h-32 bg-white/10 -right-8 -top-8"></div>
            <div className="card-body relative">
              <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Sharhlar</p>
              <p className="text-5xl font-black">{stats.reviews}</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-error via-primary to-secondary"></div>
        <div className="card-body">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-4">
            Foydalanuvchilar
            <span className="text-sm font-bold opacity-30 ml-2 normal-case">({users.length} ta)</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest opacity-40">
                  <th>ID</th>
                  <th>Ism</th>
                  <th>Telefon</th>
                  <th>Rol</th>
                  <th>Yaratilgan</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover">
                    <td className="font-mono text-xs opacity-30">#{u.id}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-gradient-to-br from-primary to-secondary text-primary-content rounded-full w-8 h-8">
                            <span className="text-xs font-bold">{u.name.charAt(0)}</span>
                          </div>
                        </div>
                        <div>
                          <span className="font-bold text-sm">{u.name}</span>
                          {u.id === user.id && <span className="badge badge-primary badge-xs ml-2 font-bold">Siz</span>}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs opacity-60">{u.phone}</td>
                    <td>
                      <span className={`badge badge-sm font-bold ${
                        u.role === 'ADMIN' ? 'badge-error' :
                        u.role === 'OWNER' ? 'badge-warning' : 'badge-ghost'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-xs opacity-40">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-error btn-xs btn-outline font-bold"
                        onClick={() => handleDelete(u.id, u.name)}
                      >
                        O'chirish
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 opacity-30 italic font-bold">
                      Foydalanuvchi yo'q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

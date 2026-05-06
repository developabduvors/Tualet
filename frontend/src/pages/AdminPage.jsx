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
      ? `"${name}" — bu sizning hisobingiz! O'chirsangiz tizimdan chiqasiz va barcha joylaringiz/sharhlaringiz yo'qoladi. Davom etasizmi?`
      : `"${name}" foydalanuvchisini va uning barcha joylari/sharhlarini o'chirmoqchimisiz?`;

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
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <p className="text-xs font-bold text-primary tracking-widest uppercase">Boshqaruv</p>
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Admin panel</h1>
      </div>

      {message && (
        <div className="alert alert-error">
          <span>{message}</span>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-primary text-primary-content shadow-xl">
            <div className="card-body">
              <p className="text-xs uppercase font-bold opacity-70 tracking-widest">Foydalanuvchilar</p>
              <p className="text-5xl font-black">{stats.users}</p>
            </div>
          </div>
          <div className="card bg-secondary text-secondary-content shadow-xl">
            <div className="card-body">
              <p className="text-xs uppercase font-bold opacity-70 tracking-widest">Hojatxonalar</p>
              <p className="text-5xl font-black">{stats.toilets}</p>
            </div>
          </div>
          <div className="card bg-neutral text-neutral-content shadow-xl">
            <div className="card-body">
              <p className="text-xs uppercase font-bold opacity-70 tracking-widest">Sharhlar</p>
              <p className="text-5xl font-black">{stats.reviews}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl border border-base-content/5">
        <div className="card-body">
          <h2 className="card-title text-2xl font-black uppercase mb-4">Foydalanuvchilar</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
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
                  <tr key={u.id}>
                    <td className="font-mono text-xs opacity-50">{u.id}</td>
                    <td className="font-bold">
                      {u.name}
                      {u.id === user.id && <span className="badge badge-primary badge-sm ml-2">Siz</span>}
                    </td>
                    <td className="font-mono text-sm">{u.phone}</td>
                    <td>
                      <span className={`badge font-bold ${
                        u.role === 'ADMIN' ? 'badge-error' :
                        u.role === 'OWNER' ? 'badge-warning' : 'badge-ghost'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-xs opacity-60">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-error btn-xs"
                        onClick={() => handleDelete(u.id, u.name)}
                      >
                        O'chirish
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 opacity-40 italic">Foydalanuvchi yo'q</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

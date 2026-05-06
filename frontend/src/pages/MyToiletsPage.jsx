import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TYPE_ICONS = { PUBLIC: '🏛️', PRIVATE: '🔒', PAID: '💰', FREE: '🆓' };

export default function MyToiletsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadMine() {
    if (!user) return;
    try {
      setLoading(true);
      const response = await request(`/toilets?ownerId=${user.id}`);
      setToilets(response.data || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`"${name}" joyini o'chirmoqchimisiz?`)) return;
    try {
      await request(`/toilets/${id}`, { method: 'DELETE' });
      loadMine();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full py-1.5 px-4 text-[10px] font-bold tracking-widest uppercase mb-3 text-primary">
            📍 Sizning joylaringiz
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Mening joylarim</h1>
          <p className="text-xs font-bold opacity-30 mt-1.5 tracking-widest uppercase">{toilets.length} ta joy</p>
        </div>
        <button
          className="btn btn-primary font-bold shadow-lg shadow-primary/20 gap-2"
          onClick={() => navigate('/create-toilet')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Yangi joy
        </button>
      </div>

      {message && (
        <div className="alert alert-error rounded-xl animate-slide-down">
          <span className="text-sm">{message}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="font-bold opacity-30 uppercase tracking-widest text-[10px]">Yuklanmoqda...</p>
        </div>
      ) : toilets.length === 0 ? (
        <div className="py-24 text-center bg-base-100 rounded-3xl border-2 border-dashed border-base-content/8 animate-fade-in">
          <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl opacity-40">
            🚽
          </div>
          <h3 className="text-xl font-black uppercase opacity-30">Hali joy qo'shmagansiz</h3>
          <p className="text-sm opacity-20 mt-2 max-w-xs mx-auto font-medium">
            Birinchi joyingizni qo'shib, foydalanuvchilarga taqdim qiling.
          </p>
          <button
            className="btn btn-primary mt-6 font-bold gap-2"
            onClick={() => navigate('/create-toilet')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Yangi joy qo'shish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger">
          {toilets.map((item) => (
            <div
              key={item.id}
              className="card bg-base-100 shadow-lg border border-base-content/5 card-hover overflow-hidden animate-fade-in-up"
            >
              <div className="card-body p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black tracking-tight leading-tight truncate">
                      {item.name}
                    </h3>
                    <span className="text-xs opacity-40 font-bold">
                      {TYPE_ICONS[item.type]} {item.type}
                    </span>
                  </div>
                  <div className={`badge badge-lg font-black border-none shrink-0 ${
                    item.status === 'OPEN' ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
                  }`}>
                    {item.status === 'OPEN' ? '● Ochiq' : '● Yopiq'}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-base-200/50 p-3 rounded-xl text-center">
                    <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Narxi</p>
                    <p className="font-bold text-sm mt-0.5">{item.price} <span className="text-[10px] opacity-30">uzs</span></p>
                  </div>
                  <div className="bg-base-200/50 p-3 rounded-xl text-center">
                    <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Reyting</p>
                    <p className="font-bold text-sm mt-0.5">⭐ {Number(item.avg_rating || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-base-200/50 p-3 rounded-xl text-center">
                    <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">ID</p>
                    <p className="font-bold text-sm mt-0.5 font-mono opacity-40">#{item.id}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-base-content/5">
                  <button
                    className="btn btn-sm btn-ghost flex-1 font-bold text-xs"
                    onClick={() => navigate(`/toilets/${item.id}`)}
                  >
                    👁️ Ko'rish
                  </button>
                  <button
                    className="btn btn-sm btn-outline flex-1 font-bold text-xs"
                    onClick={() => navigate(`/toilets/${item.id}/edit`)}
                  >
                    ✏️ Tahrirlash
                  </button>
                  <button
                    className="btn btn-sm btn-error btn-outline flex-1 font-bold text-xs"
                    onClick={() => handleDelete(item.id, item.name)}
                  >
                    🗑️ O'chirish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

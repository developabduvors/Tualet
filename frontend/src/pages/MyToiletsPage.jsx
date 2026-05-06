import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-bold text-primary tracking-widest uppercase">Sizning joylaringiz</p>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Mening joylarim</h1>
          <p className="text-xs font-bold opacity-40 mt-2 tracking-widest uppercase">{toilets.length} ta joy</p>
        </div>
        <button
          className="btn btn-primary font-black shadow-lg shadow-primary/20"
          onClick={() => navigate('/create-toilet')}
        >
          + Yangi joy qo'shish
        </button>
      </div>

      {message && (
        <div className="alert alert-error">
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : toilets.length === 0 ? (
        <div className="py-32 text-center bg-base-100 rounded-[3rem] border-2 border-dashed border-base-content/10">
          <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl opacity-50">🚽</div>
          <h3 className="text-2xl font-black uppercase opacity-40">Hali joy qo'shmagansiz</h3>
          <p className="text-sm opacity-30 mt-2 max-w-xs mx-auto italic">Birinchi joyingizni qo'shib, foydalanuvchilarga taqdim qiling.</p>
          <button
            className="btn btn-primary mt-6"
            onClick={() => navigate('/create-toilet')}
          >
            + Yangi joy qo'shish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {toilets.map((item) => (
            <div
              key={item.id}
              className="bg-base-100 rounded-[2rem] p-6 shadow-xl border border-base-content/5"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-black tracking-tight leading-tight max-w-[70%]">
                  {item.name}
                </h3>
                <div className={`badge badge-lg font-black border-none py-4 px-4 ${
                  item.status === 'OPEN' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}>
                  {item.status}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-base-200/50 p-3 rounded-2xl">
                  <p className="text-[10px] uppercase font-black opacity-30 tracking-widest mb-1">Narxi</p>
                  <p className="font-bold text-sm">{item.price} so'm</p>
                </div>
                <div className="bg-base-200/50 p-3 rounded-2xl">
                  <p className="text-[10px] uppercase font-black opacity-30 tracking-widest mb-1">Reyting</p>
                  <p className="font-bold text-sm">⭐ {item.avg_rating || 0}</p>
                </div>
                <div className="bg-base-200/50 p-3 rounded-2xl">
                  <p className="text-[10px] uppercase font-black opacity-30 tracking-widest mb-1">Turi</p>
                  <p className="font-bold text-sm">{item.type}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-base-content/5">
                <button
                  className="btn btn-sm btn-ghost flex-1"
                  onClick={() => navigate(`/toilets/${item.id}`)}
                >
                  Ko'rish
                </button>
                <button
                  className="btn btn-sm btn-outline flex-1"
                  onClick={() => navigate(`/toilets/${item.id}/edit`)}
                >
                  Tahrirlash
                </button>
                <button
                  className="btn btn-sm btn-error btn-outline flex-1"
                  onClick={() => handleDelete(item.id, item.name)}
                >
                  O'chirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

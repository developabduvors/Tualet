import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function MyToiletsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMine();
  }, [user?.id]);

  async function loadMine() {
    if (!user) return;
    try {
      setLoading(true);
      const response = await request(`/toilets?ownerId=${user.id}`);
      setLocations(response.data || []);
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

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Mening joylarim</h1>
        <button className="btn btn-primary font-bold" onClick={() => navigate('/create-toilet')}>Yangi joy</button>
      </div>

      {message && <div className="alert alert-error rounded-xl"><span className="text-sm">{message}</span></div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger">
        {locations.map((item) => (
          <div key={item.id} className="card bg-base-100 shadow-lg border border-base-content/5 overflow-hidden">
            <div className="card-body p-6">
              <h3 className="text-xl font-black tracking-tight">{item.name}</h3>
              <p className="text-sm opacity-50">{item.address}</p>
              <div className="flex gap-2 pt-3 border-t border-base-content/5">
                <button className="btn btn-sm btn-ghost flex-1 font-bold text-xs" onClick={() => navigate(`/toilets/${item.id}`)}>Ko&apos;rish</button>
                <button className="btn btn-sm btn-outline flex-1 font-bold text-xs" onClick={() => navigate(`/toilets/${item.id}/edit`)}>Tahrirlash</button>
                <button className="btn btn-sm btn-error btn-outline flex-1 font-bold text-xs" onClick={() => handleDelete(item.id, item.name)}>O&apos;chirish</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

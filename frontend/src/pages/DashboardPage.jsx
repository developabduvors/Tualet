import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [locationForm, setLocationForm] = useState({ lat: '41.3111', lng: '69.2797' });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadToilets();
  }, []);

  async function loadToilets() {
    try {
      setLoading(true);
      const response = await request('/toilets');
      setToilets(response.data || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadNearbyToilets() {
    try {
      setLoading(true);
      const response = await request(
        `/toilets/nearby?lat=${locationForm.lat}&lng=${locationForm.lng}`
      );
      setToilets(response.data || []);
      setMessage(`${response.count || 0} ta yaqin joy topildi`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary px-8 py-12 text-primary-content shadow-2xl shadow-primary/30">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">Eng yaqin va toza joyni toping</h2>
          <p className="text-lg opacity-90 mb-8 max-w-lg leading-relaxed">
            Biz sizga Toshkentdagi barcha jamoat va xususiy hojatxonalarni topishga yordam beramiz. 
            Reytinglar, rasmlar va narxlarni solishtiring.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="badge badge-secondary badge-lg font-bold gap-2 py-4 px-6">
              <span className="text-xs uppercase opacity-70">Jami:</span> {toilets.length} ta joy
            </div>
          </div>
        </div>
        {/* Abstract shapes */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute right-20 -bottom-20 w-60 h-60 bg-secondary/20 rounded-full blur-3xl"></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 items-start">
        {/* Search Sidebar */}
        <aside className="space-y-6 sticky top-24">
          <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden">
            <div className="p-1 bg-gradient-to-r from-primary to-secondary"></div>
            <div className="card-body gap-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight flex justify-between items-center">
                  Qidiruv
                  <button className="btn btn-ghost btn-xs text-primary font-bold" onClick={loadToilets}>Hammasi</button>
                </h3>
                <p className="text-xs opacity-50 font-medium">Joylashuvingiz bo'yicha qidiring</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-[10px] uppercase font-black opacity-40 tracking-widest">Lat</span></label>
                    <input
                      className="input input-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      value={locationForm.lat}
                      onChange={(e) => setLocationForm({ ...locationForm, lat: e.target.value })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-[10px] uppercase font-black opacity-40 tracking-widest">Lng</span></label>
                    <input
                      className="input input-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      value={locationForm.lng}
                      onChange={(e) => setLocationForm({ ...locationForm, lng: e.target.value })}
                    />
                  </div>
                </div>

                <button 
                  className="btn btn-primary btn-block shadow-lg shadow-primary/20 h-14 text-lg font-black tracking-wide" 
                  onClick={loadNearbyToilets} 
                  disabled={loading}
                >
                  {loading ? <span className="loading loading-spinner"></span> : 'Yaqinlarni ko\'rish'}
                </button>
              </div>
            </div>
          </div>

          {user?.role === 'OWNER' && (
            <div className="card bg-neutral text-neutral-content shadow-xl">
              <div className="card-body p-6">
                <h3 className="card-title text-lg uppercase font-black">Ega bo'limi</h3>
                <p className="text-xs opacity-70">O'z joyingizni qo'shing va boshqaring</p>
                <button 
                  className="btn btn-secondary btn-sm mt-2 w-full font-bold"
                  onClick={() => navigate('/create-toilet')}
                >
                  + Yangi joy qo'shish
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className="alert alert-info py-3 px-4 rounded-2xl shadow-lg border-none bg-info/10 text-info font-bold text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{message}</span>
            </div>
          )}
        </aside>

        {/* Results Area */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Natijalar</h2>
              <p className="text-xs font-bold opacity-40 mt-2 tracking-widest uppercase">Hozirda {toilets.length} ta joy mavjud</p>
            </div>
            <div className="join bg-base-100 shadow-md p-1 rounded-xl">
              <button className="btn btn-ghost btn-sm join-item btn-active">Grid</button>
              <button className="btn btn-ghost btn-sm join-item opacity-40">List</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {toilets.map((item) => (
              <div
                key={item.id}
                className="group relative bg-base-100 rounded-[2rem] p-6 shadow-xl hover:shadow-2xl transition-all duration-500 border border-base-content/5 cursor-pointer overflow-hidden"
                onClick={() => navigate(`/toilets/${item.id}`)}
              >
                {/* Decorative glow */}
                <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-black tracking-tight leading-tight max-w-[70%] group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <div className={`badge badge-lg font-black border-none py-4 px-4 ${
                      item.status === 'OPEN' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                    }`}>
                      {item.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-base-200/50 p-3 rounded-2xl">
                      <p className="text-[10px] uppercase font-black opacity-30 tracking-widest mb-1">Narxi</p>
                      <p className="font-bold text-lg">{item.price} <span className="text-xs opacity-50">so'm</span></p>
                    </div>
                    <div className="bg-base-200/50 p-3 rounded-2xl">
                      <p className="text-[10px] uppercase font-black opacity-30 tracking-widest mb-1">Reyting</p>
                      <p className="font-bold text-lg">⭐ {item.avg_rating || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-base-content/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <span className="text-xs font-black uppercase opacity-40">{item.type}</span>
                    </div>
                    {item.distance && (
                      <span className="text-sm font-black text-primary bg-primary/10 py-1 px-3 rounded-lg">
                        {item.distance.toFixed(2)} km
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {toilets.length === 0 && !loading && (
              <div className="col-span-full py-32 text-center bg-base-100 rounded-[3rem] border-2 border-dashed border-base-content/10">
                <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl opacity-50">🚽</div>
                <h3 className="text-2xl font-black uppercase opacity-40">Hozircha bo'sh</h3>
                <p className="text-sm opacity-30 mt-2 max-w-xs mx-auto italic">Bu hududda hech qanday joy topilmadi. Qidiruv parametrlarini o'zgartirib ko'ring.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

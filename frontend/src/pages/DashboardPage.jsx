import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TASHKENT = { lat: 41.3111, lng: 69.2797 };
const TOILET_TYPES = ['PUBLIC', 'PRIVATE', 'PAID', 'FREE'];
const TYPE_ICONS = { PUBLIC: '🏛️', PRIVATE: '🔒', PAID: '💰', FREE: '🆓' };
const TYPE_COLORS = { PUBLIC: 'badge-primary', PRIVATE: 'badge-secondary', PAID: 'badge-warning', FREE: 'badge-success' };

export default function DashboardPage() {
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [coords, setCoords] = useState(TASHKENT);
  const [coordsSource, setCoordsSource] = useState('default');
  const [filters, setFilters] = useState({
    radius: 5,
    types: [],
    maxPrice: '',
    minRating: 0,
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      loadNearby(TASHKENT, filters);
      return;
    }

    const timeoutId = setTimeout(() => {
      loadNearby(TASHKENT, filters);
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId);
        const real = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(real);
        setCoordsSource('real');
        loadNearby(real, filters);
      },
      () => {
        clearTimeout(timeoutId);
        loadNearby(TASHKENT, filters);
      },
      { timeout: 5000, maximumAge: 60000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadNearby(c = coords, f = filters) {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        lat: String(c.lat),
        lng: String(c.lng),
        radius: String(f.radius),
      });
      if (f.types.length) params.set('type', f.types.join(','));
      if (f.maxPrice !== '' && !Number.isNaN(Number(f.maxPrice))) {
        params.set('maxPrice', String(Number(f.maxPrice)));
      }
      if (f.minRating > 0) params.set('minRating', String(f.minRating));

      const response = await request(`/toilets/nearby?${params.toString()}`);
      setToilets(response.data || []);
      setMessage(`${response.count || 0} ta joy topildi`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAll() {
    try {
      setLoading(true);
      const response = await request('/toilets');
      setToilets(response.data || []);
      setMessage(`${response.data?.length || 0} ta joy (barchasi)`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleType(t) {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(t)
        ? prev.types.filter((x) => x !== t)
        : [...prev.types, t],
    }));
  }

  return (
    <div className="space-y-10">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#a855f7] px-8 py-14 text-white shadow-2xl shadow-purple-900/30 animate-fade-in-up">
        <div className="blob w-96 h-96 bg-pink-500 -right-20 -top-20"></div>
        <div className="blob w-72 h-72 bg-blue-500 right-40 -bottom-20"></div>
        <div className="blob w-48 h-48 bg-violet-400 left-1/2 top-0"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full py-1.5 px-4 text-xs font-bold tracking-wider uppercase mb-6 border border-white/20 text-white">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
            </span>
            {coordsSource === 'real' ? 'GPS orqali aniqlandi' : 'Toshkent markazi'}
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-tight text-white">
            Eng yaqin va toza
            <br />
            <span className="text-white/80">joyni toping</span>
          </h1>
          <p className="text-base text-white/80 mb-8 max-w-lg leading-relaxed font-medium">
            Toshkentdagi barcha jamoat va xususiy hojatxonalarni toping.
            Reytinglar, rasmlar va narxlarni solishtiring.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl py-3 px-5 border border-white/20">
              <div className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Topildi</div>
              <div className="text-2xl font-black text-white">{toilets.length} <span className="text-sm text-white/70 font-bold">ta joy</span></div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl py-3 px-5 border border-white/20">
              <div className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Radius</div>
              <div className="text-2xl font-black text-white">{filters.radius} <span className="text-sm text-white/70 font-bold">km</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">

        {/* ─── Sidebar ─── */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          {/* Search Panel */}
          <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden animate-fade-in-up">
            <div className="h-1 bg-gradient-to-r from-primary to-secondary"></div>
            <div className="card-body gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Qidiruv</h3>
                  <p className="text-[10px] opacity-40 font-bold tracking-widest uppercase mt-0.5">Joylashuv bo'yicha</p>
                </div>
                <button className="btn btn-ghost btn-xs text-primary font-bold uppercase tracking-wider" onClick={loadAll}>
                  Hammasi
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label py-0.5">
                      <span className="label-text text-[10px] uppercase font-black opacity-30 tracking-widest">Lat</span>
                    </label>
                    <input
                      className="input input-sm w-full bg-base-200 border-none font-mono text-xs focus:ring-2 focus:ring-primary/20 transition-all"
                      value={coords.lat}
                      onChange={(e) => { setCoords({ ...coords, lat: e.target.value }); setCoordsSource('default'); }}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label py-0.5">
                      <span className="label-text text-[10px] uppercase font-black opacity-30 tracking-widest">Lng</span>
                    </label>
                    <input
                      className="input input-sm w-full bg-base-200 border-none font-mono text-xs focus:ring-2 focus:ring-primary/20 transition-all"
                      value={coords.lng}
                      onChange={(e) => { setCoords({ ...coords, lng: e.target.value }); setCoordsSource('default'); }}
                    />
                  </div>
                </div>

                {/* Filters Collapse */}
                <div className="collapse collapse-arrow bg-base-200/60 rounded-2xl">
                  <input type="checkbox" />
                  <div className="collapse-title font-black uppercase text-[10px] tracking-widest py-3 min-h-0">
                    Filtrlar
                  </div>
                  <div className="collapse-content space-y-5 pt-0">
                    <div>
                      <label className="flex justify-between mb-2">
                        <span className="text-[10px] uppercase font-black opacity-40 tracking-widest">Radius</span>
                        <span className="text-[10px] font-bold text-primary">{filters.radius} km</span>
                      </label>
                      <input
                        type="range" min="0.5" max="50" step="0.5"
                        value={filters.radius}
                        onChange={(e) => setFilters({ ...filters, radius: Number(e.target.value) })}
                        className="range range-primary range-xs"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-black opacity-40 tracking-widest block mb-2">Turi</span>
                      <div className="flex flex-wrap gap-2">
                        {TOILET_TYPES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleType(t)}
                            className={`btn btn-xs rounded-full gap-1 ${
                              filters.types.includes(t) ? 'btn-primary' : 'btn-ghost bg-base-100 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <span>{TYPE_ICONS[t]}</span> {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-black opacity-40 tracking-widest block mb-2">Maks. narx (so'm)</label>
                      <input
                        type="number" min="0"
                        placeholder="Cheklov yo'q"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                        className="input input-sm input-bordered w-full bg-base-200 border-none"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between mb-2">
                        <span className="text-[10px] uppercase font-black opacity-40 tracking-widest">Min. reyting</span>
                        <span className="text-[10px] font-bold text-secondary">{filters.minRating > 0 ? `⭐ ${filters.minRating}` : "barchasi"}</span>
                      </label>
                      <input
                        type="range" min="0" max="5" step="0.5"
                        value={filters.minRating}
                        onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                        className="range range-secondary range-xs"
                      />
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-block shadow-lg shadow-primary/20 h-12 text-sm font-black tracking-wider uppercase"
                  onClick={() => loadNearby()}
                  disabled={loading}
                >
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : '🔍 Qidirish'}
                </button>
              </div>
            </div>
          </div>

          {/* Owner Section */}
          {user?.role === 'OWNER' && (
            <div className="card bg-gradient-to-br from-neutral to-neutral/80 text-neutral-content shadow-xl overflow-hidden card-hover">
              <div className="card-body p-5">
                <h3 className="font-black text-sm uppercase tracking-wider">📍 Ega bo'limi</h3>
                <p className="text-xs opacity-60 font-medium">O'z joyingizni qo'shing va boshqaring</p>
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-secondary btn-sm flex-1 font-bold" onClick={() => navigate('/my-toilets')}>
                    Joylarim
                  </button>
                  <button className="btn btn-ghost btn-sm border border-neutral-content/20 flex-1 font-bold" onClick={() => navigate('/create-toilet')}>
                    + Yangi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className="alert py-3 px-4 rounded-2xl border-none bg-primary/10 text-primary text-sm font-bold animate-slide-down">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{message}</span>
            </div>
          )}
        </aside>

        {/* ─── Results ─── */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Natijalar</h2>
              <p className="text-[10px] font-bold opacity-30 mt-1.5 tracking-widest uppercase">
                {toilets.length} ta joy mavjud
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger">
            {toilets.map((item) => (
              <div
                key={item.id}
                className="group card bg-base-100 border border-base-content/5 shadow-lg card-hover cursor-pointer overflow-hidden animate-fade-in-up"
                onClick={() => navigate(`/toilets/${item.id}`)}
              >
                <div className="card-body p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black tracking-tight leading-tight truncate group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`badge badge-sm font-bold ${TYPE_COLORS[item.type] || 'badge-ghost'}`}>
                          {TYPE_ICONS[item.type]} {item.type}
                        </span>
                      </div>
                    </div>
                    <div className={`badge badge-lg font-black border-none shrink-0 ${
                      item.status === 'OPEN'
                        ? 'bg-success/15 text-success'
                        : 'bg-error/15 text-error'
                    }`}>
                      {item.status === 'OPEN' ? '● Ochiq' : '● Yopiq'}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-base-200/50 p-3 rounded-xl text-center">
                      <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Narxi</p>
                      <p className="font-black text-base mt-0.5">{item.price}<span className="text-[10px] opacity-40 ml-0.5">uzs</span></p>
                    </div>
                    <div className="bg-base-200/50 p-3 rounded-xl text-center">
                      <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Reyting</p>
                      <p className="font-black text-base mt-0.5">⭐ {Number(item.avg_rating || 0).toFixed(1)}</p>
                    </div>
                    {item.distance !== undefined && (
                      <div className="bg-primary/10 p-3 rounded-xl text-center">
                        <p className="text-[9px] uppercase font-black opacity-40 tracking-widest text-primary">Masofa</p>
                        <p className="font-black text-base mt-0.5 text-primary">{item.distance.toFixed(1)}<span className="text-[10px] opacity-60 ml-0.5">km</span></p>
                      </div>
                    )}
                    {item.distance === undefined && (
                      <div className="bg-base-200/50 p-3 rounded-xl text-center">
                        <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">ID</p>
                        <p className="font-black text-base mt-0.5 font-mono opacity-50">#{item.id}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-base-content/5">
                    <span className="text-[10px] font-bold opacity-30 uppercase tracking-wider">
                      Batafsil →
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {toilets.length === 0 && !loading && (
              <div className="col-span-full py-24 text-center bg-base-100 rounded-3xl border-2 border-dashed border-base-content/8 animate-fade-in">
                <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl opacity-40">
                  🚽
                </div>
                <h3 className="text-xl font-black uppercase opacity-30">Hozircha bo'sh</h3>
                <p className="text-sm opacity-20 mt-2 max-w-xs mx-auto font-medium">
                  Bu hududda hech qanday joy topilmadi. Filtrlarni o'zgartirib ko'ring.
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="col-span-full py-24 text-center animate-fade-in">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-xs font-bold opacity-30 uppercase tracking-widest mt-4">Qidirilmoqda...</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

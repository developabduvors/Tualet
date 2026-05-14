import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TASHKENT = { lat: 41.3111, lng: 69.2797 };
const LOCATION_TYPES = ['public', 'mall', 'fuel'];

export default function DashboardPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [coords, setCoords] = useState(TASHKENT);
  const [filters, setFilters] = useState({
    radius: 5,
    type: '',
    priceType: '',
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadNearby(TASHKENT, filters);
  }, []);

  async function loadNearby(currentCoords = coords, currentFilters = filters) {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        lat: String(Number(currentCoords.lat)),
        lng: String(Number(currentCoords.lng)),
        radius: String(currentFilters.radius),
      });
      if (currentFilters.type) params.set('type', currentFilters.type);
      if (currentFilters.priceType) params.set('priceType', currentFilters.priceType);

      const response = await request(`/toilets/nearby?${params.toString()}`);
      const items = response.data?.data || [];
      setLocations(items);
      setMessage(`${items.length} ta joy topildi`);
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
      const items = response.data || [];
      setLocations(items);
      setMessage(`${items.length} ta joy topildi`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#a855f7] px-8 py-14 text-white shadow-2xl animate-fade-in-up">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-tight text-white">
            Eng yaqin joyni toping
          </h1>
          <p className="text-base text-white/80 mb-8 max-w-lg leading-relaxed font-medium">
            Reyting, narx va masofa bo&apos;yicha hojatxonalarni toping.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl py-3 px-5 border border-white/20">
              <div className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Topildi</div>
              <div className="text-2xl font-black text-white">{locations.length} ta</div>
            </div>
            {user && (
              <button
                className="btn btn-secondary font-bold"
                onClick={() => navigate('/create-toilet')}
              >
                Yangi joy qo&apos;shish
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary to-secondary"></div>
            <div className="card-body gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Qidiruv</h3>
                  <p className="text-[10px] opacity-40 font-bold tracking-widest uppercase mt-0.5">Nearby API</p>
                </div>
                <button className="btn btn-ghost btn-xs text-primary font-bold uppercase tracking-wider" onClick={loadAll}>
                  Hammasi
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input input-sm w-full bg-base-200 border-none font-mono text-xs"
                    value={coords.lat}
                    onChange={(e) => setCoords({ ...coords, lat: e.target.value })}
                  />
                  <input
                    className="input input-sm w-full bg-base-200 border-none font-mono text-xs"
                    value={coords.lng}
                    onChange={(e) => setCoords({ ...coords, lng: e.target.value })}
                  />
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={filters.radius}
                  onChange={(e) => setFilters({ ...filters, radius: Number(e.target.value) })}
                  className="range range-primary range-xs"
                />

                <select
                  className="select select-sm w-full bg-base-200 border-none"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">Barcha turlar</option>
                  {LOCATION_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  className="select select-sm w-full bg-base-200 border-none"
                  value={filters.priceType}
                  onChange={(e) => setFilters({ ...filters, priceType: e.target.value })}
                >
                  <option value="">Barcha narxlar</option>
                  <option value="free">free</option>
                  <option value="paid">paid</option>
                </select>

                <button
                  className="btn btn-primary btn-block shadow-lg shadow-primary/20 h-12 text-sm font-black tracking-wider uppercase"
                  onClick={() => loadNearby()}
                  disabled={loading}
                >
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Qidirish'}
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className="alert py-3 px-4 rounded-2xl border-none bg-primary/10 text-primary text-sm font-bold animate-slide-down">
              <span>{message}</span>
            </div>
          )}
        </aside>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger">
            {locations.map((item) => (
              <div
                key={item.id}
                className="group card bg-base-100 border border-base-content/5 shadow-lg card-hover cursor-pointer overflow-hidden animate-fade-in-up"
                onClick={() => navigate(`/toilets/${item.id}`)}
              >
                <div className="card-body p-6">
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xl font-black tracking-tight leading-tight truncate group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-sm opacity-50 mt-1">{item.address}</p>
                    </div>
                    <div className="badge badge-outline">{item.type}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-base-200/50 p-3 rounded-xl text-center">
                      <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Narxi</p>
                      <p className="font-black text-base mt-0.5">{item.priceAmount}</p>
                    </div>
                    <div className="bg-base-200/50 p-3 rounded-xl text-center">
                      <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Reyting</p>
                      <p className="font-black text-base mt-0.5">{Number(item.rating || 0).toFixed(1)}</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-xl text-center">
                      <p className="text-[9px] uppercase font-black opacity-40 tracking-widest text-primary">Masofa</p>
                      <p className="font-black text-base mt-0.5 text-primary">{Number(item.distanceKm || 0).toFixed(1)} km</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {locations.length === 0 && !loading && (
              <div className="col-span-full py-24 text-center bg-base-100 rounded-3xl border-2 border-dashed border-base-content/8 animate-fade-in">
                <h3 className="text-xl font-black uppercase opacity-30">Joy topilmadi</h3>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

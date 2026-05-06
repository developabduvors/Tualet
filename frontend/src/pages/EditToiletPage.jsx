import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { request } from '../lib/api';

export default function EditToiletPage() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const response = await request(`/toilets/${id}`);
      const data = response.data;
      setForm({
        name: data.name,
        lat: String(data.lat),
        lng: String(data.lng),
        price: String(data.price),
        status: data.status,
        type: data.type,
        images: (data.images || []).join(', ')
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...form,
      images: form.images
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    };

    try {
      await request(`/toilets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      navigate(`/toilets/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="font-bold opacity-30 uppercase tracking-widest text-[10px]">Ma'lumotlar yuklanmoqda...</p>
    </div>
  );

  if (!form) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
      <div className="text-5xl opacity-20">😟</div>
      <p className="font-bold opacity-40">Ma'lumot topilmadi</p>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Orqaga</button>
    </div>
  );

  return (
    <div className="flex justify-center py-10 animate-fade-in-up">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <button className="btn btn-ghost btn-sm font-bold opacity-50 hover:opacity-100 gap-2 mb-4" onClick={() => navigate(`/toilets/${id}`)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Orqaga
          </button>
          <h1 className="text-3xl font-black tracking-tight">Tahrirlash</h1>
          <p className="text-sm opacity-40 mt-1 font-medium">Joy ma'lumotlarini yangilang</p>
        </div>

        {/* Card */}
        <div className="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-secondary to-primary"></div>
          <div className="card-body p-6 lg:p-8">
            {error && (
              <div className="alert alert-error mb-6 rounded-xl animate-slide-down">
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Nomi</span>
                </label>
                <input
                  className="input input-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/20 transition-all h-12"
                  placeholder="Masalan: Markaziy Park Hojatxonasi"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Latitude</span>
                  </label>
                  <input
                    className="input input-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                    value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Longitude</span>
                  </label>
                  <input
                    className="input input-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                    value={form.lng}
                    onChange={(e) => setForm({ ...form, lng: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Narxi (uzs)</span>
                </label>
                <input
                  className="input input-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/20 transition-all h-12"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Holati</span>
                  </label>
                  <select
                    className="select select-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/20 transition-all h-12"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="OPEN">✅ Ochiq (OPEN)</option>
                    <option value="CLOSED">🔴 Yopiq (CLOSED)</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Turi</span>
                  </label>
                  <select
                    className="select select-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/20 transition-all h-12"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="PUBLIC">🏛️ Ommaviy (PUBLIC)</option>
                    <option value="PRIVATE">🔒 Xususiy (PRIVATE)</option>
                    <option value="PAID">💰 To'lovli (PAID)</option>
                    <option value="FREE">🆓 Bepul (FREE)</option>
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Rasmlar</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24 bg-base-200 border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="Rasmlar URL manzillarini vergul bilan ajrating..."
                  value={form.images}
                  onChange={(e) => setForm({ ...form, images: e.target.value })}
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-base-content/5">
                <button className="btn btn-ghost font-bold" type="button" onClick={() => navigate(`/toilets/${id}`)}>
                  Bekor qilish
                </button>
                <button className="btn btn-primary px-10 shadow-lg shadow-primary/20 font-bold" type="submit" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : "✓ O'zgarishlarni saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

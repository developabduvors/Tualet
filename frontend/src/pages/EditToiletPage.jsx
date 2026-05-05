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
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="font-bold opacity-50 uppercase tracking-widest text-xs">Ma'lumotlar yuklanmoqda...</p>
    </div>
  );

  return (
    <div className="flex justify-center py-10">
      <div className="card w-full max-w-2xl bg-base-100 shadow-2xl border border-base-content/5">
        <div className="card-body">
          <h2 className="card-title text-3xl font-black uppercase mb-6">Tahrirlash</h2>
          
          {error && (
            <div className="alert alert-error mb-6 rounded-xl">
              <span>{error}</span>
            </div>
          )}

          <form className="form-control gap-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="form-control w-full">
                <label className="label py-1"><span className="label-text font-bold uppercase text-xs opacity-60">Nomi</span></label>
                <input
                  className="input input-bordered w-full focus:input-primary"
                  placeholder="Masalan: Markaziy Park Hojatxonasi"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text font-bold uppercase text-xs opacity-60">Latitude</span></label>
                  <input
                    className="input input-bordered w-full focus:input-primary"
                    placeholder="41.3111"
                    value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    required
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text font-bold uppercase text-xs opacity-60">Longitude</span></label>
                  <input
                    className="input input-bordered w-full focus:input-primary"
                    placeholder="69.2797"
                    value={form.lng}
                    onChange={(e) => setForm({ ...form, lng: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-control w-full">
                <label className="label py-1"><span className="label-text font-bold uppercase text-xs opacity-60">Narxi (uzs)</span></label>
                <input
                  className="input input-bordered w-full focus:input-primary"
                  placeholder="2000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text font-bold uppercase text-xs opacity-60">Holati</span></label>
                  <select
                    className="select select-bordered w-full focus:select-primary"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="OPEN">OCHIQ (OPEN)</option>
                    <option value="CLOSED">YOPILGAN (CLOSED)</option>
                  </select>
                </div>
                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text font-bold uppercase text-xs opacity-60">Turi</span></label>
                  <select
                    className="select select-bordered w-full focus:select-primary"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="PUBLIC">OMMAVIY (PUBLIC)</option>
                    <option value="PRIVATE">XUSUSIY (PRIVATE)</option>
                    <option value="PAID">TO'LOVLI (PAID)</option>
                    <option value="FREE">BEPUL (FREE)</option>
                  </select>
                </div>
              </div>

              <div className="form-control w-full">
                <label className="label py-1"><span className="label-text font-bold uppercase text-xs opacity-60">Rasmlar</span></label>
                <textarea
                  className="textarea textarea-bordered h-24 focus:textarea-primary"
                  placeholder="Rasmlar URL manzillarini vergul bilan ajratib yozing..."
                  value={form.images}
                  onChange={(e) => setForm({ ...form, images: e.target.value })}
                />
                <label className="label"><span className="label-text-alt opacity-50 italic text-xs">Namuna: https://site.com/img1.jpg, https://site.com/img2.jpg</span></label>
              </div>
            </div>

            <div className="card-actions justify-between mt-6">
              <button className="btn btn-ghost" type="button" onClick={() => navigate(`/toilets/${id}`)}>
                Bekor qilish
              </button>
              <button className="btn btn-primary px-10 shadow-lg shadow-primary/20" type="submit" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "O'zgarishlarni saqlash"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

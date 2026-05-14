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
      const data = response.data.location;
      setForm({
        name: data.name,
        address: data.address,
        latitude: String(data.latitude),
        longitude: String(data.longitude),
        type: data.type,
        priceType: data.priceType,
        priceAmount: String(data.priceAmount),
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

    try {
      await request(`/toilets/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          type: form.type,
          priceType: form.priceType,
          priceAmount: Number(form.priceAmount || 0),
        }),
      });
      navigate(`/toilets/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  if (!form) return <div className="text-center py-20">{error || 'Topilmadi'}</div>;

  return (
    <div className="flex justify-center py-10 animate-fade-in-up">
      <div className="w-full max-w-2xl">
        <div className="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div className="card-body p-6 lg:p-8">
            {error && <div className="alert alert-error mb-6 rounded-xl"><span className="text-sm">{error}</span></div>}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <input className="input input-bordered w-full bg-base-200 border-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input input-bordered w-full bg-base-200 border-none" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              <div className="grid grid-cols-2 gap-4">
                <input className="input input-bordered w-full bg-base-200 border-none" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
                <input className="input input-bordered w-full bg-base-200 border-none" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select className="select select-bordered w-full bg-base-200 border-none" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="public">public</option>
                  <option value="mall">mall</option>
                  <option value="fuel">fuel</option>
                </select>
                <select className="select select-bordered w-full bg-base-200 border-none" value={form.priceType} onChange={(e) => setForm({ ...form, priceType: e.target.value })}>
                  <option value="free">free</option>
                  <option value="paid">paid</option>
                </select>
              </div>
              <input className="input input-bordered w-full bg-base-200 border-none" type="number" value={form.priceAmount} onChange={(e) => setForm({ ...form, priceAmount: e.target.value })} required />
              <button className="btn btn-primary px-10 shadow-lg shadow-primary/20 font-bold" type="submit" disabled={loading}>
                {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Saqlash'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

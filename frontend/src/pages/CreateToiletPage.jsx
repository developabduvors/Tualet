import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../lib/api';

const emptyForm = {
  name: '',
  address: '',
  latitude: '41.3111',
  longitude: '69.2797',
  type: 'public',
  priceType: 'free',
  priceAmount: '0',
};

export default function CreateToiletPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await request('/toilets', {
        method: 'POST',
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
      navigate(`/toilets/${response.data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center py-10 animate-fade-in-up">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">Yangi joy qo&apos;shish</h1>
        </div>

        <div className="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div className="card-body p-6 lg:p-8">
            {error && <div className="alert alert-error mb-6 rounded-xl"><span className="text-sm">{error}</span></div>}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <input className="input input-bordered w-full bg-base-200 border-none" placeholder="Nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input input-bordered w-full bg-base-200 border-none" placeholder="Manzil" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              <div className="grid grid-cols-2 gap-4">
                <input className="input input-bordered w-full bg-base-200 border-none" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
                <input className="input input-bordered w-full bg-base-200 border-none" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
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
              <input className="input input-bordered w-full bg-base-200 border-none" type="number" placeholder="Narx" value={form.priceAmount} onChange={(e) => setForm({ ...form, priceAmount: e.target.value })} required />
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

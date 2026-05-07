import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'USER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      login(response.accessToken, response.refreshToken);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center py-10 lg:py-20 animate-fade-in-up">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-secondary/20 animate-pulse-glow">
            ✨
          </div>
          <h1 className="text-3xl font-black tracking-tight">Hisob yarating</h1>
          <p className="text-sm opacity-50 mt-2 font-medium">Tizimga qo'shiling va boshqalar bilan ulashing</p>
        </div>

        {/* Card */}
        <div className="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary"></div>
          <div className="card-body p-8">
            {error && (
              <div className="alert alert-error mb-4 py-3 text-sm rounded-xl animate-slide-down">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Ismingiz</span>
                </label>
                <input
                  className="input input-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/30 transition-all h-12 font-medium"
                  placeholder="Ismingizni kiriting"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Telefon raqam</span>
                </label>
                <input
                  className="input input-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/30 transition-all h-12 font-medium"
                  placeholder="+998 90 123 45 67"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Parol</span>
                </label>
                <input
                  className="input input-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/30 transition-all h-12 font-medium"
                  placeholder="••••••••"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Rol</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                      form.role === 'USER'
                        ? 'border-primary bg-primary/10'
                        : 'border-base-content/10 hover:border-base-content/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      className="radio radio-primary radio-sm"
                      checked={form.role === 'USER'}
                      onChange={() => setForm({ ...form, role: 'USER' })}
                    />
                    <div>
                      <div className="font-bold text-sm">Foydalanuvchi</div>
                      <div className="text-[10px] opacity-40">Joy qidirish</div>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                      form.role === 'OWNER'
                        ? 'border-secondary bg-secondary/10'
                        : 'border-base-content/10 hover:border-base-content/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      className="radio radio-secondary radio-sm"
                      checked={form.role === 'OWNER'}
                      onChange={() => setForm({ ...form, role: 'OWNER' })}
                    />
                    <div>
                      <div className="font-bold text-sm">Egasi</div>
                      <div className="text-[10px] opacity-40">Joy boshqarish</div>
                    </div>
                  </label>
                </div>
              </div>
              <button
                className="btn btn-primary btn-block h-12 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all mt-2"
                type="submit"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-sm"></span> : "Ro'yxatdan o'tish"}
              </button>
            </form>
            <div className="divider text-[10px] opacity-30 uppercase tracking-widest my-6">yoki</div>
            <p className="text-center text-sm font-medium opacity-70">
              Akkauntingiz bormi?{' '}
              <Link to="/login" className="link link-primary font-bold no-underline hover:underline">
                Kirish
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

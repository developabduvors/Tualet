import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await request('/auth/login', {
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-primary/20 animate-pulse-glow">
            🚽
          </div>
          <h1 className="text-3xl font-black tracking-tight">Xush kelibsiz</h1>
          <p className="text-sm opacity-50 mt-2 font-medium">Hisobingizga kiring</p>
        </div>

        {/* Card */}
        <div className="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
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
              <button
                className="btn btn-primary btn-block h-12 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all mt-2"
                type="submit"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Kirish'}
              </button>
            </form>
            <div className="divider text-[10px] opacity-30 uppercase tracking-widest my-6">yoki</div>
            <p className="text-center text-sm font-medium opacity-70">
              Akkauntingiz yo'qmi?{' '}
              <Link to="/register" className="link link-primary font-bold no-underline hover:underline">
                Ro'yxatdan o'ting
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

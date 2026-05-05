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
      login(response.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center py-10 lg:py-20">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center mb-4">Xush kelibsiz</h2>
          {error && (
            <div className="alert alert-error mb-4 py-2 text-sm rounded-lg">
              <span>{error}</span>
            </div>
          )}
          <form className="form-control gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="label py-1">
                <span className="label-text font-semibold text-xs opacity-70 uppercase tracking-wider">Telefon</span>
              </label>
              <input
                className="input input-bordered w-full focus:input-primary transition-all"
                placeholder="+998901234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label py-1">
                <span className="label-text font-semibold text-xs opacity-70 uppercase tracking-wider">Parol</span>
              </label>
              <input
                className="input input-bordered w-full focus:input-primary transition-all"
                placeholder="••••••••"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="card-actions mt-4">
              <button className="btn btn-primary btn-block text-lg shadow-lg shadow-primary/20" type="submit" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : 'Kirish'}
              </button>
            </div>
          </form>
          <div className="divider text-xs opacity-50 uppercase">yoki</div>
          <p className="text-center text-sm">
            Akkauntingiz yo'qmi?{' '}
            <Link to="/register" className="link link-primary font-bold">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

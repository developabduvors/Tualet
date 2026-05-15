import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, loginGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Parollar mos kelmaydi');
      return;
    }

    try {
      setPending(true);
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleRegister() {
    try {
      setPending(true);
      await loginGoogle();
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }

  return (
    <div className="flex justify-center items-center py-10 lg:py-20 animate-fade-in-up">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight">Ro&apos;yxatdan o&apos;tish</h1>
          <p className="text-sm opacity-50 mt-2 font-medium">
            Yangi hisob yarating
          </p>
        </div>

        <div className="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary"></div>
          <div className="card-body p-8">
            {error && (
              <div className="alert alert-error mb-4 py-3 text-sm rounded-xl">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-semibold text-sm">Ism</span>
                </label>
                <input
                  id="register-name"
                  type="text"
                  className="input input-bordered w-full h-12 rounded-xl focus:input-primary transition-all"
                  placeholder="Ismingiz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={pending}
                />
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-semibold text-sm">Email</span>
                </label>
                <input
                  id="register-email"
                  type="email"
                  className="input input-bordered w-full h-12 rounded-xl focus:input-primary transition-all"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={pending}
                />
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-semibold text-sm">Parol</span>
                </label>
                <input
                  id="register-password"
                  type="password"
                  className="input input-bordered w-full h-12 rounded-xl focus:input-primary transition-all"
                  placeholder="Kamida 6 ta belgi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={pending}
                />
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-semibold text-sm">Parolni tasdiqlash</span>
                </label>
                <input
                  id="register-confirm-password"
                  type="password"
                  className="input input-bordered w-full h-12 rounded-xl focus:input-primary transition-all"
                  placeholder="Parolni qayta kiriting"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={pending}
                />
              </div>

              <button
                id="register-submit"
                className="btn btn-primary btn-block h-12 text-base font-bold shadow-lg shadow-primary/25 mt-2"
                type="submit"
                disabled={pending}
              >
                {pending ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Ro'yxatdan o'tish"
                )}
              </button>
            </form>

            <div className="divider text-xs opacity-40 font-semibold my-4">YOKI</div>

            <button
              id="google-register"
              className="btn btn-outline btn-block h-12 text-sm font-bold gap-2"
              type="button"
              onClick={handleGoogleRegister}
              disabled={pending}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google bilan davom etish
            </button>

            <p className="text-center text-sm font-medium opacity-70 mt-6">
              Avval kirganmisiz?{' '}
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

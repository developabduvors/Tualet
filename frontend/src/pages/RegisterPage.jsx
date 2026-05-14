import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { login, user, loading } = useAuth();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function handleGoogleRegister() {
    try {
      setPending(true);
      await login();
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
          <p className="text-sm opacity-50 mt-2 font-medium">Birinchi Google login avtomatik hisob yaratadi</p>
        </div>

        <div className="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary"></div>
          <div className="card-body p-8">
            {error && (
              <div className="alert alert-error mb-4 py-3 text-sm rounded-xl">
                <span>{error}</span>
              </div>
            )}

            <button
              className="btn btn-primary btn-block h-12 text-base font-bold shadow-lg shadow-primary/25"
              type="button"
              onClick={handleGoogleRegister}
              disabled={pending}
            >
              {pending ? <span className="loading loading-spinner loading-sm"></span> : 'Google bilan davom etish'}
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

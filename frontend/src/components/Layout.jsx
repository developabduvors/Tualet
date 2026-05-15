import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name || user?.email || 'Foydalanuvchi';

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <nav className="navbar glass-panel sticky top-0 z-50 px-4 lg:px-8 shadow-lg border-b border-base-content/5">
        <div className="flex-1">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              Toilet
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-primary tracking-[0.25em] uppercase leading-none">
                Toilet Finder
              </span>
              <span className="text-lg font-black tracking-tight leading-tight group-hover:text-primary transition-colors">
                LUXURY REST
              </span>
            </div>
          </div>
        </div>

        <div className="flex-none gap-2">
          {user ? (
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar placeholder ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
              >
                <div className="bg-gradient-to-br from-primary to-secondary text-primary-content rounded-full w-10">
                  <span className="text-sm font-bold">{displayName.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <ul
                tabIndex={0}
                className="mt-3 z-[1] p-3 shadow-2xl menu menu-sm dropdown-content glass-panel rounded-2xl w-60 animate-slide-down"
              >
                <li className="px-3 py-2 border-b border-base-content/5 mb-2">
                  <div className="flex flex-col gap-0.5 hover:bg-transparent cursor-default">
                    <span className="font-bold text-sm">{displayName}</span>
                    {user.email && <span className="text-[10px] opacity-40">{user.email}</span>}
                  </div>
                </li>
                <li><Link to="/" className="font-medium">Bosh sahifa</Link></li>
                <li><Link to="/my-toilets" className="font-medium">Mening joylarim</Link></li>
                <li><Link to="/create-toilet" className="font-medium">Yangi joy</Link></li>
                <div className="divider my-1"></div>
                <li>
                  <button onClick={logout} className="text-error font-bold">
                    Chiqish
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn btn-ghost btn-sm font-bold hover:text-primary transition-colors">
                Kirish
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm font-bold shadow-lg shadow-primary/20">
                Ro&apos;yxat
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 container mx-auto p-4 lg:p-8 max-w-7xl">
        {children}
      </main>

      <footer className="border-t border-base-content/5 py-6 px-8">
        <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold opacity-40 tracking-widest uppercase">
              Luxury Rest 2026
            </span>
          </div>
          <p className="text-xs opacity-30 font-medium">
            Premium Restroom Locator
          </p>
        </div>
      </footer>
    </div>
  );
}

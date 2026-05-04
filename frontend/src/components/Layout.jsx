import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <div className="navbar bg-base-100 shadow-sm px-4 lg:px-8 sticky top-0 z-50">
        <div className="flex-1">
          <div 
            className="flex flex-col cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <span className="text-xs font-bold text-primary tracking-widest uppercase">Toilet Finder</span>
            <span className="text-xl font-black tracking-tight">LUXURY REST</span>
          </div>
        </div>
        <div className="flex-none gap-2">
          {user ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                <li className="menu-title text-xs opacity-60">{user.name} ({user.role})</li>
                <li><button onClick={logout}>Log out</button></li>
              </ul>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 container mx-auto p-4 lg:p-8 max-w-7xl">
        {children}
      </main>

      <footer className="footer footer-center p-4 bg-base-300 text-base-content">
        <aside>
          <p>© 2026 Toilet Finder - Premium Restroom Locator</p>
        </aside>
      </footer>
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ToiletDetailPage from './pages/ToiletDetailPage';
import CreateToiletPage from './pages/CreateToiletPage';
import EditToiletPage from './pages/EditToiletPage';
import AdminPage from './pages/AdminPage';
import MyToiletsPage from './pages/MyToiletsPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/toilets/:id" element={<ToiletDetailPage />} />
        <Route path="/create-toilet" element={<ProtectedRoute><CreateToiletPage /></ProtectedRoute>} />
        <Route path="/toilets/:id/edit" element={<ProtectedRoute><EditToiletPage /></ProtectedRoute>} />
        <Route path="/admin" element={
          <RoleProtectedRoute roles={['ADMIN']}>
            <AdminPage />
          </RoleProtectedRoute>
        } />
        <Route path="/my-toilets" element={
          <RoleProtectedRoute roles={['OWNER', 'ADMIN']}>
            <MyToiletsPage />
          </RoleProtectedRoute>
        } />
        {/* Protected routes can be added here */}
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

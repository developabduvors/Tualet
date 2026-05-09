import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ToiletDetailPage from './pages/ToiletDetailPage';
import CreateToiletPage from './pages/CreateToiletPage';
import EditToiletPage from './pages/EditToiletPage';
import MyToiletsPage from './pages/MyToiletsPage';

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/toilets/:id" element={<ToiletDetailPage />} />
        <Route path="/create-toilet" element={
          <RoleProtectedRoute roles={['OWNER']}>
            <CreateToiletPage />
          </RoleProtectedRoute>
        } />
        <Route path="/toilets/:id/edit" element={
          <RoleProtectedRoute roles={['OWNER']}>
            <EditToiletPage />
          </RoleProtectedRoute>
        } />
        <Route path="/my-toilets" element={
          <RoleProtectedRoute roles={['OWNER']}>
            <MyToiletsPage />
          </RoleProtectedRoute>
        } />
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

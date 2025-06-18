import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, Link, Outlet } from 'react-router-dom';

// Impor komponen UI Anda
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardCard from './components/DashboardCard';
import DokumenMenu from './components/DocumentMenu';
import AdvertiserMenu from './components/AdvertiserMenu';

// Impor halaman-halaman Anda
import DataUserPage from './pages/DataUserPage';
import DataSoalPage from './pages/DataSoalPage';
import ComingSoonPage from './pages/ComingSoonPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import AccessDeniedPage from './pages/AccessDeniedPage'; 

// Impor konfigurasi axios yang sudah kita buat
import apiClient from './api/axiosConfig'; // PASTIKAN FILE INI SUDAH DIBUAT

import './App.css';

//======================================================================
// KOMPONEN-KOMPONEN ROUTING BARU
//======================================================================

/**
 * Melindungi rute yang memerlukan autentikasi & otorisasi.
 * Melakukan pengecekan token secara real-time ke server.
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const [auth, setAuth] = useState({ isLoading: true, isAuthenticated: false, userRole: null });
  const navigate = useNavigate(); // Gunakan useNavigate untuk redirect

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setAuth({ isLoading: false, isAuthenticated: false, userRole: null });
        return;
      }
      try {
        // Pastikan Anda mengirim token di header Authorization
        // apiClient sudah dikonfigurasi untuk menambahkan Authorization header
        const { data } = await apiClient.get('/auth/me'); // <-- Pastikan path ini benar
        localStorage.setItem('userRole', data.data.role); // <-- data.user.role menjadi data.data.role
        setAuth({ isLoading: false, isAuthenticated: true, userRole: data.data.role }); // <-- data.user.role menjadi data.data.role
      } catch (error) {
        console.error("Token verification failed:", error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        setAuth({ isLoading: false, isAuthenticated: false, userRole: null });
        navigate('/admin/login', { replace: true }); // Redirect ke login jika token gagal
      }
    };
    verifyToken();
  }, [navigate]); // navigate sebagai dependency

  // ... (loading, redirect logic) ...
  if (auth.isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.userRole)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
};

/**
 * Mencegah user yang sudah login mengakses halaman publik seperti login/register.
 */
const PublicRoute = () => {
  const token = localStorage.getItem('accessToken');
  // Jika ada token, langsung arahkan ke dashboard
  return token ? <Navigate to="/" replace /> : <Outlet />;
};

//======================================================================
// KOMPONEN UTAMA APP
//======================================================================

function App() {
  // Data untuk item dashboard bisa dipindahkan ke komponennya sendiri jika perlu
  const simpleDashboardItems = [
    { title: { text: 'Data User', icon: 'people' }, category: 'data-green', path: '/admin/data-user' },
    { title: { text: 'Data Soal', icon: 'assignment' }, category: 'data-green', path: '/admin/data-soal' },
    { title: { text: 'Affiliate', icon: 'group_add' }, category: 'data-green', path: '/admin/affiliate' },
    { title: { text: 'App Config', icon: 'android' }, category: 'data-yellow', path: '/admin/app-config' },
    { title: { text: 'Refferal', icon: 'vpn_key' }, category: 'data-yellow', path: '/admin/refferal' },
    { title: { text: 'Admin', icon: 'security' }, category: 'data-yellow', path: '/admin/admin' },
    { title: { text: 'Analis', icon: 'bar_chart' }, category: 'data-blue', path: '/admin/analis' },
    { title: { text: 'Advetiser', icon: 'campaign' }, category: 'data-blue', path: '/admin/advertiser' },
  ];

  const ClickableDashboardCard = ({ title, type, isSimpleCard, path }) => {
    const navigate = useNavigate();
    const handleClick = () => { if (path) { navigate(path); } };
    return (
      <DashboardCard
        title={
          <>
            <i className="material-icons simple-card-icon">{title.icon}</i>
            <span className="simple-card-title">{title.text}</span>
          </>
        }
        type={type}
        isSimpleCard={isSimpleCard}
        onClick={handleClick}
        style={{ cursor: path ? 'pointer' : 'default' }}
      />
    );
  };

  // Komponen untuk Layout Utama Dashboard
  const MainLayout = () => (
    <div className="app-layout">
      {/* <Sidebar /> */}
      <div className="main-content">
        <Navbar />
        <div className="dashboard-content">
          {/* Konten halaman dinamis akan dirender di sini */}
          <Outlet />
        </div>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        {/* Rute Standalone (tidak butuh proteksi khusus) */}
        <Route path="/access-denied" element={<AccessDeniedPage />} />

        {/* Grup Rute Publik (Hanya untuk Tamu) */}
        <Route element={<PublicRoute />}>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/register" element={<RegisterPage />} />
          <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin/verify-otp" element={<VerifyOtpPage />} />
        </Route>

        {/* Grup Rute Terproteksi (Hanya untuk Pengguna Terautentikasi & Terotorisasi) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          {/* Semua rute di dalam sini akan memiliki layout utama */}
          <Route element={<MainLayout />}>
            <Route path="/admin" element={
              <div className="simple-dashboard-grid">
                {simpleDashboardItems.map((item, index) => (
                  <ClickableDashboardCard
                    key={index}
                    title={item.title}
                    type={item.category}
                    isSimpleCard={true}
                    path={item.path}
                  />
                ))}
              </div>
            } />
            <Route path="/admin/data-user" element={<DataUserPage />} />
            <Route path="/admin/data-soal" element={<DataSoalPage />} />
            <Route path="/admin/app-config" element={<DokumenMenu />} />
            <Route path="/admin/advertiser" element={<AdvertiserMenu />} />
            <Route path="/admin/affiliate" element={<ComingSoonPage />} />
            <Route path="/admin/admin" element={<ComingSoonPage />} />
            <Route path="/admin/analis" element={<ComingSoonPage />} />
            <Route path="/admin/refferal" element={<ComingSoonPage />} />

            {/* Rute 'catch-all' untuk halaman tidak ditemukan di dalam dashboard */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
// src/components/PublicRoute.js (buat file baru)

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
    // Cukup cek keberadaan token, karena ProtectedRoute sudah menangani validasi
    const token = localStorage.getItem('accessToken');

    // Jika ada token, redirect ke dashboard. Jika tidak, tampilkan halaman (login/register).
    return token ? <Navigate to="/" /> : <Outlet />;
};

export default PublicRoute;
import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import apiClient from '../api/axiosConfig'; // Gunakan instance axios kita

// const ProtectedRoute = () => {
//     const [isAuthenticated, setIsAuthenticated] = useState(null); // null = sedang mengecek

//     useEffect(() => {
//         const checkAuth = async () => {
//             const token = localStorage.getItem('accessToken');
//             if (!token) {
//                 setIsAuthenticated(false);
//                 return;
//             }

//             try {
//                 // Endpoint ini harus ada di backend Anda
//                 // Endpoint yang hanya mengembalikan data user jika token valid
//                 await apiClient.get('/auth/me'); // Atau endpoint profil user
//                 setIsAuthenticated(true);
//             } catch (error) {
//                 // Jika error (misal 401), token tidak valid
//                 console.error("Authentication check failed", error);
//                 localStorage.removeItem('accessToken'); // Hapus token yg tidak valid
//                 localStorage.removeItem('refreshToken');
//                 setIsAuthenticated(false);
//             }
//         };

//         checkAuth();
//     }, []);

//     if (isAuthenticated === null) {
//         // Tampilkan loading spinner atau halaman kosong selagi mengecek
//         return <div>Loading...</div>;
//     }

//     return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" />;
// };

// export default ProtectedRoute;
// GANTI SEMENTARA UNTUK DEBUGGING

const ProtectedRoute = ({ allowedRoles }) => {
    const isAuthenticated = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');

    console.log('DEBUG: Is Authenticated?', isAuthenticated);
    console.log('DEBUG: User Role?', userRole);

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/access-denied" replace />;
    }

    // Jika semua oke, tampilkan konten yang dilindungi
    return <Outlet />;
};
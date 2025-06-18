import React from 'react';
import { useNavigate } from 'react-router-dom'; // Ganti Link dengan useNavigate
import './AccessDeniedPage.css'; // File CSS dari saran sebelumnya

const AccessDeniedPage = () => {
    // Gunakan hook useNavigate untuk mengontrol navigasi secara manual
    const navigate = useNavigate();

    // Fungsi ini akan dijalankan saat tombol diklik
    const handleLogoutAndRedirect = () => {
        // 1. Hapus semua item terkait autentikasi dari localStorage
        console.log("Clearing local storage and logging out...");
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');

        // 2. Arahkan pengguna ke halaman login
        // 'replace: true' akan mengganti riwayat halaman saat ini, sehingga pengguna tidak bisa kembali (back) ke halaman "Akses Ditolak"
        navigate('/admin/login', { replace: true });
    };

    return (
        <div className="access-denied-container">
            <div className="access-denied-card">

                <div className="icon-container">
                    <i className="material-icons lock-icon">lock_person</i>
                </div>

                <h1 className="error-title">Akses Ditolak</h1>
                <p className="error-code">ERROR 403: FORBIDDEN</p>

                <p className="error-description">
                    Maaf, sesi Anda mungkin telah berakhir atau Anda tidak memiliki hak akses yang diperlukan.
                    Silakan coba login kembali.
                </p>

                {/* GANTI <Link> DENGAN <button> */}
                <button onClick={handleLogoutAndRedirect} className="btn btn-primary btn-lg mt-4">
                    <i className="material-icons" style={{ marginRight: '8px', verticalAlign: 'middle' }}>login</i>
                    Login Kembali
                </button>
            </div>
        </div>
    );
};

export default AccessDeniedPage;
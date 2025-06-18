import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'danger'
    const [loading, setLoading] = useState(false); // State untuk loading
    const navigate = useNavigate();

    // --- Objek Gaya CSS yang Disesuaikan ---
    const loginPageStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        padding: '1rem',
        fontFamily: "'Poppins', sans-serif" // Font lebih modern
    };

    const cardLoginStyle = {
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
        border: 'none',
    };

    // BARU: Gaya untuk pembungkus input (menggantikan inputGroupStyle)
    const inputWrapperStyle = {
        position: 'relative', // Penting untuk posisi ikon
        marginBottom: '1.75rem'
    };

    // BARU: Gaya untuk ikon di dalam input
    const inputIconStyle = {
        position: 'absolute',
        left: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#adb5bd' // Warna ikon lebih soft
    };

    // BARU: Gaya untuk input field itu sendiri
    const inputFieldStyle = {
        paddingLeft: '45px', // KUNCI UTAMA: Beri ruang untuk ikon di kiri
        height: '50px', // Tinggi input field yang konsisten
        borderRadius: '8px' // Sudut lebih modern
    };

    const buttonStyle = {
        width: '100%',
        fontWeight: 'bold',
        fontSize: '1rem',
        padding: '12px',
        borderRadius: '8px', // Samakan dengan input
    };

    const linkContainerStyle = {
        marginTop: '1.5rem'
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        setLoading(true); // Mulai loading

        try {
            const response = await apiClient.post('/auth/login', {
                email,
                password,
              });
        
            if (response.status === 200) {
                const { accessToken, refreshToken, user } = response.data;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('userRole', user.role);
                setMessage('Login berhasil! Mengarahkan ke dashboard...');
                setMessageType('success');
                navigate('/admin', { replace: true });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Email atau password salah.';
            setMessage(errorMessage);
            setMessageType('danger');
        } finally {
            setLoading(false); // Selesai loading
        }
    };

    const Alert = ({ msg, type }) => {
        if (!msg) return null;
        return (
            <div className={`alert alert-${type} text-center`}>
                {msg}
            </div>
        );
    };

    return (
        <div style={loginPageStyle}>
            <div className="card" style={cardLoginStyle}>
                <div className="card-header text-center bg-transparent border-0 pt-2 pb-3">
                    <h3 className="card-title" style={{ fontWeight: '700', color: '#333' }}>Selamat Datang!</h3>
                    <p className="text-muted mb-0">Login ke Akun Admin Anda</p>
                </div>
                <div className="card-body">
                    <Alert msg={message} type={messageType} />
                    <form onSubmit={handleSubmit} noValidate>

                        {/* --- STRUKTUR INPUT BARU UNTUK EMAIL --- */}
                        <div style={inputWrapperStyle}>
                            <i className="material-icons" style={inputIconStyle}>email</i>
                            <input
                                type="email"
                                className="form-control"
                                style={inputFieldStyle} // Terapkan gaya baru
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* --- STRUKTUR INPUT BARU UNTUK PASSWORD --- */}
                        <div style={inputWrapperStyle}>
                            <i className="material-icons" style={inputIconStyle}>lock_outline</i>
                            <input
                                type="password"
                                className="form-control"
                                style={inputFieldStyle} // Terapkan gaya baru
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="card-footer bg-transparent border-0 text-center p-0 mt-4">
                            <button type="submit" className="btn btn-primary btn-lg" style={buttonStyle} disabled={loading}>
                                {loading ? 'Memproses...' : 'Login'}
                            </button>
                            <div style={linkContainerStyle}>
                                <p className="description text-center mb-1">
                                    Belum punya akun? <Link to="/admin/register">Daftar di sini</Link>
                                </p>
                                <p className="description text-center">
                                    <Link to="/admin/forgot-password">Lupa Password?</Link>
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
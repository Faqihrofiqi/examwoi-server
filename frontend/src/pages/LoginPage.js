import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // Sesuaikan dengan URL backend Anda

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'danger'
    const navigate = useNavigate();

    // --- Objek Gaya CSS untuk Komponen ---
    // Gaya untuk wadah utama yang memenuhi layar
    const loginPageStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5', // Latar belakang abu-abu lembut
        padding: '1rem' // Padding untuk keamanan di layar kecil
    };

    // Gaya untuk kartu login
    const cardLoginStyle = {
        width: '100%',
        maxWidth: '420px', // Lebar maksimum kartu
        padding: '2rem', // Padding di dalam kartu
        borderRadius: '10px', // Sudut lebih tumpul
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)', // Bayangan halus
        border: 'none' // Hapus border default
    };

    // Gaya untuk grup input
    const inputGroupStyle = {
        marginBottom: '1.5rem' // Jarak antar input field
    };

    // Gaya untuk tombol login
    const buttonStyle = {
        width: '100%', // Tombol memenuhi lebar kartu
        fontWeight: 'bold',
        fontSize: '1rem',
        padding: '0.75rem'
    };

    // Gaya untuk area link
    const linkContainerStyle = {
        marginTop: '1.5rem' // Jarak dari tombol ke link
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
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
                navigate('/admin/', { replace: true });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.errors?.[0]?.msg ||
                'Terjadi kesalahan tak terduga saat login.';
            setMessage(errorMessage);
            setMessageType('danger');
        }
    };

    const Alert = ({ msg, type }) => {
        if (!msg) return null;
        return (
            <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
                {msg}
                <button type="button" className="close" data-dismiss="alert" aria-label="Close" onClick={() => setMessage('')}>
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        );
    };

    return (
        // Menerapkan gaya ke wadah utama
        <div style={loginPageStyle}>
            {/* Menerapkan gaya ke kartu login */}
            <div className="card" style={cardLoginStyle}>
                <div className="card-header text-center bg-transparent border-0 pt-3 pb-2">
                    <h4 className="card-title" style={{ fontWeight: 'bold', color: '#333' }}>Login Admin</h4>
                </div>
                <div className="card-body">
                    <Alert msg={message} type={messageType} />
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="input-group" style={inputGroupStyle}>
                            <div className="input-group-prepend">
                                <span className="input-group-text bg-transparent border-right-0">
                                    <i className="material-icons">email</i>
                                </span>
                            </div>
                            <input
                                type="email"
                                className="form-control border-left-0"
                                placeholder="Email..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group" style={inputGroupStyle}>
                            <div className="input-group-prepend">
                                <span className="input-group-text bg-transparent border-right-0">
                                    <i className="material-icons">lock_outline</i>
                                </span>
                            </div>
                            <input
                                type="password"
                                className="form-control border-left-0"
                                placeholder="Password..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="card-footer bg-transparent border-0 text-center p-0 mt-4">
                            <button type="submit" className="btn btn-primary btn-lg" style={buttonStyle}>
                                Login
                            </button>
                            <div style={linkContainerStyle}>
                                <p className="description text-center mb-1">
                                    Belum punya akun? <Link to="/admin/register">Daftar di sini</Link>
                                </p>
                                <p className="description text-center">
                                    <Link to="/admin/reset-password">Lupa Password?</Link>
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
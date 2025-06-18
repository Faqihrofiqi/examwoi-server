import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_CONFIG from '../api/apiConfig';
import apiClient from '../api/axiosConfig';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'danger'
    const navigate = useNavigate();

    // --- Objek Gaya CSS untuk Komponen (Konsisten dengan Halaman Login) ---
    const pageStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        padding: '1rem'
    };

    const cardRegisterStyle = {
        width: '100%',
        maxWidth: '500px', // Sedikit lebih lebar untuk form registrasi
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
        border: 'none'
    };

    const inputGroupStyle = {
        marginBottom: '1.25rem' // Jarak antar input sedikit lebih rapat
    };

    const buttonStyle = {
        width: '100%',
        fontWeight: 'bold',
        fontSize: '1rem',
        padding: '0.75rem'
    };

    const linkContainerStyle = {
        marginTop: '1.5rem'
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');

        try {
            // MENGGUNAKAN apiClient.post, bukan axios.post
            // URL-nya hanya endpoint-nya saja, karena baseURL sudah ada di apiClient
            const response = await apiClient.post('/auth/register', {
                email,
                password,
                username,
                phone,
            });

            if (response.status === 201) {
                setMessage('Registrasi berhasil! Silakan cek email Anda untuk verifikasi.');
                setMessageType('success');
                // Arahkan ke halaman verifikasi setelah beberapa saat
                setTimeout(() => {
                    navigate('/admin/verify-otp', { state: { email } });
                }, 2000);
            }
        } catch (error) {
            // Blok 'catch' ini tetap penting untuk menangani error spesifik dari endpoint ini,
            // seperti error validasi (400 Bad Request) atau lainnya.
            // Error 401/403 akan ditangani oleh interceptor, tetapi error lain akan ditangkap di sini.
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.errors?.[0]?.msg ||
                'Terjadi kesalahan tak terduga saat registrasi.';
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
        <div style={pageStyle}>
            {/* Menerapkan gaya ke kartu registrasi */}
            <div className="card" style={cardRegisterStyle}>
                <div className="card-header text-center bg-transparent border-0 pt-3 pb-2">
                    <h4 className="card-title" style={{ fontWeight: 'bold', color: '#333' }}>Daftar Akun Baru</h4>
                </div>
                <div className="card-body">
                    <Alert msg={message} type={messageType} />
                    <form onSubmit={handleSubmit} noValidate>
                        {/* Input untuk Username */}
                        <div className="input-group" style={inputGroupStyle}>
                            <div className="input-group-prepend">
                                <span className="input-group-text bg-transparent border-right-0">
                                    <i className="material-icons">person</i>
                                </span>
                            </div>
                            <input
                                type="text"
                                className="form-control border-left-0"
                                placeholder="Username..."
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        {/* Input untuk Email */}
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

                        {/* Input untuk Nomor Telepon */}
                        <div className="input-group" style={inputGroupStyle}>
                            <div className="input-group-prepend">
                                <span className="input-group-text bg-transparent border-right-0">
                                    <i className="material-icons">phone</i>
                                </span>
                            </div>
                            <input
                                type="tel"
                                className="form-control border-left-0"
                                placeholder="Nomor Telepon..."
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>

                        {/* Input untuk Password */}
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
                                Daftar
                            </button>
                            <div style={linkContainerStyle}>
                                <p className="description text-center">
                                    Sudah punya akun? <Link to="/admin/login">Login di sini</Link>
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
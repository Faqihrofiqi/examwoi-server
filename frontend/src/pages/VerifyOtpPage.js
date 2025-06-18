import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

const VerifyOtpPage = () => {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const navigate = useNavigate();

    // --- Objek Gaya CSS (Sama seperti halaman lainnya) ---
    const pageStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        padding: '1rem'
    };

    const cardStyle = {
        width: '100%',
        maxWidth: '420px',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
        border: 'none'
    };

    const inputGroupStyle = {
        marginBottom: '1.5rem'
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
            // Ganti axios.post dengan apiClient.post dan sederhanakan URL
            const response = await apiClient.post('/auth/verify', { email, otp });

            if (response.status === 200) {
                setMessage('Verifikasi berhasil! Anda akan diarahkan ke halaman login.');
                setMessageType('success');
                setTimeout(() => navigate('/admin/login'), 2500);
            }
        } catch (error) {
            // Blok catch ini tetap dipertahankan untuk menangani pesan error spesifik,
            // misalnya jika OTP yang dimasukkan salah atau sudah kedaluwarsa.
            const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat verifikasi OTP.';
            setMessage(errorMessage);
            setMessageType('danger');
        }
    };
    
    const Alert = ({ msg, type }) => {
        if (!msg) return null;
        return (
            <div className={`alert alert-${type}`} role="alert">
                {msg}
            </div>
        );
    };

    return (
        <div style={pageStyle}>
            <div className="card" style={cardStyle}>
                <div className="card-header text-center bg-transparent border-0 pt-3 pb-2">
                    <h4 className="card-title" style={{ fontWeight: 'bold', color: '#333' }}>Verifikasi Akun</h4>
                    <p className="text-muted">Masukkan kode OTP yang dikirim ke email Anda.</p>
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
                                    <i className="material-icons">vpn_key</i>
                                </span>
                            </div>
                            <input
                                type="text"
                                className="form-control border-left-0"
                                placeholder="Kode OTP..."
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                        </div>
                        <div className="card-footer bg-transparent border-0 text-center p-0 mt-4">
                            <button type="submit" className="btn btn-primary btn-lg" style={buttonStyle}>
                                Verifikasi
                            </button>
                            <div style={linkContainerStyle}>
                                <p className="description text-center">
                                    <Link to="/admin/login">Kembali ke Login</Link>
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtpPage;
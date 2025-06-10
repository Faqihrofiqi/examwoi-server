import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // Nanti akan kita ubah dengan dotenv

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const navigate = useNavigate();

    // --- Objek Gaya CSS (Konsisten dengan halaman lain) ---
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
            const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });

            if (response.status === 200) {
                setMessage('Jika email terdaftar, instruksi reset password telah dikirim.');
                setMessageType('success');
                // Alihkan ke halaman reset password setelah jeda, sambil mengirim email
                setTimeout(() => {
                    navigate('/admin/reset-password', { state: { email } });
                }, 3000);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.';
            // Untuk Lupa Password, seringkali kita tidak ingin memberi tahu jika email tidak ada karena alasan keamanan
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
                    <h4 className="card-title" style={{ fontWeight: 'bold', color: '#333' }}>Lupa Password</h4>
                    <p className="text-muted">Masukkan email Anda untuk menerima kode OTP.</p>
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
                                placeholder="Masukkan Email Anda..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="card-footer bg-transparent border-0 text-center p-0 mt-4">
                            <button type="submit" className="btn btn-primary btn-lg" style={buttonStyle}>
                                Kirim Instruksi
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

export default ForgotPasswordPage;
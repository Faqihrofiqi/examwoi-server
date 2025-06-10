import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const API_BASE_URL = 'process.env.REACT_APP_API_BASE_URL'; // Sesuaikan dengan URL backend Anda

const ResetPasswordPage = () => {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
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
        maxWidth: '420px', // Sama seperti kartu login
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
        border: 'none'
    };

    const inputGroupStyle = {
        marginBottom: '1.5rem' // Jarak antar input
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
            const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
                email,
                otp,
                newPassword,
            });

            if (response.status === 200) {
                setMessage('Password berhasil direset! Anda akan diarahkan ke halaman login.');
                setMessageType('success');
                setTimeout(() => {
                    navigate('/admin/login');
                }, 2500); // Redirect setelah 2.5 detik
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.errors?.[0]?.msg ||
                'Terjadi kesalahan tak terduga saat reset password.';
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
        <div style={pageStyle}>
            <div className="card" style={cardStyle}>
                <div className="card-header text-center bg-transparent border-0 pt-3 pb-2">
                    <h4 className="card-title" style={{ fontWeight: 'bold', color: '#333' }}>Reset Password</h4>
                </div>
                <div className="card-body">
                    <Alert msg={message} type={messageType} />
                    <form onSubmit={handleSubmit} noValidate>
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

                        {/* Input untuk OTP */}
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

                        {/* Input untuk Password Baru */}
                        <div className="input-group" style={inputGroupStyle}>
                            <div className="input-group-prepend">
                                <span className="input-group-text bg-transparent border-right-0">
                                    <i className="material-icons">lock_open</i>
                                </span>
                            </div>
                            <input
                                type="password"
                                className="form-control border-left-0"
                                placeholder="Password Baru..."
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="card-footer bg-transparent border-0 text-center p-0 mt-4">
                            <button type="submit" className="btn btn-primary btn-lg" style={buttonStyle}>
                                Reset Password
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

export default ResetPasswordPage;
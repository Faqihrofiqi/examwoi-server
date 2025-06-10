// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import apiClient from '../api/axiosConfig';

const Navbar = () => {
  const [appName, setAppName] = useState('Memuat...');
  const [userName, setUserName] = useState('Pengguna');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const appNameResponse = await apiClient.get('/app-configs/APP_NAME', { isAuthRequired: false });
        if (appNameResponse.data && appNameResponse.data.data && appNameResponse.data.data.value) {
          setAppName(appNameResponse.data.data.value);
        }

        const userProfileResponse = await apiClient.get('/auth/me');
        if (userProfileResponse.data && userProfileResponse.data.data && userProfileResponse.data.data.username) {
          setUserName(userProfileResponse.data.data.username);
        }
      } catch (err) {
        console.error("Error fetching navbar data:", err);
        setError("Gagal memuat data navbar.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/admin/login';
  };

  const handleDashboardClick = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <nav className="navbar">
        <div className="navbar-left">
          <h3>Memuat...</h3>
        </div>
        <div className="navbar-right">
          <i className="material-icons">dashboard</i>
          <i className="material-icons">notifications</i>
          <i className="material-icons">person</i>
        </div>
      </nav>
    );
  }
  if (error) {
    return (
      <nav className="navbar">
        <div className="navbar-left">
          <h3>Error: {error}</h3>
        </div>
        <div className="navbar-right">
          <i className="material-icons">dashboard</i>
          <i className="material-icons">notifications</i>
          <i className="material-icons">person</i>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h3>{appName}</h3>
      </div>
      <div className="navbar-right">
        <span className="navbar-greeting">Halo, {userName}!</span>
        <i className="material-icons clickable-icon" onClick={handleDashboardClick} title="Dashboard">dashboard</i>
        <i className="material-icons clickable-icon" title="Notifications">notifications</i>
        <i className="material-icons clickable-icon" title="User Profile">person</i>
        <button onClick={handleLogout} className="btn btn-sm btn-outline-light ml-2 logout-button" title="Logout">
          <i className="material-icons" style={{ color: 'red' }}>exit_to_app</i> Logout {/* <-- Perubahan di sini */}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
// src/components/Navbar.js
import React from 'react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h3>Material Dashboard</h3>
      </div>
      <div className="navbar-right">
        <div className="search-box">
          {/* Ubah struktur ini */}
          <input type="text" placeholder="Search..." className="search-input" />
          <i className="material-icons search-icon">search</i> {/* Tambahkan kelas search-icon */}
        </div>
        <i className="material-icons">dashboard</i>
        <i className="material-icons">notifications</i>
        <i className="material-icons">person</i>
      </div>
    </nav>
  );
};

export default Navbar;
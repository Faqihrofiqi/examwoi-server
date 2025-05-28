// src/pages/DataUserPage.js
import React from 'react';

const DataUserPage = () => {
  return (
    <div className="data-user-page">
      <h1 className="page-title">MENU DATA USER</h1>

      {/* Bagian Data User (Informasi Personal) */}
      <div className="data-section-card">
        <div className="section-header">
          <h2 className="section-title">Data user</h2>
        </div>
        <div className="table-container">
          <div className="table-header-row">
            <div className="table-header-cell">Nama</div>
            <div className="table-header-cell">Kelas</div>
            <div className="table-header-cell">No HP</div>
            <div className="table-header-cell">Umur</div>
            <div className="table-header-cell">alamat</div>
            <div className="table-header-cell">kec</div>
            <div className="table-header-cell">kab</div>
            <div className="table-header-cell">prov</div>
          </div>
          {/* Area untuk baris data akan ada di sini */}
          <div className="table-data-area">
            {/* Placeholder untuk data */}
          </div>
        </div>
      </div>

      {/* Jarak antara dua bagian */}
      <div style={{ marginBottom: '30px' }}></div>

      {/* Bagian Data User ID (Informasi Akun/Login) */}
      <div className="data-section-card">
        <div className="section-header">
          <h2 className="section-title">Data user id</h2>
        </div>
        <div className="table-container">
          <div className="table-header-row">
            <div className="table-header-cell">Nama</div>
            <div className="table-header-cell">id key</div>
            <div className="table-header-cell">user admin</div>
            <div className="table-header-cell">password</div>
            <div className="table-header-cell">No HP</div>
            <div className="table-header-cell">IMEI HP</div>
            <div className="table-header-cell">Email</div>
          </div>
          {/* Area untuk baris data akan ada di sini */}
          <div className="table-data-area">
            {/* Placeholder untuk data */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUserPage;
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import useDebounce from '../hooks/useDebounce';

const DataUserPage = () => {
  // ... (State dan hooks lainnya tetap sama)
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // --- OBJEK GAYA UNTUK RESPONSIVITAS ---

  // 1. Gaya untuk toolbar agar fleksibel
  const toolbarStyle = {
    display: 'flex',
    flexWrap: 'wrap', // Biarkan item turun jika layar sempit
    gap: '1rem', // Jarak antar item
    marginBottom: '1.5rem'
  };

  const searchInputStyle = {
    flexGrow: 1, // Biarkan input pencarian memanjang mengisi ruang
    minWidth: '250px' // Lebar minimum sebelum turun
  };

  // 2. Gaya untuk pembungkus tabel agar bisa di-scroll
  const tableContainerStyle = {
    overflowX: 'auto', // Ini adalah kunci utama untuk tabel responsif
    paddingBottom: '1rem' // Sedikit ruang di bawah agar scrollbar tidak menempel
  };

  // 3. Gaya untuk sel tabel agar teks tidak terpotong aneh
  const tableCellStyle = {
    whiteSpace: 'nowrap' // Mencegah teks turun ke bawah (lebih baik untuk scroll horizontal)
  };

  const userTableHeaders = [
    'No', 'Nama Pengguna', 'Email', 'No HP', 'Role', 'Umur', 'Kabupaten', 'Provinsi', 'Status', 'Aksi'
  ];

  const getUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/users', {
        params: { search: debouncedSearchTerm },
      });
      setUsers(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Tidak dapat memuat data pengguna.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '-';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus user dengan ID: ${userId}?`)) {
      try {
        await apiClient.delete(`/users/${userId}`);
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        alert(`User ${userId} berhasil dihapus.`);
      } catch (err) {
        alert(`Gagal menghapus user: ${err.response?.data?.message || 'Terjadi kesalahan.'}`);
      }
    }
  };

  const handleEditUser = (userId) => {
    alert(`Edit user ${userId} (fungsi belum diimplementasikan)`);
  };

  const renderContent = () => {
    if (loading) return <tr><td colSpan={userTableHeaders.length} className="text-center">Loading...</td></tr>;
    if (error) return <tr><td colSpan={userTableHeaders.length} className="text-center text-danger">Error: {error}</td></tr>;
    if (users.length === 0) return <tr><td colSpan={userTableHeaders.length} className="text-center">Tidak ada data pengguna ditemukan.</td></tr>;

    return users.map((user, index) => (
      <tr key={user.id}>
        <td style={tableCellStyle}>{index + 1}</td>
        <td style={tableCellStyle}>{user.username || '-'}</td>
        <td style={tableCellStyle}>{user.email || '-'}</td>
        <td style={tableCellStyle}>{user.phone || '-'}</td>
        <td style={tableCellStyle}>{user.role || '-'}</td>
        <td style={tableCellStyle}>{calculateAge(user.dateOfBirth)}</td>
        <td style={tableCellStyle}>{user.kabupaten || '-'}</td>
        <td style={tableCellStyle}>{user.profinsi || '-'}</td>
        <td style={tableCellStyle}>
          <span className={`badge badge-${user.isVerified ? 'success' : 'danger'}`}>
            {user.isVerified ? 'Terverifikasi' : 'Belum'}
          </span>
        </td>
        <td style={tableCellStyle} className="action-cell">
          <button onClick={() => handleDeleteUser(user.id)} className="action-button delete-button" title="Hapus User">
            <i className="material-icons">delete</i>
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className="data-user-page">
      <h1 className="page-title">MENU DATA USER</h1>

      <div className="data-section-card card">
        <div className="card-header card-header-primary">
          <h4 className="card-title">Daftar Pengguna</h4>
          <p className="card-category">Kelola semua pengguna terdaftar.</p>
        </div>
        <div className="card-body">
          {/* Terapkan gaya fleksibel pada toolbar */}
          <div style={toolbarStyle}>
            <input
              type="text"
              className="form-control" // Hapus class 'search-input' jika mendefinisikan style sendiri
              placeholder="Cari berdasarkan nama, email, atau HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInputStyle} // Terapkan style agar bisa memanjang
            />
            {/* Jika ada tombol lain, tambahkan di sini */}
            {/* <button className="btn btn-primary">Tambah User</button> */}
          </div>

          {/* Ganti div 'table-responsive' dengan container yang gayanya kita definisikan */}
          <div style={tableContainerStyle}>
            <table className="table">
              <thead>
                <tr>
                  {userTableHeaders.map((header, index) => (
                    <th key={index} style={tableCellStyle}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renderContent()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUserPage;
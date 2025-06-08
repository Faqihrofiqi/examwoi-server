// src/pages/EditSoalPage.js
import React, { useState } from 'react';

const EditSoalPage = () => {
  // State untuk mengelola nilai input formulir (opsional, tapi bagus untuk praktik React)
  const [noSoal, setNoSoal] = useState('');
  const [pertanyaan, setPertanyaan] = useState('');
  const [jawabanBenar, setJawabanBenar] = useState('');
  const [jawabanSalah1, setJawabanSalah1] = useState('');
  const [jawabanSalah2, setJawabanSalah2] = useState('');
  const [jawabanSalah3, setJawabanSalah3] = useState('');
  const [kategori, setKategori] = useState('');

  // Data dummy untuk dropdown Kategori
  const categories = [
    'B. Indonesia', 'B. Inggris', 'Matematika', 'Fisika', 'Kimia',
    'Biologi', 'Ekonomi', 'Hukum', 'Kedokteran', 'Agama Islam'
  ];

  const handleSearch = () => {
    // Logika untuk mencari soal berdasarkan No Soal
    console.log('Mencari soal dengan No Soal:', noSoal);
    alert('Fungsi pencarian akan diimplementasikan di sini!');
  };

  const handleEdit = () => {
    console.log('Mengedit soal:', { noSoal, pertanyaan, jawabanBenar, jawabanSalah1, jawabanSalah2, jawabanSalah3, kategori });
    alert('Fungsi edit akan diimplementasikan di sini!');
  };

  const handleDelete = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus soal ini?')) {
      console.log('Menghapus soal dengan No Soal:', noSoal);
      alert('Fungsi hapus akan diimplementasikan di sini!');
    }
  };

  const handleSave = () => {
    console.log('Menyimpan soal:', { noSoal, pertanyaan, jawabanBenar, jawabanSalah1, jawabanSalah2, jawabanSalah3, kategori });
    alert('Fungsi simpan akan diimplementasikan di sini!');
  };

  return (
    <div className="edit-soal-page">
      <h1 className="page-title">EDIT SOAL</h1>

      <div className="edit-soal-card">
        {/* Input No Soal dan Cari */}
        <div className="form-group search-soal-group">
          <input
            type="text"
            className="form-input"
            placeholder="No Soal"
            value={noSoal}
            onChange={(e) => setNoSoal(e.target.value)}
          />
          <button className="btn btn-search" onClick={handleSearch}>
            Cari No Soal <i className="material-icons search-icon">search</i>
          </button>
        </div>

        {/* Textarea Pertanyaan */}
        <div className="form-group">
          <textarea
            className="form-textarea"
            placeholder="Pertanyaan"
            rows="4"
            value={pertanyaan}
            onChange={(e) => setPertanyaan(e.target.value)}
          ></textarea>
        </div>

        {/* Input Jawaban */}
        <div className="form-group">
          <input
            type="text"
            className="form-input correct-answer"
            placeholder="jawaban yang benar"
            value={jawabanBenar}
            onChange={(e) => setJawabanBenar(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            className="form-input wrong-answer"
            placeholder="jawaban yang salah"
            value={jawabanSalah1}
            onChange={(e) => setJawabanSalah1(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            className="form-input wrong-answer"
            placeholder="jawaban yang salah"
            value={jawabanSalah2}
            onChange={(e) => setJawabanSalah2(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            className="form-input wrong-answer"
            placeholder="jawaban yang salah"
            value={jawabanSalah3}
            onChange={(e) => setJawabanSalah3(e.target.value)}
          />
        </div>

        {/* Dropdown Kategori */}
        <div className="form-group">
          <select
            className="form-select"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
          >
            <option value="">Kategori</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Tombol Aksi */}
        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleEdit}>Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          <button className="btn btn-success" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditSoalPage;
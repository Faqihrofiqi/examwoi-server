// DocumentMenu.js
import React, { useState, useEffect } from 'react';
import './DocumentMenu.css'; // Kita akan buat file CSS ini nanti

function DocumentMenu() {
  // State untuk menyimpan data dokumen
  // Data awal ini bisa Anda ganti dengan data dari server
  const [documentData, setDocumentData] = useState({
    help: '',
    privacyPolicy: '',
    aboutApplication: '',
  });

  // State untuk melacak apakah mode edit aktif atau tidak
  const [isEditing, setIsEditing] = useState(false);
  // State untuk menyimpan data asli sebelum diedit (untuk fungsi cancel)
  const [originalData, setOriginalData] = useState({});

  // --- Simulasi Pengambilan Data dari Server ---
  // Gunakan useEffect untuk mengambil data saat komponen pertama kali dimuat
  useEffect(() => {
    // Di sini Anda akan memanggil API server Anda
    // Contoh data dummy:
    const fetchDataFromServer = async () => {
      // Simulasi delay API
      await new Promise(resolve => setTimeout(resolve, 1000));
      const serverData = {
        help: 'Ini adalah teks bantuan dari server.',
        privacyPolicy: 'Ini adalah kebijakan privasi dari server.',
        aboutApplication: 'Ini adalah informasi tentang aplikasi dari server.',
      };
      setDocumentData(serverData);
      setOriginalData(serverData); // Simpan data asli untuk fitur cancel
    };

    fetchDataFromServer();
  }, []); // Array dependensi kosong berarti efek ini hanya berjalan sekali setelah render awal

  // Fungsi untuk menangani perubahan pada input field saat mode edit
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDocumentData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Fungsi untuk tombol Edit/Cancel
  const handleEditToggle = () => {
    if (isEditing) {
      // Jika sedang edit dan klik "Cancel", kembalikan data ke data asli
      setDocumentData(originalData);
    } else {
      // Jika klik "Edit", simpan data saat ini sebagai data asli
      setOriginalData(documentData);
    }
    setIsEditing(!isEditing); // Toggle mode edit
  };

  // Fungsi untuk tombol Delete (implementasi detail tergantung kebutuhan Anda)
  const handleDelete = () => {
    // Logika untuk menghapus data dari server
    // Misalnya, Anda bisa panggil API delete di sini
    console.log('Data akan dihapus:', documentData);
    alert('Fungsi Hapus diklik! (implementasi backend diperlukan)');
    // Mungkin Anda ingin mengosongkan field atau mengambil data baru setelah delete
    // setDocumentData({ help: '', privacyPolicy: '', aboutApplication: '' });
    // setIsEditing(false);
  };

  // Fungsi untuk tombol Save (implementasi detail tergantung kebutuhan Anda)
  const handleSave = () => {
    // Logika untuk menyimpan data ke server
    // Misalnya, Anda bisa panggil API update di sini dengan documentData
    console.log('Data untuk disimpan:', documentData);
    alert('Data disimpan! (implementasi backend diperlukan)');
    setOriginalData(documentData); // Update data asli setelah save berhasil
    setIsEditing(false); // Matikan mode edit setelah menyimpan
  };

  return (
    <div className="document-menu-container">

        <h1 className="document-menu-title">Dokumen Menu</h1>
      <div className="form-fields">
        <div className="field-group">
          {/*
            Label bisa ditambahkan jika diperlukan untuk aksesibilitas,
            misalnya <label htmlFor="help-input">Bantuan:</label>
            Namun, gambar tidak menampilkannya secara eksplisit di luar input.
          */}
          <input
            type="text"
            id="help-input"
            name="help"
            value={documentData.help}
            onChange={handleChange}
            readOnly={!isEditing}
            placeholder="Bantuan" // Tampil jika value kosong
            aria-label="Help"
          />
        </div>
        <div className="field-group">
          <input
            type="text"
            id="privacy-input"
            name="privacyPolicy"
            value={documentData.privacyPolicy}
            onChange={handleChange}
            readOnly={!isEditing}
            placeholder="Kebijakan Privasi"
            aria-label="Privacy Policy"
          />
        </div>
        <div className="field-group">
          <input
            type="text"
            id="about-input"
            name="aboutApplication"
            value={documentData.aboutApplication}
            onChange={handleChange}
            readOnly={!isEditing}
            placeholder="Tentang Aplikasi"
            aria-label="About Application"
          />
        </div>
      </div>

      <div className="action-buttons">
        <button onClick={handleEditToggle} className="btn btn-edit">
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
        <button onClick={handleDelete} className="btn btn-delete">
          Delete
        </button>
        <button onClick={handleSave} className="btn btn-save" disabled={!isEditing}>
          Save
        </button>
      </div>

    </div>
  );
}

export default DocumentMenu;
import React from 'react';
import './ComingSoonPage.css';

// Komponen Ikon Gear (tetap sama)
const GearIcon = () => (
  <svg className="coming-soon-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M87.3,53.4l-4.8-2.8c-0.7-2.4-1.6-4.8-2.8-7l4.4-3.4c0.9-0.7,1.2-2,0.5-2.9l-4.5-4.5 c-0.7-0.7-2-0.9-2.9-0.2l-4.7,2.3c-2.2-1.4-4.6-2.6-7.1-3.4l1.1-5.1c0.2-1-0.5-2-1.5-2.2l-9.1-1.7c-1-0.2-2,0.5-2.2,1.5 l-1.1,5.1c-2.8,0.7-5.5,1.8-7.9,3.4l-4.4-3.1c-0.9-0.7-2.2-0.4-2.9,0.2l-4.5,4.5c-0.7,0.7-0.9,2-0.2,2.9l3.7,3.9 c-1.2,2.2-2.2,4.5-3,7l-4.8,2.5c-0.9,0.5-1.2,1.7-0.7,2.6l4.5,7.8c0.5,0.9,1.7,1.2,2.6,0.7l5.1-2.5c2,1.7,4.2,3.2,6.6,4.4 l-1.7,5.4c-0.2,1,0.5,2,1.5,2.2l9.1-1.7c1,0.2,2-0.5,2.2-1.5l1.7-5.4c2.8-0.7,5.5,1.8,7.9-3.4l4.4,3.1 c0.9,0.7,2.2,0.4,2.9-0.2l-4.5-4.5c0.7-0.7,0.9-2,0.2-2.9l-3.7-3.9c1.2-2.2,2.2-4.5,3-7l4.8-2.5 C88.5,55.1,88.2,53.9,87.3,53.4z M50,62.3c-6.8,0-12.3-5.5-12.3-12.3S43.2,37.7,50,37.7s12.3,5.5,12.3,12.3S56.8,62.3,50,62.3z" />
  </svg>
);

// Komponen baru untuk Ikon Panah Kembali
const BackArrowIcon = () => (
  <svg className="back-arrow-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
);

function ComingSoonPage() {
  // Fungsi untuk kembali ke halaman sebelumnya
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="coming-soon-page-wrapper">
      {/* Tombol Panah Kembali */}
      <button
        onClick={handleGoBack}
        className="back-arrow-button"
        title="Kembali"
        aria-label="Kembali ke halaman sebelumnya"
      >
        <BackArrowIcon />
      </button>

      <main className="coming-soon-container">
        <div className="coming-soon-content">
          <div className="icon-area">
            <GearIcon />
          </div>

          <h1>Segera Hadir!</h1>
          <p className="tagline">
            Kami sedang bekerja keras untuk menghadirkan fitur baru yang bermanfaat bagi Anda.
            Nantikan peluncurannya!
          </p>

          {/* Area navigasi dengan tombol teks sudah dihapus/diganti */}
        </div>
      </main>
      <footer className="coming-soon-footer">
        <p>&copy; {new Date().getFullYear()} Nama Perusahaan Anda. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}

export default ComingSoonPage;
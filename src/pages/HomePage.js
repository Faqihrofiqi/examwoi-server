// src/pages/HomePage.js
import React from 'react';
import DashboardCard from '../components/DashboardCard'; // Pastikan path-nya benar

const HomePage = () => {
  const simpleDashboardItems = [
    { title: 'Data User', category: 'data-green', icon: 'people', path: '/data-user' }, // Tambahkan path
    { title: 'Data Soal', category: 'data-green', icon: 'assignment', path: '/data-soal' }, // Contoh path lain
    { title: 'Affiliate', category: 'data-green', icon: 'group_add', path: '/affiliate' },
    { title: 'Dokumen APK', category: 'data-yellow', icon: 'android', path: '/dokumen-apk' },
    { title: 'KODE Refferal', category: 'data-yellow', icon: 'vpn_key', path: '/kode-refferal' },
    { title: 'Admin', category: 'data-yellow', icon: 'security', path: '/admin' },
    { title: 'Analis', category: 'data-blue', icon: 'bar_chart', path: '/analis' },
    { title: 'Edvertiser', category: 'data-blue', icon: 'campaign', path: '/edvertiser' },
  ];

  return (
    <div className="simple-dashboard-grid">
      {simpleDashboardItems.map((item, index) => (
        // Menggunakan <a> untuk navigasi, namun di React Router lebih baik pakai Link
        // Untuk sekarang, kita akan menggunakan <a> agar tidak perlu import Link di sini dulu
        // Nanti akan kita ubah di App.js
        <DashboardCard
          key={index}
          title={
            <>
              <i className="material-icons simple-card-icon">{item.icon}</i>
              <span className="simple-card-title">{item.title}</span>
            </>
          }
          type={item.category}
          isSimpleCard={true}
          // Kita akan menangani navigasi di App.js atau di DashboardCard jika perlu
          // Untuk saat ini, tidak ada perubahan klik di sini
        />
      ))}
    </div>
  );
};

export default HomePage;
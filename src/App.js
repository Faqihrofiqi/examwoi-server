// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'; // Import dari react-router-dom
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardCard from './components/DashboardCard'; // Masih diimpor karena dipakai di dalam HomePage.js
import DataUserPage from './pages/DataUserPage'; // Impor halaman data user
import DataSoalPage from './pages/DataSoalPage'; // Impor halaman data soal
import DokumenMenu from './components/DocumentMenu'; // Impor komponen DokumenMenu
import './App.css';
import AdvertiserMenu from './components/AdvertiserMenu';
import ComingSoonPage from './pages/ComingSoonPage';

// Komponen Card yang sedikit dimodifikasi untuk bisa di-klik dan navigasi
const ClickableDashboardCard = ({ title, type, isSimpleCard, path }) => {
  const navigate = useNavigate(); // Hook untuk navigasi

  const handleClick = () => {
    if (path) {
      navigate(path); // Navigasi ke path yang diberikan
    }
  };

  return (
    <DashboardCard
      title={title}
      type={type}
      isSimpleCard={isSimpleCard}
      onClick={handleClick} // Tambahkan event handler onClick
      style={{ cursor: path ? 'pointer' : 'default' }} // Tunjukkan kursor pointer jika ada path
    />
  );
};

function App() {
  // Pindahkan data ke App.js karena ClickableDashboardCard membutuhkan path
  const simpleDashboardItems = [
    { title: 'Data User', category: 'data-green', icon: 'people', path: '/data-user' },
    { title: 'Data Soal', category: 'data-green', icon: 'assignment', path: '/data-soal' },
    { title: 'Affiliate', category: 'data-green', icon: 'group_add', path: '/affiliate' },
    { title: 'Dokumen APK', category: 'data-yellow', icon: 'android', path: '/dokumen-apk' },
    { title: 'KODE Refferal', category: 'data-yellow', icon: 'vpn_key', path: '/kode-refferal' },
    { title: 'Admin', category: 'data-yellow', icon: 'security', path: '/admin' },
    { title: 'Analis', category: 'data-blue', icon: 'bar_chart', path: '/analis' },
    { title: 'Advetiser', category: 'data-blue', icon: 'campaign', path: '/advertiser' },
  ];

  return (
    <Router> {/* Bungkus seluruh aplikasi dengan Router */}
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Navbar />
          <div className="dashboard-content">
            <Routes> {/* Tempatkan Routes di sini untuk mendefinisikan rute */}
              <Route path="/" element={
                <div className="simple-dashboard-grid">
                  {simpleDashboardItems.map((item, index) => (
                    <ClickableDashboardCard
                      key={index}
                      title={
                        <>
                          <i className="material-icons simple-card-icon">{item.icon}</i>
                          <span className="simple-card-title">{item.title}</span>
                        </>
                      }
                      type={item.category}
                      isSimpleCard={true}
                      path={item.path} // Teruskan path ke ClickableDashboardCard
                    />
                  ))}
                </div>
              } />
              <Route path="/data-user" element={<DataUserPage />} /> {/* Rute untuk Data User */}
              <Route path="/data-soal" element={<DataSoalPage />} /> {/* Rute untuk Data Soal */}
              <Route path="/dokumen-apk" element={<DokumenMenu />} />
              <Route path="/advertiser" element={<AdvertiserMenu />} />
              <Route path="/affiliate" element={<ComingSoonPage />} />
              {/* ... dan seterusnya untuk path lainnya ... */}
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
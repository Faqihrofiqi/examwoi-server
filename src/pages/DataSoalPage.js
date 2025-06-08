import React, { useState, useEffect } from 'react';
import './DataSoalPage.css'; // Pastikan nama file CSS sesuai

// Data dummy untuk soal berdasarkan kategori
const dummySoalData = {
  'B. Indonesia': [
    { noSoal: 1, idSoal: 'BIND001', pertanyaan: 'Sinonim dari kata "pandai" adalah cerdas, pintar, atau mahir.', jawabanA: 'Cerdas', jawabanB: 'Bodoh', jawabanC: 'Rajin', jawabanD: 'Malas' },
    { noSoal: 2, idSoal: 'BIND002', pertanyaan: 'Lawan kata dari "terang" adalah gelap. Apakah ini benar?', jawabanA: 'Benar', jawabanB: 'Salah', jawabanC: 'Ragu-ragu', jawabanD: 'Tidak tahu' },
  ],
  'B. Inggris': [
    // Tambahkan soal B. Inggris jika perlu
  ],
  'Matematika': [
    { noSoal: 1, idSoal: 'MTK001', pertanyaan: 'Berapakah hasil dari 15 + 25 x 2 - 10 / 2 ? Ini adalah soal panjang untuk menguji wrap.', jawabanA: '30', jawabanB: '35', jawabanC: '40', jawabanD: '60' },
    { noSoal: 2, idSoal: 'MTK002', pertanyaan: 'Sebuah persegi memiliki sisi 5cm, berapa luasnya?', jawabanA: '20cm²', jawabanB: '25cm²', jawabanC: '30cm²', jawabanD: '10cm²' },
    { noSoal: 3, idSoal: 'MTK003', pertanyaan: 'Angka romawi dari 10 adalah X. Benar atau Salah?', jawabanA: 'Benar', jawabanB: 'Salah', jawabanC: 'Tidak Keduanya', jawabanD: 'Semua Salah' },
  ],
  'Fisika': [], 'Kimia': [], 'Biologi': [], 'Ekonomi': [], 'Hukum': [], 'Kedokteran': [],
  'Agama Islam': [
    { noSoal: 1, idSoal: 'AGM001', pertanyaan: 'Rukun Islam yang pertama adalah mengucapkan dua kalimat syahadat.', jawabanA: 'Syahadat', jawabanB: 'Shalat', jawabanC: 'Puasa', jawabanD: 'Zakat' },
  ]
};

const DataSoalPage = () => {
  const initialCategories = [
    'B. Indonesia', 'B. Inggris', 'Matematika', 'Fisika', 'Kimia',
    'Biologi', 'Ekonomi', 'Hukum', 'Kedokteran', 'Agama Islam'
  ];

  const [activeCategory, setActiveCategory] = useState('Matematika');
  const [questions, setQuestions] = useState([]);

  const tableHeaders = [
    'No soal', 'id soal', 'Pertanyaan', 'Jawaban A', 'Jawaban B',
    'Jawaban C', 'Jawaban D', 'Aksi'
  ];

  useEffect(() => {
    setQuestions(dummySoalData[activeCategory] || []);
  }, [activeCategory]);

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
  };

  const handleEditSoal = (idSoal) => {
    console.log(`Edit soal dengan ID: ${idSoal}`);
    alert(`Edit soal ${idSoal} (fungsi belum diimplementasikan)`);
  };

  const handleDeleteSoal = (idSoal) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus soal dengan ID: ${idSoal}?`)) {
      console.log(`Hapus soal dengan ID: ${idSoal}`);
      // Logika untuk menghapus soal dari state (dan nantinya dari backend)
      // Contoh:
      // setQuestions(prevQuestions => prevQuestions.filter(q => q.idSoal !== idSoal));
      // dummySoalData[activeCategory] = dummySoalData[activeCategory].filter(q => q.idSoal !== idSoal);
      alert(`Soal ${idSoal} akan dihapus (fungsi backend diperlukan). Untuk demo, data tidak benar-benar hilang.`);
    }
  };

  const handleAddCategory = () => {
    const newCategoryName = window.prompt("Masukkan nama kategori baru:");
    if (newCategoryName && !initialCategories.includes(newCategoryName)) {
      // Untuk demo, tidak akan menambah ke daftar permanen initialCategories
      // Dalam aplikasi nyata, Anda akan update state dan/atau backend
      console.log("Kategori baru ditambahkan (demo):", newCategoryName);
      alert(`Kategori "${newCategoryName}" ditambahkan (fungsi backend diperlukan).`);
    } else if (newCategoryName) {
      alert("Kategori sudah ada atau nama tidak valid.");
    }
  };

  return (
    <div className="data-soal-page">
      <h1 className="page-title">MENU DATA SOAL</h1>

      <div className="soal-content-layout">
        <aside className="categories-sidebar-card">
          <div className="category-header-title">Kategori soal</div>
          <div className="category-list">
            {initialCategories.map((category) => (
              <button
                key={category}
                className={`category-item-button ${activeCategory === category ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
            <button className="add-category-button" onClick={handleAddCategory} title="Tambah Kategori Baru">
              <i className="material-icons">add</i>
              <span>Tambah Kategori</span>
            </button>
          </div>
        </aside>

        <section className="soal-table-section">
          <header className="active-category-display">
            <h2 className="active-category-title">{activeCategory}</h2>
          </header>

          <div className="soal-table-card">
            <div className="table-header-row-soal">
              {tableHeaders.map((header, index) => (
                <div key={index} className={`table-header-cell-soal th-col-${index + 1}`}>
                  {header}
                </div>
              ))}
            </div>
            <div className="table-body-soal">
              {questions.length > 0 ? (
                questions.map((soal) => (
                  <div key={soal.idSoal} className="table-row-soal">
                    <div className="table-cell-soal td-col-1" data-label="No soal">{soal.noSoal}</div>
                    <div className="table-cell-soal td-col-2" data-label="id soal">{soal.idSoal}</div>
                    <div className="table-cell-soal question-cell td-col-3" data-label="Pertanyaan">{soal.pertanyaan}</div>
                    <div className="table-cell-soal td-col-4" data-label="Jawaban A">{soal.jawabanA}</div>
                    <div className="table-cell-soal td-col-5" data-label="Jawaban B">{soal.jawabanB}</div>
                    <div className="table-cell-soal td-col-6" data-label="Jawaban C">{soal.jawabanC || '-'}</div>
                    <div className="table-cell-soal td-col-7" data-label="Jawaban D">{soal.jawabanD || '-'}</div>
                    <div className="table-cell-soal action-cell td-col-8" data-label="Aksi">
                      <button onClick={() => handleEditSoal(soal.idSoal)} className="action-button edit-button" title="Edit Soal">
                        <i className="material-icons">edit</i>
                      </button>
                      <button onClick={() => handleDeleteSoal(soal.idSoal)} className="action-button delete-button" title="Hapus Soal">
                        <i className="material-icons">delete</i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-placeholder">
                  <p>Tidak ada soal untuk kategori "{activeCategory}".</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DataSoalPage;
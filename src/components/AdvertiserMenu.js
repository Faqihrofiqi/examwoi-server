// AdvertiserMenu.js
import React, { useState, useEffect } from 'react';
import './AdvertiserMenu.css'; // Pastikan file CSS juga diupdate

function AdvertiserMenu() {
  const initialContentState = { text: '', imageUrl: '' };

  const [documentData, setDocumentData] = useState({
    header: { ...initialContentState },
    footer: { ...initialContentState },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState({
    header: { ...initialContentState },
    footer: { ...initialContentState },
  });

  useEffect(() => {
    const fetchDataFromServer = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulasi delay
      const serverData = {
        header: {
          text: 'Selamat Datang!',
          imageUrl: 'https://via.placeholder.com/600x150/003366/FFFFFF?text=Header+Banner+Keren',
        },
        footer: {
          text: '© 2025 Perusahaan Anda - Footer dengan Teks Saja',
          imageUrl: '', // Kosong berarti tidak ada gambar latar untuk footer
        },
        // Contoh lain: Footer dengan gambar saja
        // footer: {
        //   text: '',
        //   imageUrl: 'https://via.placeholder.com/600x80/CCCCCC/000000?text=Footer+Image',
        // },
      };
      setDocumentData(serverData);
      setOriginalData(serverData);
    };

    fetchDataFromServer();
  }, []);

  const handleChange = (e, section, field) => {
    // section: 'header' atau 'footer'
    // field: 'text' atau 'imageUrl'
    const { value } = e.target;
    setDocumentData((prevData) => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value,
      },
    }));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setDocumentData(originalData);
    } else {
      setOriginalData(documentData);
    }
    setIsEditing(!isEditing);
  };

  const handleDelete = () => {
    console.log('Data akan dihapus:', documentData);
    alert('Fungsi Hapus diklik! (implementasi backend diperlukan)');
    // Pertimbangkan untuk mereset ke initialContentState atau mengambil data baru
    // setDocumentData({ header: { ...initialContentState }, footer: { ...initialContentState } });
    // setOriginalData({ header: { ...initialContentState }, footer: { ...initialContentState } });
  };

  const handleSave = () => {
    console.log('Data untuk disimpan:', documentData);
    alert('Data disimpan! (implementasi backend diperlukan)');
    setOriginalData(documentData);
    setIsEditing(false);
  };

  // Komponen kecil untuk merender setiap bagian (header/footer)
  const RenderSectionContent = ({ content, sectionName }) => {
    // content adalah objek { text: '...', imageUrl: '...' }
    // sectionName adalah 'Header' atau 'Footer'

    const style = content.imageUrl
      ? { backgroundImage: `url(${content.imageUrl})` }
      : {};

    return (
      <div className="content-display-area" style={style}>
        {content.text && (
          <div className={`overlay-text ${!content.imageUrl ? 'text-only' : ''}`}>
            {content.text}
          </div>
        )}
        {/* Untuk aksesibilitas jika hanya gambar tanpa teks overlay */}
        {!content.text && content.imageUrl && (
          <span className="sr-only">{sectionName} background image</span>
        )}
         {/* Jika tidak ada text dan tidak ada image URL, tampilkan placeholder */}
        {!content.text && !content.imageUrl && (
          <div className="content-placeholder">Area {sectionName} Kosong</div>
        )}
      </div>
    );
  };

  return (
    <div className="advertiser-menu-container">
      <div className="top-section-wrapper">
        <div className="main-content-area">
          {/* Bagian Header */}
          <fieldset className="content-section header-section">
            <legend className="content-legend header-legend">Header</legend>
            {isEditing ? (
              <div className="edit-fields">
                <label htmlFor="header-text">Teks Header:</label>
                <textarea
                  id="header-text"
                  name="text"
                  value={documentData.header.text}
                  onChange={(e) => handleChange(e, 'header', 'text')}
                  placeholder="Masukkan teks header..."
                  rows="3"
                />
                <label htmlFor="header-image-url">URL Gambar Latar Header:</label>
                <input
                  type="text"
                  id="header-image-url"
                  name="imageUrl"
                  value={documentData.header.imageUrl}
                  onChange={(e) => handleChange(e, 'header', 'imageUrl')}
                  placeholder="https://..."
                />
              </div>
            ) : (
              <RenderSectionContent content={documentData.header} sectionName="Header" />
            )}
          </fieldset>

          {/* Bagian Footer */}
          <fieldset className="content-section footer-section">
            <legend className="content-legend footer-legend">Footer</legend>
            {isEditing ? (
              <div className="edit-fields">
                <label htmlFor="footer-text">Teks Footer:</label>
                <textarea
                  id="footer-text"
                  name="text"
                  value={documentData.footer.text}
                  onChange={(e) => handleChange(e, 'footer', 'text')}
                  placeholder="Masukkan teks footer..."
                  rows="2"
                />
                <label htmlFor="footer-image-url">URL Gambar Latar Footer:</label>
                <input
                  type="text"
                  id="footer-image-url"
                  name="imageUrl"
                  value={documentData.footer.imageUrl}
                  onChange={(e) => handleChange(e, 'footer', 'imageUrl')}
                  placeholder="https://..."
                />
              </div>
            ) : (
              <RenderSectionContent content={documentData.footer} sectionName="Footer" />
            )}
          </fieldset>
        </div>

        <div className="action-buttons-advertiser">
          <button onClick={handleEditToggle} className="btn-advertiser">
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button onClick={handleDelete} className="btn-advertiser btn-delete-advertiser">
            Delete
          </button>
          <button onClick={handleSave} className="btn-advertiser btn-save-advertiser" disabled={!isEditing}>
            Save
          </button>
        </div>
      </div>

      <h2 className="advertiser-menu-title">MENU ADVERTISER</h2>
    </div>
  );
}

export default AdvertiserMenu;
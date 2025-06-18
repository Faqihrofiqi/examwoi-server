import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig'; 
import './DocumentMenu.css';
import { fileToBase64, getFileFromEvent, isValidBase64Image } from '../utils/imageConverter'; // Import utilitas

const DocumentMenu = () => {
  const [documentData, setDocumentData] = useState({
    HELP_TEXT: '',
    PRIVACY_POLICY: '',
    ABOUT_APP_TEXT: '',
    APP_NAME: '',
    AD_BANNER_IMAGE_URL: '',
    BACKGROUND_IMAGE_URL: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [adBannerImageFile, setAdBannerImageFile] = useState(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);

  // --- Hapus definisi fetchData lokal di sini ---
  // const fetchData = useCallback(async (url, method = 'GET', body = null, isAuthRequired = true, throwOnNotFound = true) => { ... });

  // Effect untuk mengambil data konfigurasi saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchAppConfigs = async () => {
      setLoading(true);
      setError(null);
      try {
        // Gunakan apiClient.get()
        // Untuk GET /app-configs, umumnya tidak perlu auth jika untuk frontend publik (HomePage)
        // Namun, di dashboard admin ini kita asumsikan semua GET memerlukan auth admin
        // apiClient.get() sudah memiliki interceptor auth
        const response = await apiClient.get('/app-configs');
        const configs = response.data?.data || [];

        const fetchedData = {};
        configs.forEach(config => {
          if (['HELP_TEXT', 'PRIVACY_POLICY', 'ABOUT_APP_TEXT', 'APP_NAME', 'AD_BANNER_IMAGE_URL', 'BACKGROUND_IMAGE_URL'].includes(config.key)) {
            fetchedData[config.key] = config.value;
          }
        });
        setDocumentData(fetchedData);
        setOriginalData(fetchedData);
      } catch (err) {
        // Error sudah ditangani di interceptor Axios
        setError(err.response?.data?.message || 'Gagal memuat konfigurasi aplikasi.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppConfigs();
  }, []); // [] karena fetchData lokal sudah tidak ada, dan apiClient stabil

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDocumentData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAdBannerImageChange = async (event) => {
    const file = getFileFromEvent(event);
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage('File banner iklan harus berupa gambar.');
        setMessageType('danger');
        setAdBannerImageFile(null);
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setAdBannerImageFile(file);
        setDocumentData(prevData => ({ ...prevData, AD_BANNER_IMAGE_URL: base64 }));
        setMessage('Gambar banner iklan siap diunggah.');
        setMessageType('info');
      } catch (err) {
        setMessage('Gagal mengkonversi gambar banner iklan.');
        setMessageType('danger');
        setAdBannerImageFile(null);
      }
    } else {
      setAdBannerImageFile(null);
      setDocumentData(prevData => ({ ...prevData, AD_BANNER_IMAGE_URL: '' }));
    }
  };

  const handleBackgroundImageChange = async (event) => {
    const file = getFileFromEvent(event);
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage('File background harus berupa gambar.');
        setMessageType('danger');
        setBackgroundImageFile(null);
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setBackgroundImageFile(file);
        setDocumentData(prevData => ({ ...prevData, BACKGROUND_IMAGE_URL: base64 }));
        setMessage('Gambar background siap diunggah.');
        setMessageType('info');
      } catch (err) {
        setMessage('Gagal mengkonversi gambar background.');
        setMessageType('danger');
        setBackgroundImageFile(null);
      }
    } else {
      setBackgroundImageFile(null);
      setDocumentData(prevData => ({ ...prevData, BACKGROUND_IMAGE_URL: '' }));
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setDocumentData(originalData);
      setAdBannerImageFile(null);
      setBackgroundImageFile(null);
      setMessage('Perubahan dibatalkan.');
      setMessageType('info');
    } else {
      setOriginalData(documentData);
      setMessage('');
      setMessageType('');
    }
    setIsEditing(!isEditing);
  };

  const handleDelete = async (keyToDelete) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus '${keyToDelete}'? Ini akan menghapus permanen dari database.`)) {
      setLoading(true); // Set loading while deleting
      try {
        const response = await apiClient.delete(`/app-configs/${keyToDelete}`); // <--- Gunakan apiClient
        setDocumentData(prevData => {
          const newData = { ...prevData, [keyToDelete]: '' };
          setOriginalData(newData);
          return newData;
        });
        if (keyToDelete === 'AD_BANNER_IMAGE_URL') setAdBannerImageFile(null);
        if (keyToDelete === 'BACKGROUND_IMAGE_URL') setBackgroundImageFile(null);

        setMessage(`Konten '${keyToDelete}' berhasil dihapus.`);
        setMessageType('success');
      } catch (err) {
        setMessage(`Gagal menghapus '${keyToDelete}': ${err.response?.data?.message || 'Terjadi kesalahan.'}`);
        setMessageType('danger');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    setMessageType('');
    try {
      const keysToProcess = ['HELP_TEXT', 'PRIVACY_POLICY', 'ABOUT_APP_TEXT', 'APP_NAME', 'AD_BANNER_IMAGE_URL', 'BACKGROUND_IMAGE_URL'];

      for (const key of keysToProcess) {
        const value = documentData[key];
        const originalValue = originalData[key];
        let type = 'TEXT';

        if (key === 'AD_BANNER_IMAGE_URL' || key === 'BACKGROUND_IMAGE_URL') {
          type = 'IMAGE_URL';
          if (value && !isValidBase64Image(value)) {
            setMessage(`Gagal: Konten untuk ${key} bukan Base64 gambar yang valid.`);
            setMessageType('danger');
            setLoading(false);
            return;
          }
        } else if (key === 'APP_NAME') {
          type = 'TEXT';
        }

        if (value !== originalValue) {
          // Cek apakah key sudah ada di backend
          const existingConfigResponse = await apiClient.get(`/app-configs/${key}`); // <--- Gunakan apiClient

          if (existingConfigResponse.data?.data) { // Config ditemukan (PUT)
            await apiClient.put(`/app-configs/${key}`, { value, description: `${key} content`, type }); // <--- Gunakan apiClient
          } else if (value.trim() !== '') { // Buat baru hanya jika ada value dan belum ada
            await apiClient.post('/app-configs', { key, value, description: `${key} content`, type }); // <--- Gunakan apiClient
          } else if (value.trim() === '' && existingConfigResponse.data?.data) {
            // Jika value di-clear tapi sudah ada di DB, anggap sebagai delete
            await apiClient.delete(`/app-configs/${key}`); // <--- Gunakan apiClient
          }
        }
      }
      setMessage('Perubahan berhasil disimpan!');
      setMessageType('success');

      const updatedConfigs = await apiClient.get('/app-configs'); // <--- Gunakan apiClient
      const newOriginalData = {};
      if (updatedConfigs && updatedConfigs.data && updatedConfigs.data.data) {
        updatedConfigs.data.data.forEach(config => {
          if (keysToProcess.includes(config.key)) {
            newOriginalData[config.key] = config.value;
          }
        });
      }
      setOriginalData(newOriginalData);
      setIsEditing(false);
    } catch (err) {
      setMessage(`Gagal menyimpan perubahan: ${err.response?.data?.message || 'Terjadi kesalahan.'}`);
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const Alert = ({ msg, type }) => {
    if (!msg) return null;
    return (
      <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
        {msg}
        <button type="button" className="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    );
  };

  if (loading) return <div className="loading-state">Memuat dokumen...</div>;
  if (error && !loading) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="document-menu-container card">
      <div className="card-header card-header-primary">
        <h4 className="card-title">Pengaturan Aplikasi & Dokumen</h4>
      </div>
      <div className="card-body">
        <Alert msg={message} type={messageType} />
        <div className="form-fields">
          {/* Nama Aplikasi */}
          <div className="field-group">
            <label htmlFor="APP_NAME">Nama Aplikasi</label>
            <input
              type="text"
              id="APP_NAME"
              name="APP_NAME"
              value={documentData.APP_NAME}
              onChange={handleChange}
              readOnly={!isEditing}
              placeholder="Nama Aplikasi Anda..."
              aria-label="App Name"
              className="form-control"
            />
            {isEditing && documentData.APP_NAME && <button onClick={() => handleDelete('APP_NAME')} className="btn btn-sm btn-outline-danger mt-2">Hapus</button>}
          </div>

          {/* Banner Iklan */}
          <div className="field-group">
            <label htmlFor="AD_BANNER_IMAGE_URL">Gambar Banner Iklan</label>
            {isEditing && (
              <input
                type="file"
                id="AD_BANNER_IMAGE_URL"
                className="form-control-file"
                accept="image/*"
                onChange={handleAdBannerImageChange}
              />
            )}
            {documentData.AD_BANNER_IMAGE_URL && (
              <div className="mt-2">
                <img src={documentData.AD_BANNER_IMAGE_URL} alt="Banner Iklan" className="img-thumbnail" style={{ maxWidth: '300px', height: 'auto' }} />
                {!isEditing && <p className="text-muted">Ukuran: {documentData.AD_BANNER_IMAGE_URL.length / 1024} KB</p>}
              </div>
            )}
            {isEditing && documentData.AD_BANNER_IMAGE_URL && <button onClick={() => setDocumentData(prev => ({ ...prev, AD_BANNER_IMAGE_URL: '' }))} className="btn btn-sm btn-outline-warning mt-2">Hapus Gambar</button>}
          </div>

          {/* Foto Background */}
          <div className="field-group">
            <label htmlFor="BACKGROUND_IMAGE_URL">Gambar Background</label>
            {isEditing && (
              <input
                type="file"
                id="BACKGROUND_IMAGE_URL"
                className="form-control-file"
                accept="image/*"
                onChange={handleBackgroundImageChange}
              />
            )}
            {documentData.BACKGROUND_IMAGE_URL && (
              <div className="mt-2">
                <img src={documentData.BACKGROUND_IMAGE_URL} alt="Background Aplikasi" className="img-thumbnail" style={{ maxWidth: '300px', height: 'auto' }} />
                {!isEditing && <p className="text-muted">Ukuran: {documentData.BACKGROUND_IMAGE_URL.length / 1024} KB</p>}
              </div>
            )}
            {isEditing && documentData.BACKGROUND_IMAGE_URL && <button onClick={() => setDocumentData(prev => ({ ...prev, BACKGROUND_IMAGE_URL: '' }))} className="btn btn-sm btn-outline-warning mt-2">Hapus Gambar</button>}
          </div>

          {/* Teks Bantuan, Kebijakan Privasi, Tentang Aplikasi */}
          <div className="field-group">
            <label htmlFor="HELP_TEXT">Bantuan</label>
            <textarea
              id="HELP_TEXT"
              name="HELP_TEXT"
              value={documentData.HELP_TEXT}
              onChange={handleChange}
              readOnly={!isEditing}
              placeholder="Tulis teks bantuan di sini..."
              aria-label="Help Text"
              rows="5"
              className="form-control"
            ></textarea>
            {isEditing && documentData.HELP_TEXT && <button onClick={() => handleDelete('HELP_TEXT')} className="btn btn-sm btn-outline-danger mt-2">Hapus</button>}
          </div>
          <div className="field-group">
            <label htmlFor="PRIVACY_POLICY">Kebijakan Privasi</label>
            <textarea
              id="PRIVACY_POLICY"
              name="PRIVACY_POLICY"
              value={documentData.PRIVACY_POLICY}
              onChange={handleChange}
              readOnly={!isEditing}
              placeholder="Tulis kebijakan privasi di sini..."
              aria-label="Privacy Policy"
              rows="10"
              className="form-control"
            ></textarea>
            {isEditing && documentData.PRIVACY_POLICY && <button onClick={() => handleDelete('PRIVACY_POLICY')} className="btn btn-sm btn-outline-danger mt-2">Hapus</button>}
          </div>
          <div className="field-group">
            <label htmlFor="ABOUT_APP_TEXT">Tentang Aplikasi</label>
            <textarea
              id="ABOUT_APP_TEXT"
              name="ABOUT_APP_TEXT"
              value={documentData.ABOUT_APP_TEXT}
              onChange={handleChange}
              readOnly={!isEditing}
              placeholder="Tulis informasi tentang aplikasi di sini..."
              aria-label="About Application Text"
              rows="5"
              className="form-control"
            ></textarea>
            {isEditing && documentData.ABOUT_APP_TEXT && <button onClick={() => handleDelete('ABOUT_APP_TEXT')} className="btn btn-sm btn-outline-danger mt-2">Hapus</button>}
          </div>
        </div>

        <div className="action-buttons mt-4 text-right">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="btn btn-success">
                <i className="material-icons">save</i> Save
              </button>
              <button onClick={handleEditToggle} className="btn btn-warning ml-2">
                <i className="material-icons">cancel</i> Cancel
              </button>
            </>
          ) : (
            <button onClick={handleEditToggle} className="btn btn-primary">
              <i className="material-icons">edit</i> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentMenu;

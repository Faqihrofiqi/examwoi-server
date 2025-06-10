import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './DocumentMenu.css';
import { fileToBase64, getFileFromEvent, isValidBase64Image } from '../utils/imageConverter'; // Import utilitas

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const ACCESS_TOKEN = localStorage.getItem('accessToken');

const DocumentMenu = () => {
  const [documentData, setDocumentData] = useState({
    HELP_TEXT: '',
    PRIVACY_POLICY: '',
    ABOUT_APP_TEXT: '',
    APP_NAME: '', // Tambahkan untuk nama aplikasi
    AD_BANNER_IMAGE_URL: '', // Tambahkan untuk gambar banner
    BACKGROUND_IMAGE_URL: '', // Tambahkan untuk gambar background
  });

  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // State untuk file gambar baru
  const [adBannerImageFile, setAdBannerImageFile] = useState(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);

  const fetchData = useCallback(async (url, method = 'GET', body = null, isAuthRequired = true, throwOnNotFound = true) => {
    // ... (fetchData function tetap sama, pastikan ACCESS_TOKEN diambil di dalam) ...
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (isAuthRequired && ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
      } else if (isAuthRequired && !ACCESS_TOKEN) {
        const err = new Error('Authentication required. Please log in.');
        err.statusCode = 401;
        throw err;
      }

      const options = {
        method,
        headers,
        data: body,
      };

      const response = await axios(url, options);
      return response.data;
    } catch (err) {
      console.error(`Error fetching from ${url}:`, err.response ? err.response.data : err.message);
      const errorMessage = err.response && err.response.data && err.response.data.message
                           ? err.response.data.message
                           : (err.response && err.response.data && err.response.data.errors && err.response.data.errors[0].msg
                               ? err.response.data.errors[0].msg
                               : 'Terjadi kesalahan tak terduga pada server.');
      
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        alert("Sesi berakhir atau tidak punya izin. Silakan login kembali.");
        localStorage.clear();
        window.location.href = '/admin/login';
      }
      setError(errorMessage);
      setMessage(errorMessage);
      setMessageType('danger');
      throw err;
    }
  }, [ACCESS_TOKEN]);

  useEffect(() => {
    const fetchAppConfigs = async () => {
      setLoading(true);
      setError(null);
      try {
        const configs = await fetchData(`${API_BASE_URL}/app-configs`, 'GET', null, true, false); 
        if (configs && configs.data) {
            const fetchedData = {};
            configs.data.forEach(config => {
              // Tambahkan APP_NAME, AD_BANNER_IMAGE_URL, BACKGROUND_IMAGE_URL
              if (['HELP_TEXT', 'PRIVACY_POLICY', 'ABOUT_APP_TEXT', 'APP_NAME', 'AD_BANNER_IMAGE_URL', 'BACKGROUND_IMAGE_URL'].includes(config.key)) {
                fetchedData[config.key] = config.value;
              }
            });
            setDocumentData(fetchedData);
            setOriginalData(fetchedData);
        } else {
            setDocumentData({});
            setOriginalData({});
        }

      } catch (err) {
        // Error sudah ditangani di fetchData
      } finally {
        setLoading(false);
      }
    };
    fetchAppConfigs();
  }, [fetchData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDocumentData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handler untuk input file gambar banner iklan
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
        setDocumentData(prevData => ({ ...prevData, AD_BANNER_IMAGE_URL: base64 })); // Update state dengan Base64
        setMessage('Gambar banner iklan siap diunggah.');
        setMessageType('info');
      } catch (err) {
        setMessage('Gagal mengkonversi gambar banner iklan.');
        setMessageType('danger');
        setAdBannerImageFile(null);
      }
    } else {
      setAdBannerImageFile(null);
      setDocumentData(prevData => ({ ...prevData, AD_BANNER_IMAGE_URL: '' })); // Kosongkan jika batal
    }
  };

  // Handler untuk input file foto background
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
        setDocumentData(prevData => ({ ...prevData, BACKGROUND_IMAGE_URL: base64 })); // Update state dengan Base64
        setMessage('Gambar background siap diunggah.');
        setMessageType('info');
      } catch (err) {
        setMessage('Gagal mengkonversi gambar background.');
        setMessageType('danger');
        setBackgroundImageFile(null);
      }
    } else {
      setBackgroundImageFile(null);
      setDocumentData(prevData => ({ ...prevData, BACKGROUND_IMAGE_URL: '' })); // Kosongkan jika batal
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setDocumentData(originalData);
      setAdBannerImageFile(null); // Reset file upload
      setBackgroundImageFile(null); // Reset file upload
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
      setLoading(true);
      try {
        await fetchData(`${API_BASE_URL}/app-configs/${keyToDelete}`, 'DELETE', null, true);
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
        // Error sudah ditangani oleh fetchData
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
        let type = 'TEXT'; // Default type

        if (key === 'AD_BANNER_IMAGE_URL' || key === 'BACKGROUND_IMAGE_URL') {
            type = 'IMAGE_URL';
            // Validasi Base64 sebelum kirim jika ini adalah image URL
            if (value && !isValidBase64Image(value)) {
                setMessage(`Gagal: Konten untuk ${key} bukan Base64 gambar yang valid.`);
                setMessageType('danger');
                setLoading(false);
                return;
            }
        } else if (key === 'APP_NAME') {
            type = 'TEXT'; // APP_NAME is text
        }

        if (value !== originalValue) {
            // Cek apakah key sudah ada di backend
            const existingConfigResponse = await fetchData(`${API_BASE_URL}/app-configs/${key}`, 'GET', null, true, false);
            
            if (existingConfigResponse) { // Config ditemukan (PUT)
                await fetchData(`${API_BASE_URL}/app-configs/${key}`, 'PUT', { value, description: `${key} content`, type }, true);
            } else if (value.trim() !== '') { // Buat baru hanya jika ada value dan belum ada
                await fetchData(`${API_BASE_URL}/app-configs`, 'POST', { key, value, description: `${key} content`, type }, true);
            } else if (value.trim() === '' && existingConfigResponse) {
                // Jika value di-clear tapi sudah ada di DB, anggap sebagai delete
                await fetchData(`${API_BASE_URL}/app-configs/${key}`, 'DELETE', null, true);
            }
        }
      }
      setMessage('Perubahan berhasil disimpan!');
      setMessageType('success');
      // Re-fetch all configs to ensure originalData is perfectly in sync with DB
      const updatedConfigs = await fetchData(`${API_BASE_URL}/app-configs`, 'GET', null, true, false);
      const newOriginalData = {};
      if (updatedConfigs && updatedConfigs.data) {
          updatedConfigs.data.forEach(config => {
              if (keysToProcess.includes(config.key)) {
                  newOriginalData[config.key] = config.value;
              }
          });
      }
      setOriginalData(newOriginalData);
      setIsEditing(false);
    } catch (err) {
      // Error sudah ditangani oleh fetchData
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

  if (loading) return <div className="loading-state">Loading documents...</div>;
  if (error && !loading) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="document-menu-container card">
      <div className="card-header card-header-primary">
        <h4 className="card-title">Pengaturan Aplikasi & Dokumen</h4>
        {/* <p className="card-category">Kelola nama aplikasi, gambar branding, dan konten dokumen.</p> */}
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
            {isEditing && documentData.AD_BANNER_IMAGE_URL && <button onClick={() => setDocumentData(prev => ({...prev, AD_BANNER_IMAGE_URL: ''}))} className="btn btn-sm btn-outline-warning mt-2">Hapus Gambar</button>}
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
            {isEditing && documentData.BACKGROUND_IMAGE_URL && <button onClick={() => setDocumentData(prev => ({...prev, BACKGROUND_IMAGE_URL: ''}))} className="btn btn-sm btn-outline-warning mt-2">Hapus Gambar</button>}
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
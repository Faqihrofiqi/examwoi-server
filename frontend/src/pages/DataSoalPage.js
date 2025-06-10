import React, { useState, useEffect, useCallback } from 'react';
import './DataSoalPage.css'; // Pastikan CSS ini ada dan sesuai

// --- Utilitas yang Diperlukan ---
import apiClient from '../api/axiosConfig'; // Untuk HTTP requests ke backend
import { fileToBase64, getFileFromEvent, isValidBase64Image } from '../utils/imageConverter'; // Untuk konversi gambar

const DataSoalPage = () => {
  // --- State Management ---
  const [faculties, setFaculties] = useState([]); // Daftar fakultas dari backend
  const [activeFacultyId, setActiveFacultyId] = useState(null); // ID fakultas yang sedang aktif
  const [activeFacultyName, setActiveFacultyName] = useState(''); // Nama fakultas yang sedang aktif
  const [questions, setQuestions] = useState([]); // Daftar soal untuk fakultas aktif

  const [loading, setLoading] = useState(true); // Status loading data utama
  const [error, setError] = useState(null); // Pesan error global

  // State untuk Form Soal (Raw Text/Structured)
  const [isEditing, setIsEditing] = useState(false); // Mode edit (true) atau tambah baru (false)
  const [currentQuestion, setCurrentQuestion] = useState(null); // Objek soal yang sedang diedit
  const [rawTextInput, setRawTextInput] = useState(''); // Input teks mentah dari textarea
  const [parsedPreview, setParsedPreview] = useState(null); // Hasil parsing dari backend (untuk preview)
  const [formMessage, setFormMessage] = useState(''); // Pesan feedback untuk form soal
  const [formMessageType, setFormMessageType] = useState(''); // Tipe pesan feedback (success/danger)
  const [questionImageFile, setQuestionImageFile] = useState(null); // Objek File gambar yang baru diupload
  const [questionImageUrlPreview, setQuestionImageUrlPreview] = useState(''); // Base64 dari gambar yang baru diupload (untuk preview di form)
  const [isBatchMode, setIsBatchMode] = useState(false); // Mode batch (true) atau single (false)
  const [showQuestionForm, setShowQuestionForm] = useState(false); // Mengontrol tampilan form soal

  // State untuk Form Soal Terstruktur
  const [structuredQuestionForm, setStructuredQuestionForm] = useState({
    questionText: '',
    options: ['', '', '', ''], // 4 opsi default
    correctOptionId: 'a',
    imageUrl: '', // Base64 image URL
    audioUrl: '', // Base64 audio URL
    questionType: 'TEXT', // TEXT, IMAGE, AUDIO
  });
  const [structuredImageFile, setStructuredImageFile] = useState(null);
  const [structuredAudioFile, setStructuredAudioFile] = useState(null);
  const [questionInputMode, setQuestionInputMode] = useState('raw'); // 'raw' atau 'structured'

  // State untuk Form Tambah Kategori (Inline)
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addCategoryMessage, setAddCategoryMessage] = useState('');
  const [addCategoryMessageType, setAddCategoryMessageType] = useState('');

  // --- Helpers ---
  const resetForm = useCallback(() => {
    setIsEditing(false);
    setCurrentQuestion(null);
    setRawTextInput('');
    setParsedPreview(null);
    setFormMessage('');
    setFormMessageType('');
    setQuestionImageFile(null);
    setQuestionImageUrlPreview('');
    setIsBatchMode(false);
    setShowQuestionForm(true); // Default tampilkan form setelah reset
    setStructuredQuestionForm({
      questionText: '', options: ['', '', '', ''], correctOptionId: 'a',
      imageUrl: '', audioUrl: '', questionType: 'TEXT'
    });
    setStructuredImageFile(null);
    setStructuredAudioFile(null);
    setQuestionInputMode('raw'); // Default ke raw text
  }, []); // Dependensi tetap sama

  const getOptionText = (options, optionId) => options?.find(opt => opt.id === optionId)?.text || '-';
  const getCorrectOptionLetter = (content) => {
    if (content?.correctOptionId) {
      const correctOption = content.options?.find(opt => opt.id === content.correctOptionId);
      return correctOption ? `${correctOption.text} (${content.correctOptionId.toUpperCase()})` : content.correctOptionId.toUpperCase();
    }
    return '-';
  };

  // --- Effects ---
  useEffect(() => {
    const getFaculties = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/faculties');
        const facultiesData = response.data?.data || [];
        setFaculties(facultiesData);
        if (facultiesData.length > 0) {
          setActiveFacultyId(facultiesData[0].id);
          setActiveFacultyName(facultiesData[0].name);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat kategori.');
        if (err.response?.status === 401 || err.response?.status === 403) {
          alert("Sesi berakhir atau tidak punya izin. Silakan login kembali.");
          localStorage.clear();
          window.location.href = '/admin/login';
        }
      } finally {
        setLoading(false);
      }
    };
    getFaculties();
  }, []);

  useEffect(() => {
    if (!activeFacultyId) {
      setQuestions([]);
      return;
    }
    const getQuestionsByFaculty = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/questions?facultyId=${activeFacultyId}`);
        setQuestions(response.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat soal untuk kategori ini.');
      } finally {
        setLoading(false);
      }
    };
    getQuestionsByFaculty();
  }, [activeFacultyId]);

  // --- Event Handlers (Form & Table Actions) ---
  
  // Handler for saving structured question form
  const handleStructuredSaveQuestion = async (event) => {
    event.preventDefault();
    setFormMessage('');
    setFormMessageType('');
  
    if (!activeFacultyId) {
      setFormMessage('Silakan pilih atau buat kategori/fakultas terlebih dahulu.');
      setFormMessageType('danger');
      return;
    }
  
    if (
      !structuredQuestionForm.questionText.trim() ||
      structuredQuestionForm.options.filter(opt => opt.trim() !== '').length < 2 ||
      !structuredQuestionForm.correctOptionId.trim()
    ) {
      setFormMessage('Semua field pertanyaan, minimal 2 opsi, dan jawaban benar harus diisi.');
      setFormMessageType('danger');
      return;
    }
  
    const validOptions = structuredQuestionForm.options.filter(opt => opt.trim() !== '');
    const correctOptionExists = validOptions.some((_, index) =>
      String.fromCharCode(97 + index) === structuredQuestionForm.correctOptionId
    );
    if (!structuredQuestionForm.correctOptionId || !correctOptionExists) {
      setFormMessage('Pilih jawaban benar yang valid.');
      setFormMessageType('danger');
      return;
    }
  
    const content = {
      questionText: structuredQuestionForm.questionText,
      options: validOptions.map((text, index) => ({ id: String.fromCharCode(97 + index), text })),
      correctOptionId: structuredQuestionForm.correctOptionId,
      imageUrl: structuredQuestionForm.imageUrl || undefined,
      audioUrl: structuredQuestionForm.audioUrl || undefined,
      questionType: structuredQuestionForm.questionType,
    };
  
    // Generate rawText dari content untuk disimpan di DB jika diperlukan oleh backend
    const generatedRawText = `# ${content.questionText}\n` +
      content.options.map(opt => `-- ${opt.text}`).join('\n') + `\n@${content.correctOptionId}`;
    let finalRawText = '';
    if (content.imageUrl) finalRawText = `[IMG:${content.imageUrl}]\n` + generatedRawText;
    else if (content.audioUrl) finalRawText = `[AUDIO:${content.audioUrl}]\n` + generatedRawText;
    else finalRawText = generatedRawText;
  
    const questionDataToSend = {
      facultyId: activeFacultyId,
      content: content, // Kirim structured content
      rawText: finalRawText, // Simpan juga rawText yang digenerate
      status: 'DRAFT',
      isBatch: false // Structured form selalu single
    };
  
    try {
      const response = await apiClient.post('/questions', questionDataToSend);
      setFormMessage('Soal berhasil ditambahkan sebagai DRAFT!');
      setFormMessageType('success');
  
      // Refresh daftar soal di tabel setelah operasi sukses
      const updatedQuestionsData = await apiClient.get(`/questions?facultyId=${activeFacultyId}`);
      setQuestions(updatedQuestionsData.data?.data || []);
      resetForm();
      setShowQuestionForm(false); // Sembunyikan form setelah save
    } catch (err) {
      setFormMessage(`Gagal menyimpan soal: ${err.response?.data?.message || err.message}`);
      setFormMessageType('danger');
    }
  };

  const handleCategoryClick = (facultyId, facultyName) => {
    setActiveFacultyId(facultyId);
    setActiveFacultyName(facultyName);
    setShowQuestionForm(false); // Sembunyikan form soal saat ganti kategori
    setShowAddCategoryForm(false); // Sembunyikan form tambah kategori
    resetForm();
  };

  // --- Handle Tambah Kategori (Inline Form) ---
  const handleAddCategorySubmit = async (event) => {
    event.preventDefault();
    setAddCategoryMessage('');
    setAddCategoryMessageType('');

    if (!newCategoryName.trim()) {
      setAddCategoryMessage('Nama kategori tidak boleh kosong.');
      setAddCategoryMessageType('danger');
      return;
    }

    setLoading(true); // Atur loading global
    try {
      const response = await apiClient.post('/faculties', {
        name: newCategoryName,
        description: `Fakultas ${newCategoryName} baru.`,
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' // Placeholder Base64
      });
      const newFaculty = response.data.data;
      setFaculties(prev => [...prev, newFaculty]);
      setActiveFacultyId(newFaculty.id);
      setActiveFacultyName(newFaculty.name);
      setAddCategoryMessage(`Kategori "${newCategoryName}" berhasil ditambahkan.`);
      setAddCategoryMessageType('success');
      setNewCategoryName(''); // Clear input
      setShowAddCategoryForm(false); // Sembunyikan form
    } catch (err) {
      setAddCategoryMessage(err.response?.data?.message || 'Gagal menambahkan kategori.');
      setAddCategoryMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Upload Gambar/Audio di Form Soal ---
  const handleQuestionImageChange = async (event) => {
    const file = getFileFromEvent(event);
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormMessage('File yang diunggah harus berupa gambar.');
        setFormMessageType('danger');
        setQuestionImageFile(null);
        setQuestionImageUrlPreview('');
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        if (!isValidBase64Image(base64)) { throw new Error('Konversi Base64 gambar tidak valid.'); }
        setQuestionImageFile(file);
        setQuestionImageUrlPreview(base64); // Untuk preview di Raw Text mode
        // Jika mode structured, update juga structured form
        if (questionInputMode === 'structured') {
          setStructuredQuestionForm(prev => ({ ...prev, imageUrl: base64 }));
        }
        setFormMessage('Gambar soal siap diunggah.');
        setFormMessageType('info');
      } catch (err) {
        setFormMessage(`Gagal mengkonversi gambar: ${err.message}`);
        setFormMessageType('danger');
        setQuestionImageFile(null);
        setQuestionImageUrlPreview('');
      }
    } else {
      setQuestionImageFile(null);
      setQuestionImageUrlPreview('');
      if (questionInputMode === 'structured') {
        setStructuredQuestionForm(prev => ({ ...prev, imageUrl: '' }));
      }
      setFormMessage('');
      setFormMessageType('');
    }
  };

  const handleStructuredAudioChange = async (event) => {
    const file = getFileFromEvent(event);
    if (!file || !file.type.startsWith('audio/')) {
      setStructuredAudioFile(null);
      setStructuredQuestionForm(prev => ({ ...prev, audioUrl: '' }));
      setFormMessage('File harus berupa audio.');
      setFormMessageType('danger');
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      if (!base64.startsWith('data:audio/')) throw new Error('Konversi Base64 audio tidak valid.'); // Validasi basic
      setStructuredAudioFile(file);
      setStructuredQuestionForm(prev => ({ ...prev, audioUrl: base64, questionType: 'AUDIO' })); // Set type ke AUDIO
      setFormMessage('Audio soal siap diunggah.');
      setFormMessageType('info');
    } catch (err) {
      setFormMessage(`Gagal mengkonversi audio: ${err.message}`);
      setFormMessageType('danger');
      setStructuredAudioFile(null);
      setStructuredQuestionForm(prev => ({ ...prev, audioUrl: '' }));
    }
  };

  const handleStructuredFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('option-')) {
      const index = parseInt(name.split('-')[1]);
      setStructuredQuestionForm(prev => {
        const newOptions = [...prev.options];
        newOptions[index] = value;
        return { ...prev, options: newOptions };
      });
    } else {
      setStructuredQuestionForm(prev => ({ ...prev, [name]: value }));
      // Jika memilih tipe soal, reset gambar/audio
      if (name === 'questionType' && value === 'TEXT') {
        setStructuredQuestionForm(prev => ({ ...prev, imageUrl: '', audioUrl: '' }));
        setStructuredImageFile(null);
        setStructuredAudioFile(null);
        setQuestionImageUrlPreview(''); // Clear preview image from raw mode if changing type
        setQuestionImageFile(null);
      } else if (name === 'questionType' && value === 'IMAGE') {
        setStructuredQuestionForm(prev => ({ ...prev, audioUrl: '' }));
        setStructuredAudioFile(null);
      } else if (name === 'questionType' && value === 'AUDIO') {
        setStructuredQuestionForm(prev => ({ ...prev, imageUrl: '' }));
        setStructuredImageFile(null);
      }
    }
  };

  const handlePreviewQuestion = async () => {
    setFormMessage('');
    setFormMessageType('');
    let contentToPreview = {};
    let rawTextForPreview = '';

    if (questionInputMode === 'raw') {
      rawTextForPreview = rawTextInput;
      if (!isBatchMode && questionImageUrlPreview) {
        const imgPlaceholderRegex = /\[IMG:.*?\]/;
        if (imgPlaceholderRegex.test(rawTextForPreview)) {
          rawTextForPreview = rawTextForPreview.replace(imgPlaceholderRegex, `[IMG:${questionImageUrlPreview}]`);
        } else {
          rawTextForPreview = `[IMG:${questionImageUrlPreview}]\n` + rawTextForPreview;
        }
      }
    } else { // Structured mode
      rawTextForPreview = `# ${structuredQuestionForm.questionText}\n` +
        structuredQuestionForm.options.filter(opt => opt.trim() !== '').map((text, index) => `-- ${text}`).join('\n') +
        `\n@${structuredQuestionForm.correctOptionId}`;

      if (structuredQuestionForm.questionType === 'IMAGE' && structuredQuestionForm.imageUrl) {
        rawTextForPreview = `[IMG:${structuredQuestionForm.imageUrl}]\n` + rawTextForPreview;
      } else if (structuredQuestionForm.questionType === 'AUDIO' && structuredQuestionForm.audioUrl) {
        rawTextForPreview = `[AUDIO:${structuredQuestionForm.audioUrl}]\n` + rawTextForPreview;
      }
      contentToPreview = { // Ini akan menjadi objek preview jika dari form structured
        questionText: structuredQuestionForm.questionText,
        options: structuredQuestionForm.options.filter(opt => opt.trim() !== '').map((text, index) => ({ id: String.fromCharCode(97 + index), text })),
        correctOptionId: structuredQuestionForm.correctOptionId,
        imageUrl: structuredQuestionForm.imageUrl,
        audioUrl: structuredQuestionForm.audioUrl,
        questionType: structuredQuestionForm.questionType,
      };
    }

    if (!rawTextForPreview.trim() && questionInputMode === 'raw') {
      setFormMessage('Raw text tidak boleh kosong untuk preview.');
      setFormMessageType('danger');
      setParsedPreview(null);
      return;
    }
    if (questionInputMode === 'structured' && (!structuredQuestionForm.questionText.trim() || structuredQuestionForm.options.filter(opt => opt.trim() !== '').length < 2)) {
      setFormMessage('Pertanyaan dan minimal 2 opsi harus diisi untuk preview terstruktur.');
      setFormMessageType('danger');
      setParsedPreview(null);
      return;
    }

    try {
      if (questionInputMode === 'raw') {
        const response = await apiClient.post('/questions/preview', { rawText: rawTextForPreview, isBatch: isBatchMode });
        setParsedPreview(response.data.data);
      } else { // Structured mode preview
        // Untuk structured mode, kita bisa langsung set parsedPreview dari state form
        // karena backend parser hanya untuk raw text.
        setParsedPreview(contentToPreview); // Langsung gunakan objek content yang sudah dibuat
      }
      setFormMessage('Preview berhasil dibuat.');
      setFormMessageType('success');
    } catch (err) {
      setParsedPreview(null);
      setFormMessage(`Error preview: ${err.response?.data?.message || err.message}`);
      setFormMessageType('danger');
    }
  };

  const handleSaveQuestion = async (event) => {
    event.preventDefault();
    setFormMessage('');
    setFormMessageType('');

    if (!activeFacultyId) {
      setFormMessage('Silakan pilih atau buat kategori/fakultas terlebih dahulu.');
      setFormMessageType('danger');
      return;
    }

    let questionDataToSend = {};
    let finalRawText = ''; // Untuk update rawText di DB jika diperlukan

    if (questionInputMode === 'raw') {
      if (!rawTextInput.trim()) {
        setFormMessage('Raw text soal tidak boleh kosong.');
        setFormMessageType('danger');
        return;
      }
      finalRawText = rawTextInput;
      if (!isBatchMode) { // Logic sisipan gambar hanya untuk single raw mode
        if (questionImageUrlPreview) {
          const imgPlaceholderRegex = /\[IMG:.*?\]/;
          if (imgPlaceholderRegex.test(finalRawText)) {
            finalRawText = finalRawText.replace(imgPlaceholderRegex, `[IMG:${questionImageUrlPreview}]`);
          } else {
            finalRawText = `[IMG:${questionImageUrlPreview}]\n` + finalRawText;
          }
        } else if (isEditing && currentQuestion && currentQuestion.content.imageUrl && !finalRawText.includes('[IMG:')) {
          finalRawText = `[IMG:${currentQuestion.content.imageUrl}]\n` + finalRawText;
        }
      }
      questionDataToSend = {
        facultyId: activeFacultyId,
        rawText: finalRawText,
        status: 'DRAFT',
        isBatch: isBatchMode
      };
    } else { // questionInputMode === 'structured'
      if (!structuredQuestionForm.questionText.trim() || structuredQuestionForm.options.filter(opt => opt.trim() !== '').length < 2 || !structuredQuestionForm.correctOptionId.trim()) {
        setFormMessage('Semua field pertanyaan, opsi, dan jawaban benar harus diisi.');
        setFormMessageType('danger');
        return;
      }
      const validOptions = structuredQuestionForm.options.filter(opt => opt.trim() !== '');
      const correctOptionExists = validOptions.some((_, index) =>
        String.fromCharCode(97 + index) === structuredQuestionForm.correctOptionId
      );
      if (!structuredQuestionForm.correctOptionId || !correctOptionExists) {
        setFormMessage('Pilih jawaban benar yang valid.');
        setFormMessageType('danger');
        return;
      }

      const content = {
        questionText: structuredQuestionForm.questionText,
        options: validOptions.map((text, index) => ({ id: String.fromCharCode(97 + index), text })),
        correctOptionId: structuredQuestionForm.correctOptionId,
        imageUrl: structuredQuestionForm.imageUrl || undefined,
        audioUrl: structuredQuestionForm.audioUrl || undefined,
      };

      // Generate rawText dari content untuk disimpan di DB jika diperlukan oleh backend
      const generatedRawText = `# ${content.questionText}\n` +
        content.options.map(opt => `-- ${opt.text}`).join('\n') + `\n@${content.correctOptionId}`;
      if (content.imageUrl) finalRawText = `[IMG:${content.imageUrl}]\n` + generatedRawText;
      else if (content.audioUrl) finalRawText = `[AUDIO:${content.audioUrl}]\n` + generatedRawText;
      else finalRawText = generatedRawText;

      questionDataToSend = {
        facultyId: activeFacultyId,
        content: content, // Kirim structured content
        rawText: finalRawText, // Simpan juga rawText yang digenerate
        status: 'DRAFT',
        isBatch: false // Structured form selalu single
      };
    }

    try {
      let response;
      if (isEditing && currentQuestion) {
        // Edit mode (PUT request)
        if (isBatchMode || questionInputMode === 'structured') { // Edit hanya dari RAW single
          setFormMessage('Tidak bisa mengedit soal dalam mode batch atau dari formulir terstruktur. Silakan gunakan mode raw single untuk edit.');
          setFormMessageType('danger');
          return;
        }
        response = await apiClient.put(`/questions/${currentQuestion.id}`, questionDataToSend);
        setFormMessage('Soal berhasil diperbarui!');
        setFormMessageType('success');
      } else {
        // Tambah Baru (POST request)
        response = await apiClient.post('/questions', questionDataToSend);
        if (questionDataToSend.isBatch) {
          setFormMessage(`Berhasil menambahkan ${response.data.count} soal dalam batch!`);
          setFormMessageType('success');
        } else {
          setFormMessage('Soal berhasil ditambahkan sebagai DRAFT!');
          setFormMessageType('success');
        }
      }

      // Refresh daftar soal di tabel setelah operasi sukses
      const updatedQuestionsData = await apiClient.get(`/questions?facultyId=${activeFacultyId}`);
      setQuestions(updatedQuestionsData.data?.data || []);
      resetForm();
      setShowQuestionForm(false); // Sembunyikan form setelah save
    } catch (err) {
      setFormMessage(`Gagal menyimpan soal: ${err.response?.data?.message || err.message}`);
      setFormMessageType('danger');
    }
  };

  const handleEditSoal = (soal) => {
    setIsEditing(true);
    setCurrentQuestion(soal);
    // Tentukan mode input dan isi form berdasarkan data soal
    if (soal.rawText && soal.rawText.includes('#') && soal.rawText.includes('--') && soal.rawText.includes('@')) {
      setQuestionInputMode('raw');
      setRawTextInput(soal.rawText);
      setParsedPreview(soal.content); // Masih bisa preview dari raw
    } else {
      // Default ke structured jika rawText tidak standar atau tidak ada
      setQuestionInputMode('structured');
      setStructuredQuestionForm({
        questionText: soal.content.questionText || '',
        options: soal.content.options?.map(opt => opt.text) || ['', '', '', ''],
        correctOptionId: soal.content.correctOptionId || 'a',
        imageUrl: soal.content.imageUrl || '',
        audioUrl: soal.content.audioUrl || '',
        questionType: soal.questionType || 'TEXT'
      });
      setStructuredImageFile(null); // Clear file input
      setStructuredAudioFile(null); // Clear file input
      setParsedPreview(null); // Reset preview for structured mode
    }

    setQuestionImageFile(null); // Clear raw input image file
    setQuestionImageUrlPreview(soal.content.imageUrl || ''); // Set preview gambar lama jika ada

    setFormMessage('');
    setFormMessageType('');
    setIsBatchMode(false); // Pastikan mode single saat edit
    setShowQuestionForm(true); // Tampilkan form saat edit
  };

  const handleDeleteSoal = async (questionId) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus soal ini? ID: ${questionId.substring(0, 8)}...`)) {
      setLoading(true);
      setError(null);
      try {
        await apiClient.delete(`/questions/${questionId}`);
        setQuestions(prevQuestions => prevQuestions.filter(q => q.id !== questionId));
        alert(`Soal ${questionId.substring(0, 8)}... berhasil dihapus.`);
      } catch (err) {
        alert(`Gagal menghapus soal: ${err.response?.data?.message || 'Terjadi kesalahan.'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateQuestionStatus = async (questionId, newStatus) => {
    let confirmMsg = '';
    let alertSuccessMsg = '';
    let endpoint = '';

    if (newStatus === 'PUBLISHED') {
      confirmMsg = `Apakah Anda yakin ingin menerbitkan soal ini? ID: ${questionId.substring(0, 8)}...`;
      alertSuccessMsg = `Soal ${questionId.substring(0, 8)}... berhasil diterbitkan.`;
      endpoint = `/questions/${questionId}/publish`;
    } else {
      if (newStatus === 'ARCHIVED') {
        confirmMsg = `Apakah Anda yakin ingin mengarsipkan soal ini? ID: ${questionId.substring(0, 8)}...`;
        alertSuccessMsg = `Soal ${questionId.substring(0, 8)}... berhasil diarsipkan.`;
      } else if (newStatus === 'DRAFT') {
        confirmMsg = `Apakah Anda yakin ingin mengembalikan soal ini ke status Draft? ID: ${questionId.substring(0, 8)}...`;
        alertSuccessMsg = `Soal ${questionId.substring(0, 8)}... berhasil dikembalikan ke Draft.`;
      }
      endpoint = `/questions/${questionId}/status`;
    }

    if (window.confirm(confirmMsg)) {
      setLoading(true);
      setError(null);
      try {
        let response;
        if (newStatus === 'PUBLISHED') {
          response = await apiClient.put(endpoint);
        } else {
          response = await apiClient.put(endpoint, { status: newStatus });
        }

        setQuestions(prevQuestions =>
          prevQuestions.map(q => q.id === questionId ? {
            ...q,
            status: response.data.data.status,
            publishedAt: response.data.data.publishedAt
          } : q)
        );
        alert(alertSuccessMsg);
      } catch (err) {
        alert(`Gagal mengubah status soal: ${err.response?.data?.message || 'Terjadi kesalahan.'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // --- Conditional Rendering for Initial States ---
  if (loading && faculties.length === 0) {
    return <div className="loading-state">Loading categories...</div>;
  }
  if (error) {
    return <div className="error-state">Error: {error}</div>;
  }
  if (faculties.length === 0 && !loading && !activeFacultyId) {
    return (
      <div className="no-data-state">
        <p>Tidak ada fakultas ditemukan. Silakan tambahkan satu.</p>
        {/* Tombol "Tambah Fakultas Pertama" akan membuka form, bukan prompt */}
        <button className="btn btn-primary mt-3" onClick={() => setShowAddCategoryForm(true)}>
          <i className="material-icons">add</i> Tambah Fakultas Pertama
        </button>
      </div>
    );
  }

  // --- Table Headers ---
  const tableHeaders = [
    'No',
    'Pertanyaan',
    'A',
    'B',
    'C',
    'D',
    'Benar',
    'Tipe',
    'Status',
    'Aksi'
  ];

  // --- Render Component ---
  return (
    <div className="data-soal-page">
      <h1 className="page-title">MENU DATA SOAL</h1>

      <div className="soal-content-layout">
        {/* Sidebar Kategori */}
        <aside className="categories-sidebar-card card">
          <div className="card-header card-header-primary">
            <h4 className="card-title">Kategori Soal</h4>
          </div>
          <div className="card-body">
            <div className="category-list">
              {faculties.map((faculty) => (
                <button
                  key={faculty.id}
                  className={`category-item-button ${activeFacultyId === faculty.id ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(faculty.id, faculty.name)}
                >
                  {faculty.name}
                </button>
              ))}
              <button className="add-category-button" onClick={() => setShowAddCategoryForm(true)} title="Tambah Kategori Baru">
                <i className="material-icons">add</i>
                <span>Tambah Kategori</span>
              </button>
            </div>
          </div>
        </aside>

        <section className="soal-table-section">
          {/* Header Utama dengan Tombol Tambah Soal */}
          <header className="active-category-display card">
            <div className="card-header card-header-info">
              <h4 className="card-title">{activeFacultyName || 'Pilih Kategori'}</h4>
            </div>
            <div className="card-body d-flex justify-content-between align-items-center">
              {loading && activeFacultyId && <div className="loading-questions">Loading questions...</div>}
              {activeFacultyId && ( // Tampilkan tombol Tambah Soal hanya jika kategori aktif
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowQuestionForm(true); }} disabled={!activeFacultyId}>
                  <i className="material-icons">add</i> Tambah Soal Baru
                </button>
              )}
            </div>
          </header>

          {/* Form Tambah Kategori (Inline) */}
          {showAddCategoryForm && (
            <div className="add-category-form-card card mb-4">
              <div className="card-header card-header-primary">
                <h4 className="card-title">Tambah Kategori (Fakultas) Baru</h4>
              </div>
              <div className="card-body">
                {addCategoryMessage && (
                  <div className={`alert alert-${addCategoryMessageType} alert-dismissible fade show`} role="alert">
                    {addCategoryMessage}
                    <button type="button" className="close" data-dismiss="alert" aria-label="Close" onClick={() => setAddCategoryMessage('')}>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                )}
                <form onSubmit={handleAddCategorySubmit}>
                  <div className="form-group">
                    <label htmlFor="newCategoryName">Nama Kategori/Fakultas</label>
                    <input
                      type="text"
                      id="newCategoryName"
                      className="form-control"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Contoh: Fakultas Ilmu Komputer"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    <i className="material-icons">add</i> Tambahkan Kategori
                  </button>
                  <button type="button" className="btn btn-warning ml-2" onClick={() => { setShowAddCategoryForm(false); setNewCategoryName(''); setAddCategoryMessage(''); }}>
                    <i className="material-icons">cancel</i> Batal
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Form Tambah/Edit Soal */}
          {activeFacultyId && showQuestionForm && (
            <div className="soal-form-card card mb-4">
              <div className="card-header card-header-primary">
                <h4 className="card-title">{isEditing ? `Edit Soal (ID: ${currentQuestion?.id.substring(0, 8)}...)` : 'Tambah Soal Baru'}</h4>
              </div>
              <div className="card-body">
                {formMessage && (
                  <div className={`alert alert-${formMessageType} alert-dismissible fade show`} role="alert">
                    {formMessage}
                    <button type="button" className="close" data-dismiss="alert" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                )}

                {/* Pilihan Mode Input Soal (Raw Text vs Structured Form) */}
                {!isEditing && ( // Pilihan mode hanya untuk tambah soal baru
                  <div className="form-group mb-3">
                    <label>Pilih Mode Input Soal:</label>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        id="rawMode"
                        name="questionInputMode"
                        className="form-check-input"
                        value="raw"
                        checked={questionInputMode === 'raw'}
                        onChange={() => setQuestionInputMode('raw')}
                      />
                      <label className="form-check-label" htmlFor="rawMode">Raw Text (Batch)</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        id="structuredMode"
                        name="questionInputMode"
                        className="form-check-input"
                        value="structured"
                        checked={questionInputMode === 'structured'}
                        onChange={() => setQuestionInputMode('structured')}
                      />
                      <label className="form-check-label" htmlFor="structuredMode">Formulir Terstruktur</label>
                    </div>
                  </div>
                )}

                {/* Form Input Raw Text (untuk Single atau Batch) */}
                {questionInputMode === 'raw' && (
                  <form onSubmit={handleSaveQuestion}>
                    <div className="form-group">
                      <label htmlFor="rawTextInput">Raw Text Soal (Format: #Pertanyaan --OpsiA @a)</label>
                      <textarea
                        id="rawTextInput"
                        className="form-control"
                        rows="8"
                        value={rawTextInput}
                        onChange={(e) => setRawTextInput(e.target.value)}
                        placeholder={isBatchMode ?
                          "Contoh Batch:\n# Soal 1\n-- A\n-- B\n@a\n\n# Soal 2\n-- X\n-- Y\n@x" :
                          "Contoh Single:\n# Apa ibukota Indonesia?\n-- Bandung\n-- Jakarta\n@b\n\n[IMG:data:image/png;base64,...]"
                        }
                        required
                      ></textarea>
                    </div>

                    <div className="form-group form-check-inline">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="isBatchModeCheckbox"
                        checked={isBatchMode}
                        onChange={(e) => setIsBatchMode(e.target.checked)}
                        disabled={isEditing}
                      />
                      <label className="form-check-label" htmlFor="isBatchModeCheckbox">Mode Batch (Multiple Soal)</label>
                    </div>

                    {!isBatchMode && (
                      <div className="form-group mt-3">
                        <label htmlFor="questionImageUpload">Upload Gambar Soal (Opsional)</label>
                        <input
                          type="file"
                          id="questionImageUpload"
                          className="form-control-file"
                          accept="image/*"
                          onChange={handleQuestionImageChange}
                        />
                        {questionImageUrlPreview && (
                          <img src={questionImageUrlPreview} alt="Preview Gambar Soal" className="img-thumbnail mt-2" style={{ maxWidth: '150px', maxHeight: '150px' }} />
                        )}
                        {isEditing && currentQuestion && currentQuestion.content.imageUrl && !questionImageUrlPreview && (
                          <p className="text-muted mt-2">Gambar saat ini: <img src={currentQuestion.content.imageUrl} alt="Gambar Soal Lama" className="img-thumbnail" style={{ maxWidth: '100px', maxHeight: '100px' }} /></p>
                        )}
                        {questionImageFile && (
                          <button type="button" className="btn btn-sm btn-outline-danger mt-2" onClick={() => { setQuestionImageFile(null); setQuestionImageUrlPreview(''); }}>
                            Hapus Gambar Baru
                          </button>
                        )}
                      </div>
                    )}

                    <button type="button" className="btn btn-info btn-sm" onClick={handlePreviewQuestion}>
                      <i className="material-icons">visibility</i> Preview Soal
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm ml-2" disabled={!activeFacultyId}>
                      <i className="material-icons">{isEditing ? 'save' : 'add'}</i> {isEditing ? 'Simpan Perubahan' : 'Tambahkan Soal'}
                    </button>
                    {(isEditing || showQuestionForm) && (
                      <button type="button" className="btn btn-warning btn-sm ml-2" onClick={() => setShowQuestionForm(false)}>
                        <i className="material-icons">cancel</i> Batal
                      </button>
                    )}
                  </form>
                )} {/* End of Raw Text Form */}

                {/* Form Input Terstruktur */}
                {questionInputMode === 'structured' && ( // Tampilkan ini jika mode structured
                  <form onSubmit={handleStructuredSaveQuestion}> {/* Submit handleStructuredSaveQuestion */}
                    <div className="form-group">
                      <label htmlFor="structuredQuestionText">Pertanyaan</label>
                      <textarea
                        id="structuredQuestionText"
                        name="questionText"
                        className="form-control"
                        rows="4"
                        value={structuredQuestionForm.questionText}
                        onChange={handleStructuredFormChange}
                        placeholder="Tulis teks pertanyaan di sini..."
                        required
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label>Tipe Soal:</label>
                      <div className="form-check form-check-inline">
                        <input type="radio" id="typeText" name="questionType" className="form-check-input" value="TEXT" checked={structuredQuestionForm.questionType === 'TEXT'} onChange={handleStructuredFormChange} />
                        <label className="form-check-label" htmlFor="typeText">Teks</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input type="radio" id="typeImage" name="questionType" className="form-check-input" value="IMAGE" checked={structuredQuestionForm.questionType === 'IMAGE'} onChange={handleStructuredFormChange} />
                        <label className="form-check-label" htmlFor="typeImage">Gambar</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input type="radio" id="typeAudio" name="questionType" className="form-check-input" value="AUDIO" checked={structuredQuestionForm.questionType === 'AUDIO'} onChange={handleStructuredFormChange} />
                        <label className="form-check-label" htmlFor="typeAudio">Audio</label>
                      </div>
                    </div>

                    {(structuredQuestionForm.questionType === 'IMAGE') && (
                      <div className="form-group">
                        <label htmlFor="structuredImageUpload">Upload Gambar Soal</label>
                        <input type="file" id="structuredImageUpload" className="form-control-file" accept="image/*" onChange={handleQuestionImageChange} />
                        {structuredQuestionForm.imageUrl && (
                          <img src={structuredQuestionForm.imageUrl} alt="Preview Gambar" className="img-thumbnail mt-2" style={{ maxWidth: '150px', maxHeight: '150px' }} />
                        )}
                        {structuredImageFile && (
                          <button type="button" className="btn btn-sm btn-outline-danger mt-2" onClick={() => { setStructuredImageFile(null); setStructuredQuestionForm(prev => ({ ...prev, imageUrl: '' })); }}>Hapus Gambar</button>
                        )}
                      </div>
                    )}

                    {(structuredQuestionForm.questionType === 'AUDIO') && (
                      <div className="form-group">
                        <label htmlFor="structuredAudioUpload">Upload Audio Soal</label>
                        <input type="file" id="structuredAudioUpload" className="form-control-file" accept="audio/*" onChange={handleStructuredAudioChange} />
                        {structuredQuestionForm.audioUrl && (
                          <audio controls src={structuredQuestionForm.audioUrl} className="mt-2" style={{ width: '100%' }}></audio>
                        )}
                        {structuredAudioFile && (
                          <button type="button" className="btn btn-sm btn-outline-danger mt-2" onClick={() => { setStructuredAudioFile(null); setStructuredQuestionForm(prev => ({ ...prev, audioUrl: '' })); }}>Hapus Audio</button>
                        )}
                      </div>
                    )}

                    {structuredQuestionForm.options.map((optionText, index) => (
                      <div className="input-group mb-2" key={index}>
                        <div className="input-group-prepend">
                          <span className="input-group-text">{String.fromCharCode(65 + index)}.</span>
                        </div>
                        <input
                          type="text"
                          name={`option-${index}`}
                          className="form-control"
                          placeholder={`Opsi Jawaban ${String.fromCharCode(65 + index)}`}
                          value={optionText}
                          onChange={handleStructuredFormChange}
                          required={index < 2} // Minimal 2 opsi wajib
                        />
                      </div>
                    ))}

                    <div className="form-group mt-3">
                      <label htmlFor="correctOptionId">Jawaban Benar:</label>
                      <select
                        id="correctOptionId"
                        name="correctOptionId"
                        className="form-control"
                        value={structuredQuestionForm.correctOptionId}
                        onChange={handleStructuredFormChange}
                        required
                      >
                        {structuredQuestionForm.options.filter(opt => opt.trim() !== '').map((_, index) => (
                          <option key={index} value={String.fromCharCode(97 + index)}>
                            {String.fromCharCode(65 + index)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" className="btn btn-primary btn-sm">
                      <i className="material-icons">add</i> Tambahkan Soal
                    </button>
                    <button type="button" className="btn btn-warning btn-sm ml-2" onClick={() => setShowQuestionForm(false)}>
                      <i className="material-icons">cancel</i> Batal
                    </button>
                  </form>
                )} {/* End of Structured Form */}

                {/* Tampilan Preview Soal (tetap sama) */}
                {parsedPreview && (
                  <div className="preview-section mt-4 card">
                    <div className="card-header card-header-info">
                      <h5 className="card-title">Preview Soal{questionInputMode === 'raw' && isBatchMode ? ' (Batch)' : ''}</h5>
                    </div>
                    <div className="card-body">
                      {Array.isArray(parsedPreview) ? ( // Untuk preview batch dari raw text
                        parsedPreview.map((singleParsed, idx) => (
                          <div key={idx} className="mb-3 p-2 border rounded">
                            <h6>Soal #{idx + 1}</h6>
                            <p><strong>Pertanyaan:</strong> {singleParsed.questionText}</p>
                            {singleParsed.imageUrl && <img src={singleParsed.imageUrl} alt={`Preview Image Soal ${idx + 1}`} className="question-image-thumb" />}
                            {singleParsed.audioUrl && (
                              <audio controls className="question-audio-thumb">
                                <source src={singleParsed.audioUrl} type="audio/mpeg" />
                                Browser Anda tidak mendukung elemen audio.
                              </audio>
                            )}
                            <p><strong>Opsi:</strong></p>
                            <ul>
                              {singleParsed.options.map(opt => (
                                <li key={opt.id}>{opt.id.toUpperCase()}. {opt.text}</li>
                              ))}
                            </ul>
                            <p><strong>Jawaban Benar:</strong> {singleParsed.correctOptionId ? singleParsed.correctOptionId.toUpperCase() : '-'}</p>
                            <p><strong>Tipe:</strong> {singleParsed.questionType}</p>
                          </div>
                        ))
                      ) : ( // Untuk preview single (dari raw atau structured)
                        <>
                          <p><strong>Pertanyaan:</strong> {parsedPreview.questionText}</p>
                          {parsedPreview.imageUrl && <img src={parsedPreview.imageUrl} alt="Preview Image" className="question-image-thumb" />}
                          {parsedPreview.audioUrl && (
                            <audio controls className="question-audio-thumb">
                              <source src={parsedPreview.audioUrl} type="audio/mpeg" />
                              Browser Anda tidak mendukung elemen audio.
                            </audio>
                          )}
                          <p><strong>Opsi:</strong></p>
                          <ul>
                            {parsedPreview.options.map(opt => (
                              <li key={opt.id}>{opt.id.toUpperCase()}. {opt.text}</li>
                            ))}
                          </ul>
                          <p><strong>Jawaban Benar:</strong> {parsedPreview.correctOptionId ? parsedPreview.correctOptionId.toUpperCase() : '-'}</p>
                          <p><strong>Tipe Soal:</strong> {parsedPreview.questionType}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabel Soal (tetap sama) */}
          <div className="soal-table-card card">
            <div className="card-header card-header-primary">
              <h4 className="card-title">Daftar Soal {activeFacultyName ? `(${activeFacultyName})` : ''}</h4>
              <p className="card-category">Kelola soal-soal di fakultas ini.</p>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      {tableHeaders.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {questions.length > 0 ? (
                      questions.map((soal, index) => (
                        <tr key={soal.id}>
                          <td>{index + 1}</td>
                          <td>
                            {soal.content.questionText}
                            {soal.content.imageUrl && (
                              <img src={soal.content.imageUrl} alt="Gambar Soal" className="question-image-thumb" />
                            )}
                            {soal.content.audioUrl && (
                              <audio controls className="question-audio-thumb" aria-label="Audio Soal">
                                <source src={soal.content.audioUrl} type="audio/mpeg" />
                                Browser Anda tidak mendukung elemen audio.
                              </audio>
                            )}
                          </td>
                          <td>{getOptionText(soal.content.options, 'a')}</td>
                          <td>{getOptionText(soal.content.options, 'b')}</td>
                          <td>{getOptionText(soal.content.options, 'c')}</td>
                          <td>{getOptionText(soal.content.options, 'd')}</td>
                          <td>{getCorrectOptionLetter(soal.content)}</td>
                          <td>{soal.questionType}</td>
                          <td>
                            <span className={`badge badge-${soal.status === 'PUBLISHED' ? 'success' : soal.status === 'DRAFT' ? 'warning' : 'danger'}`}>
                              {soal.status}
                            </span>
                          </td>
                          <td className="action-cell">
                            <button onClick={() => handleEditSoal(soal)} className="action-button edit-button" title="Edit Soal">
                              <i className="material-icons">edit</i>
                            </button>

                            {/* Tombol Aksi Status Soal */}
                            {soal.status === 'DRAFT' && (
                              <button onClick={() => handleUpdateQuestionStatus(soal.id, 'PUBLISHED')} className="action-button publish-button" title="Terbitkan Soal">
                                <i className="material-icons">cloud_upload</i>
                              </button>
                            )}
                            {soal.status === 'PUBLISHED' && (
                              <button onClick={() => handleUpdateQuestionStatus(soal.id, 'ARCHIVED')} className="action-button archive-button" title="Arsipkan Soal">
                                <i className="material-icons">archive</i>
                              </button>
                            )}
                            {soal.status === 'ARCHIVED' && (
                              <button onClick={() => handleUpdateQuestionStatus(soal.id, 'DRAFT')} className="action-button draft-button" title="Kembalikan ke Draft">
                                <i className="material-icons">unarchive</i>
                              </button>
                            )}

                            <button onClick={() => handleDeleteSoal(soal.id)} className="action-button delete-button" title="Hapus Soal">
                              <i className="material-icons">delete</i>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={tableHeaders.length} className="text-center">
                          Tidak ada soal untuk kategori "{activeFacultyName}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DataSoalPage;
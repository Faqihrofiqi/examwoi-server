// import React, { useState, useEffect, useCallback } from 'react';
// import './DataSoalPage.css'; // Pastikan CSS ini ada dan sesuai

// import apiClient from '../api/axiosConfig';
// import { fileToBase64, getFileFromEvent, isValidBase64Image } from '../utils/imageConverter';

// const DataSoalPage = () => {
//   // --- State Management ---
//   const [faculties, setFaculties] = useState([]); // Daftar fakultas
//   const [activeFacultyId, setActiveFacultyId] = useState(null);
//   const [activeFacultyName, setActiveFacultyName] = useState('');

//   const [examPackages, setExamPackages] = useState([]); // Daftar paket ujian untuk fakultas aktif
//   const [activePackageId, setActivePackageId] = useState(null); // ID paket ujian aktif
//   const [activePackageName, setActivePackageName] = useState(''); // Nama paket ujian aktif
//   const [activePackageStatus, setActivePackageStatus] = useState(null); // Status paket aktif

//   const [questions, setQuestions] = useState([]); // Daftar soal untuk paket aktif

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // State untuk Form Soal (Raw Text/Structured)
//   const [isEditingQuestion, setIsEditingQuestion] = useState(false); // Mode edit soal
//   const [currentQuestion, setCurrentQuestion] = useState(null);
//   const [rawTextInput, setRawTextInput] = useState('');
//   const [parsedPreview, setParsedPreview] = useState(null);
//   const [questionFormMessage, setQuestionFormMessage] = useState('');
//   const [questionFormMessageType, setQuestionFormMessageType] = useState('');
//   // State untuk pesan pada form soal (tambah/edit)
//   const [formMessage, setFormMessage] = useState('');
//   const [formMessageType, setFormMessageType] = useState('');
//   const [questionImageFile, setQuestionImageFile] = useState(null);
//   const [questionImageUrlPreview, setQuestionImageUrlPreview] = useState('');
//   const [isBatchMode, setIsBatchMode] = useState(false);
//   const [showQuestionForm, setShowQuestionForm] = useState(false);
//   const [structuredQuestionForm, setStructuredQuestionForm] = useState({
//     questionText: '', options: ['', '', '', ''], correctOptionId: 'a',
//     imageUrl: '', audioUrl: '', questionType: 'TEXT',
//   });
//   const [structuredImageFile, setStructuredImageFile] = useState(null);
//   const [structuredAudioFile, setStructuredAudioFile] = useState(null);
//   const [questionInputMode, setQuestionInputMode] = useState('raw');

//   // State untuk Form Tambah/Edit Paket Ujian
//   const [showPackageForm, setShowPackageForm] = useState(false);
//   const [isEditingPackage, setIsEditingPackage] = useState(false);
//   const [currentPackage, setCurrentPackage] = useState(null);
//   const [newPackageName, setNewPackageName] = useState('');
//   const [newPackageDescription, setNewPackageDescription] = useState('');
//   const [newPackageDuration, setNewPackageDuration] = useState('');
//   const [packageFormMessage, setPackageFormMessage] = useState('');
//   const [packageFormMessageType, setPackageFormMessageType] = useState('');

//   // State untuk Form Tambah Kategori (Inline)
//   const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
//   const [newCategoryName, setNewCategoryName] = useState('');
//   const [addCategoryMessage, setAddCategoryMessage] = useState('');
//   const [addCategoryMessageType, setAddCategoryMessageType] = useState('');

//   // --- Helpers ---
//   const resetQuestionForm = useCallback(() => {
//     setIsEditingQuestion(false);
//     setCurrentQuestion(null);
//     setRawTextInput('');
//     setParsedPreview(null);
//     setQuestionFormMessage('');
//     setQuestionFormMessageType('');
//     setQuestionImageFile(null);
//     setQuestionImageUrlPreview('');
//     setIsBatchMode(false);
//     setShowQuestionForm(true);
//     setStructuredQuestionForm({
//       questionText: '', options: ['', '', '', ''], correctOptionId: 'a',
//       imageUrl: '', audioUrl: '', questionType: 'TEXT'
//     });
//     setStructuredImageFile(null);
//     setStructuredAudioFile(null);
//     setQuestionInputMode('raw');
//   }, []);

//   const resetPackageForm = useCallback(() => {
//     setIsEditingPackage(false);
//     setCurrentPackage(null);
//     setNewPackageName('');
//     setNewPackageDescription('');
//     setNewPackageDuration('');
//     setPackageFormMessage('');
//     setPackageFormMessageType('');
//     setShowPackageForm(true);
//   }, []);

//   const getOptionText = (options, optionId) => options?.find(opt => opt.id === optionId)?.text || '-';
//   const getCorrectOptionLetter = (content) => {
//     if (content?.correctOptionId) {
//       const correctOption = content.options?.find(opt => opt.id === content.correctOptionId);
//       return correctOption ? `${correctOption.text} (${content.correctOptionId.toUpperCase()})` : content.correctOptionId.toUpperCase();
//     }
//     return '-';
//   };

//   // --- Effects ---
//   // Effect 1: Ambil daftar fakultas
//   useEffect(() => {
//     const getFaculties = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const response = await apiClient.get('/faculties');
//         const facultiesData = response.data?.data || [];
//         setFaculties(facultiesData);
//         if (facultiesData.length > 0) {
//           setActiveFacultyId(facultiesData[0].id);
//           setActiveFacultyName(facultiesData[0].name);
//         }
//       } catch (err) {
//         setError(err.response?.data?.message || 'Gagal memuat kategori.');
//         if (err.response?.status === 401 || err.response?.status === 403) {
//           alert("Sesi berakhir atau tidak punya izin. Silakan login kembali.");
//           localStorage.clear();
//           window.location.href = '/admin/login';
//         }
//       } finally {
//         setLoading(false);
//       }
//     };
//     getFaculties();
//   }, []);

//   // Effect 2: Ambil daftar paket ujian saat fakultas aktif berubah
//   useEffect(() => {
//     const getExamPackages = async () => {
//       if (!activeFacultyId) {
//         setExamPackages([]);
//         setActivePackageId(null);
//         setActivePackageName('');
//         setActivePackageStatus(null);
//         setQuestions([]);
//         return;
//       }
//       setLoading(true);
//       setError(null);
//       try {
//         // Ambil semua paket untuk fakultas aktif (admin melihat semua status)
//         const response = await apiClient.get(`/exam-packages?facultyId=${activeFacultyId}`);
//         const packagesData = response.data?.data || [];
//         setExamPackages(packagesData);
//         // Default select paket pertama jika ada
//         if (packagesData.length > 0) {
//           setActivePackageId(packagesData[0].id);
//           setActivePackageName(packagesData[0].name);
//           setActivePackageStatus(packagesData[0].status);
//         } else {
//           setActivePackageId(null);
//           setActivePackageName('');
//           setActivePackageStatus(null);
//         }
//         setQuestions([]); // Kosongkan soal saat ganti paket/fakultas
//       } catch (err) {
//         setError(err.response?.data?.message || 'Gagal memuat paket ujian.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     getExamPackages();
//   }, [activeFacultyId]);

//   // Effect 3: Ambil soal saat paket aktif berubah
//   useEffect(() => {
//     const getQuestionsByPackage = async () => {
//       if (!activePackageId) {
//         setQuestions([]);
//         return;
//       }
//       setLoading(true);
//       setError(null);
//       try {
//         const response = await apiClient.get(`/questions?examPackageId=${activePackageId}`);
//         setQuestions(response.data?.data || []);
//       } catch (err) {
//         setError(err.response?.data?.message || 'Gagal memuat soal untuk paket ini.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     getQuestionsByPackage();
//   }, [activePackageId]);

//   // --- Event Handlers (UI Actions) ---

//   // Mengubah fakultas aktif
//   const handleCategoryClick = (facultyId, facultyName) => {
//     setActiveFacultyId(facultyId);
//     setActiveFacultyName(facultyName);
//     setShowQuestionForm(false);
//     setShowAddCategoryForm(false);
//     setShowPackageForm(false); // Sembunyikan form paket
//     resetQuestionForm(); // Reset form soal
//   };

//   // --- Handle Tambah Kategori (Inline Form) ---
//   const handleAddCategorySubmit = async (event) => {
//     event.preventDefault();
//     setAddCategoryMessage('');
//     setAddCategoryMessageType('');

//     if (!newCategoryName.trim()) {
//       setAddCategoryMessage('Nama kategori tidak boleh kosong.');
//       setAddCategoryMessageType('danger');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await apiClient.post('/faculties', {
//         name: newCategoryName,
//         description: `Fakultas ${newCategoryName} baru.`,
//         imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
//       });
//       const newFaculty = response.data.data;
//       setFaculties(prev => [...prev, newFaculty]);
//       // Setelah menambah, mungkin langsung pilih fakultas baru
//       setActiveFacultyId(newFaculty.id);
//       setActiveFacultyName(newFaculty.name);
//       setAddCategoryMessage(`Kategori "${newCategoryName}" berhasil ditambahkan.`);
//       setAddCategoryMessageType('success');
//       setNewCategoryName('');
//       setShowAddCategoryForm(false);
//     } catch (err) {
//       setAddCategoryMessage(err.response?.data?.message || 'Gagal menambahkan kategori.');
//       setAddCategoryMessageType('danger');
//     } finally {
//       setLoading(false);
//     }
//   };
//   // --- Handle Upload Gambar/Audio di Form Soal ---
//   const handleQuestionImageChange = async (event) => {
//     const file = getFileFromEvent(event);
//     if (file) {
//       if (!file.type.startsWith('image/')) {
//         setQuestionFormMessage('File yang diunggah harus berupa gambar.');
//         setQuestionFormMessageType('danger');
//         setQuestionImageFile(null);
//         setQuestionImageUrlPreview('');
//         return;
//       }
//       try {
//         const base64 = await fileToBase64(file);
//         if (!isValidBase64Image(base64)) { throw new Error('Konversi Base64 gambar tidak valid.'); }
//         setQuestionImageFile(file);
//         setQuestionImageUrlPreview(base64);
//         if (questionInputMode === 'structured') {
//           setStructuredQuestionForm(prev => ({ ...prev, imageUrl: base64 }));
//         }
//         setQuestionFormMessage('Gambar soal siap diunggah.');
//         setQuestionFormMessageType('info');
//       } catch (err) {
//         setQuestionFormMessage(`Gagal mengkonversi gambar: ${err.message}`);
//         setQuestionFormMessageType('danger');
//         setQuestionImageFile(null);
//         setQuestionImageUrlPreview('');
//       }
//     } else {
//       setQuestionImageFile(null);
//       setQuestionImageUrlPreview('');
//       if (questionInputMode === 'structured') {
//         setStructuredQuestionForm(prev => ({ ...prev, imageUrl: '' }));
//       }
//       setQuestionFormMessage('');
//       setQuestionFormMessageType('');
//     }
//   };

//   const handleStructuredAudioChange = async (event) => {
//     const file = getFileFromEvent(event);
//     if (!file || !file.type.startsWith('audio/')) {
//       setStructuredAudioFile(null);
//       setStructuredQuestionForm(prev => ({ ...prev, audioUrl: '' }));
//       setQuestionFormMessage('File harus berupa audio.');
//       setQuestionFormMessageType('danger');
//       return;
//     }
//     try {
//       const base64 = await fileToBase64(file);
//       if (!base64.startsWith('data:audio/')) throw new Error('Konversi Base64 audio tidak valid.');
//       setStructuredAudioFile(file);
//       setStructuredQuestionForm(prev => ({ ...prev, audioUrl: base64, questionType: 'AUDIO' }));
//       setQuestionFormMessage('Audio soal siap diunggah.');
//       setQuestionFormMessageType('info');
//     } catch (err) {
//       setQuestionFormMessage(`Gagal mengkonversi audio: ${err.message}`);
//       setQuestionFormMessageType('danger');
//       setStructuredAudioFile(null);
//       setStructuredQuestionForm(prev => ({ ...prev, audioUrl: '' }));
//     }
//   };

//   const handleStructuredFormChange = (e) => {
//     const { name, value } = e.target;
//     if (name.startsWith('option-')) {
//       const index = parseInt(name.split('-')[1]);
//       setStructuredQuestionForm(prev => {
//         const newOptions = [...prev.options];
//         newOptions[index] = value;
//         return { ...prev, options: newOptions };
//       });
//     } else {
//       setStructuredQuestionForm(prev => ({ ...prev, [name]: value }));
//       if (name === 'questionType' && value === 'TEXT') {
//         setStructuredQuestionForm(prev => ({ ...prev, imageUrl: '', audioUrl: '' }));
//         setStructuredImageFile(null);
//         setStructuredAudioFile(null);
//         setQuestionImageUrlPreview('');
//         setQuestionImageFile(null);
//       } else if (name === 'questionType' && value === 'IMAGE') {
//         setStructuredQuestionForm(prev => ({ ...prev, audioUrl: '' }));
//         setStructuredAudioFile(null);
//       } else if (name === 'questionType' && value === 'AUDIO') {
//         setStructuredQuestionForm(prev => ({ ...prev, imageUrl: '' }));
//         setStructuredImageFile(null);
//       }
//     }
//   };

//   const handlePreviewQuestion = async () => {
//     setQuestionFormMessage('');
//     setQuestionFormMessageType('');
//     let contentToPreview = {};
//     let rawTextForPreview = '';

//     if (questionInputMode === 'raw') {
//       rawTextForPreview = rawTextInput;
//       if (!isBatchMode && questionImageUrlPreview) {
//         const imgPlaceholderRegex = /\[IMG:.*?\]/;
//         if (imgPlaceholderRegex.test(rawTextForPreview)) {
//           rawTextForPreview = rawTextForPreview.replace(imgPlaceholderRegex, `[IMG:${questionImageUrlPreview}]`);
//         } else {
//           rawTextForPreview = `[IMG:${questionImageUrlPreview}]\n` + rawTextForPreview;
//         }
//       }
//     } else { // Structured mode
//       rawTextForPreview = `# ${structuredQuestionForm.questionText}\n` +
//         structuredQuestionForm.options.filter(opt => opt.trim() !== '').map((text, index) => `-- ${text}`).join('\n') +
//         `\n@${structuredQuestionForm.correctOptionId}`;

//       if (structuredQuestionForm.questionType === 'IMAGE' && structuredQuestionForm.imageUrl) {
//         rawTextForPreview = `[IMG:${structuredQuestionForm.imageUrl}]\n` + rawTextForPreview;
//       } else if (structuredQuestionForm.questionType === 'AUDIO' && structuredQuestionForm.audioUrl) {
//         rawTextForPreview = `[AUDIO:${structuredQuestionForm.audioUrl}]\n` + rawTextForPreview;
//       }
//       contentToPreview = { // Ini akan menjadi objek preview jika dari form structured
//         questionText: structuredQuestionForm.questionText,
//         options: structuredQuestionForm.options.filter(opt => opt.trim() !== '').map((text, index) => ({ id: String.fromCharCode(97 + index), text })),
//         correctOptionId: structuredQuestionForm.correctOptionId,
//         imageUrl: structuredQuestionForm.imageUrl,
//         audioUrl: structuredQuestionForm.audioUrl,
//         questionType: structuredQuestionForm.questionType,
//       };
//     }

//     if (!rawTextForPreview.trim() && questionInputMode === 'raw') {
//       setQuestionFormMessage('Raw text tidak boleh kosong untuk preview.');
//       setQuestionFormMessageType('danger');
//       setParsedPreview(null);
//       return;
//     }
//     if (questionInputMode === 'structured' && (!structuredQuestionForm.questionText.trim() || structuredQuestionForm.options.filter(opt => opt.trim() !== '').length < 2)) {
//       setQuestionFormMessage('Pertanyaan dan minimal 2 opsi harus diisi untuk preview terstruktur.');
//       setQuestionFormMessageType('danger');
//       setParsedPreview(null);
//       return;
//     }

//     try {
//       if (questionInputMode === 'raw') {
//         const response = await apiClient.post('/questions/preview', { rawText: rawTextForPreview, isBatch: isBatchMode });
//         setParsedPreview(response.data.data);
//       } else { // Structured mode preview
//         setParsedPreview(contentToPreview); // Langsung gunakan objek content yang sudah dibuat
//       }
//       setQuestionFormMessage('Preview berhasil dibuat.');
//       setQuestionFormMessageType('success');
//     } catch (err) {
//       setParsedPreview(null);
//       setQuestionFormMessage(`Error preview: ${err.response?.data?.message || err.message}`);
//       setQuestionFormMessageType('danger');
//     }
//   };

//   const handleSaveQuestion = async (event) => {
//     event.preventDefault();
//     setFormMessage('');
//     setFormMessageType('');

//     if (!activePackageId) {
//       setFormMessage('Silakan pilih atau buat paket ujian terlebih dahulu.');
//       setFormMessageType('danger');
//       return;
//     }

//     let questionDataToSend = {};
//     let finalRawText = ''; // Digunakan untuk rawText di backend, baik dari raw input atau generate dari structured form

//     if (questionInputMode === 'raw') {
//       if (!rawTextInput.trim()) {
//         setFormMessage('Raw text soal tidak boleh kosong.');
//         setFormMessageType('danger');
//         return;
//       }
//       finalRawText = rawTextInput;
//       // Logika sisipan gambar hanya untuk single raw mode
//       if (!isBatchMode) {
//         if (questionImageUrlPreview) {
//           const imgPlaceholderRegex = /\[IMG:.*?\]/;
//           if (imgPlaceholderRegex.test(finalRawText)) {
//             finalRawText = finalRawText.replace(imgPlaceholderRegex, `[IMG:${questionImageUrlPreview}]`);
//           } else {
//             finalRawText = `[IMG:${questionImageUrlPreview}]\n` + finalRawText;
//           }
//         } else if (isEditingQuestion && currentQuestion && currentQuestion.content.imageUrl && !finalRawText.includes('[IMG:')) {
//           finalRawText = `[IMG:${currentQuestion.content.imageUrl}]\n` + finalRawText;
//         }
//       }
//       questionDataToSend = {
//         examPackageId: activePackageId,
//         rawText: finalRawText, // Kirim rawText yang sudah difinalisasi
//         isBatch: isBatchMode,
//       };
//     } else { // questionInputMode === 'structured'
//       if (!structuredQuestionForm.questionText.trim() || structuredQuestionForm.options.filter(opt => opt.trim() !== '').length < 2 || !structuredQuestionForm.correctOptionId.trim()) {
//         setFormMessage('Semua field pertanyaan, minimal 2 opsi, dan jawaban benar harus diisi.');
//         setFormMessageType('danger');
//         return;
//       }
//       const validOptions = structuredQuestionForm.options.filter(opt => opt.trim() !== '');
//       const correctOptionExists = validOptions.some((_, index) =>
//         String.fromCharCode(97 + index) === structuredQuestionForm.correctOptionId
//       );
//       if (!structuredQuestionForm.correctOptionId || !correctOptionExists) {
//         setFormMessage('Pilih jawaban benar yang valid.');
//         setFormMessageType('danger');
//         return;
//       }

//       const content = {
//         questionText: structuredQuestionForm.questionText,
//         options: validOptions.map((text, index) => ({ id: String.fromCharCode(97 + index), text })),
//         correctOptionId: structuredQuestionForm.correctOptionId,
//         imageUrl: structuredQuestionForm.imageUrl || undefined,
//         audioUrl: structuredQuestionForm.audioUrl || undefined,
//       };

//       // Generate rawText dari content untuk disimpan di DB jika diperlukan oleh backend
//       const generatedRawText = `# ${content.questionText}\n` +
//         content.options.map(opt => `-- ${opt.text}`).join('\n') + `\n@${content.correctOptionId}`;
//       if (content.imageUrl) finalRawText = `[IMG:${content.imageUrl}]\n` + generatedRawText;
//       else if (content.audioUrl) finalRawText = `[AUDIO:${content.audioUrl}]\n` + generatedRawText;
//       else finalRawText = generatedRawText;

//       questionDataToSend = {
//         examPackageId: activePackageId,
//         content: content, // Kirim content terstruktur
//         rawText: finalRawText, // Simpan juga rawText yang digenerate
//         isBatch: false, // Structured form selalu single
//       };
//     }

//     try {
//       let response;
//       if (isEditingQuestion && currentQuestion) {
//         // Mode Edit (PUT request)
//         // HAPUS BATASAN INI: if (isBatchMode || questionInputMode === 'structured') { ... return; }
//         // Sekarang, kita bisa mengedit dari structured form juga
//         if (isBatchMode) { // Edit batch masih tidak didukung
//           setFormMessage('Tidak bisa mengedit soal dalam mode batch. Silakan gunakan mode single.');
//           setFormMessageType('danger');
//           return;
//         }
//         // Jika mode edit dan structured form, kirim 'content' dan 'rawText' yang digenerate
//         // Backend updateQuestion sudah bisa menangani 'content' langsung
//         response = await apiClient.put(`/questions/${currentQuestion.id}`, questionDataToSend);
//         setFormMessage('Soal berhasil diperbarui!');
//         setFormMessageType('success');
//       } else {
//         // Tambah Baru (POST request)
//         response = await apiClient.post('/questions', questionDataToSend);
//         if (questionDataToSend.isBatch) {
//           setFormMessage(`Berhasil menambahkan ${response.data.count} soal dalam batch!`);
//           setFormMessageType('success');
//         } else {
//           setFormMessage('Soal berhasil ditambahkan sebagai DRAFT!');
//           setFormMessageType('success');
//         }
//       }

//       // Refresh daftar soal di tabel setelah operasi sukses
//       const updatedQuestionsData = await apiClient.get(`/questions?examPackageId=${activePackageId}`);
//       setQuestions(updatedQuestionsData.data?.data || []);
//       resetQuestionForm();
//       setShowQuestionForm(false); // Sembunyikan form setelah save
//     } catch (err) {
//       setFormMessage(`Gagal menyimpan soal: ${err.response?.data?.message || err.message}`);
//       setFormMessageType('danger');
//     }
//   };

//   const handleEditSoal = (soal) => {
//     setIsEditingQuestion(true);
//     setCurrentQuestion(soal);
//     if (soal.rawText && soal.rawText.includes('#') && soal.rawText.includes('--') && soal.rawText.includes('@')) {
//       setQuestionInputMode('raw');
//       setRawTextInput(soal.rawText);
//       setParsedPreview(soal.content);
//     } else {
//       setQuestionInputMode('structured');
//       setStructuredQuestionForm({
//         questionText: soal.content.questionText || '',
//         options: soal.content.options?.map(opt => opt.text) || ['', '', '', ''],
//         correctOptionId: soal.content.correctOptionId || 'a',
//         imageUrl: soal.content.imageUrl || '',
//         audioUrl: soal.content.audioUrl || '',
//         questionType: soal.questionType || 'TEXT'
//       });
//       setStructuredImageFile(null);
//       setStructuredAudioFile(null);
//       setParsedPreview(null);
//     }

//     setQuestionImageFile(null);
//     setQuestionImageUrlPreview(soal.content.imageUrl || '');

//     setQuestionFormMessage('');
//     setQuestionFormMessageType('');
//     setIsBatchMode(false);
//     setShowQuestionForm(true); // Tampilkan form saat edit
//   };

//   const handleDeleteSoal = async (questionId) => {
//     if (window.confirm(`Apakah Anda yakin ingin menghapus soal ini? ID: ${questionId.substring(0, 8)}...`)) {
//       setLoading(true);
//       setError(null);
//       try {
//         await apiClient.delete(`/questions/${questionId}`);
//         setQuestions(prevQuestions => prevQuestions.filter(q => q.id !== questionId));
//         alert(`Soal ${questionId.substring(0, 8)}... berhasil dihapus.`);
//         // Optional: Refresh totalQuestions count in active package
//         const updatedPackageData = await apiClient.get(`/exam-packages/${activePackageId}`);
//         setExamPackages(prevPackages => prevPackages.map(p => p.id === activePackageId ? updatedPackageData.data.data : p));
//       } catch (err) {
//         alert(`Gagal menghapus soal: ${err.response?.data?.message || 'Terjadi kesalahan.'}`);
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   // --- Handle CRUD Paket Ujian (Baru/Dimodifikasi) ---
//   const handleSelectPackage = (packageId, packageName, packageStatus) => {
//     setActivePackageId(packageId);
//     setActivePackageName(packageName);
//     setActivePackageStatus(packageStatus);
//     resetQuestionForm(); // Reset form soal saat ganti paket
//     setShowQuestionForm(false); // Sembunyikan form soal
//     setShowAddCategoryForm(false); // Sembunyikan form tambah kategori
//     setShowPackageForm(false); // Sembunyikan form tambah/edit paket
//   };

//   const handleAddPackageClick = () => {
//     resetPackageForm(); // Reset form paket
//     setShowPackageForm(true); // Tampilkan form paket
//     setShowQuestionForm(false); // Sembunyikan form soal
//     setShowAddCategoryForm(false); // Sembunyikan form kategori
//   };

//   const handleEditPackage = (pkg) => {
//     setIsEditingPackage(true);
//     setCurrentPackage(pkg);
//     setNewPackageName(pkg.name);
//     setNewPackageDescription(pkg.description || '');
//     setNewPackageDuration(pkg.durationMinutes || '');
//     setPackageFormMessage('');
//     setPackageFormMessageType('');
//     setShowPackageForm(true); // Tampilkan form
//     setShowQuestionForm(false);
//     setShowAddCategoryForm(false);
//   };

//   const handleSavePackage = async (event) => {
//     event.preventDefault();
//     setPackageFormMessage('');
//     setPackageFormMessageType('');

//     if (!activeFacultyId) {
//       setPackageFormMessage('Pilih fakultas terlebih dahulu.');
//       setPackageFormMessageType('danger');
//       return;
//     }
//     if (!newPackageName.trim()) {
//       setPackageFormMessage('Nama paket tidak boleh kosong.');
//       setPackageFormMessageType('danger');
//       return;
//     }

//     setLoading(true);
//     try {
//       const packageData = {
//         name: newPackageName,
//         description: newPackageDescription || null,
//         facultyId: activeFacultyId,
//         durationMinutes: newPackageDuration ? parseInt(newPackageDuration) : null,
//       };

//       let response;
//       if (isEditingPackage && currentPackage) {
//         response = await apiClient.put(`/exam-packages/${currentPackage.id}`, packageData);
//         setPackageFormMessage('Paket ujian berhasil diperbarui!');
//         setPackageFormMessageType('success');
//       } else {
//         response = await apiClient.post('/exam-packages', packageData);
//         setPackageFormMessage('Paket ujian berhasil ditambahkan!');
//         setPackageFormMessageType('success');
//       }

//       // Refresh daftar paket dan pilih paket yang baru/diedit
//       const updatedPackagesData = await apiClient.get(`/exam-packages?facultyId=${activeFacultyId}`);
//       setExamPackages(updatedPackagesData.data?.data || []);

//       const savedPackage = response.data.data;
//       setActivePackageId(savedPackage.id);
//       setActivePackageName(savedPackage.name);
//       setActivePackageStatus(savedPackage.status); // Update status dari paket yang baru disimpan

//       resetPackageForm();
//       setShowPackageForm(false); // Sembunyikan form setelah save
//     } catch (err) {
//       setPackageFormMessage(`Gagal menyimpan paket: ${err.response?.data?.message || 'Terjadi kesalahan.'}`);
//       setPackageFormMessageType('danger');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeletePackage = async (packageId) => {
//     if (window.confirm(`Apakah Anda yakin ingin menghapus paket ini? Ini akan menghapus SEMUA SOAL dan progres ujian yang terkait!`)) {
//       setLoading(true);
//       setError(null);
//       try {
//         await apiClient.delete(`/exam-packages/${packageId}`);
//         setExamPackages(prevPackages => prevPackages.filter(pkg => pkg.id !== packageId));
//         alert(`Paket ujian berhasil dihapus.`);
//         // Setelah delete, reset aktif paket jika yang dihapus adalah yang aktif
//         if (activePackageId === packageId) {
//           setActivePackageId(null);
//           setActivePackageName('');
//           setActivePackageStatus(null);
//           setQuestions([]); // Kosongkan soal
//           resetQuestionForm(); // Reset form soal
//           setShowQuestionForm(false); // Sembunyikan form soal
//         }
//       } catch (err) {
//         alert(`Gagal menghapus paket: ${err.response?.data?.message || 'Terjadi kesalahan.'}`);
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   const handleUpdatePackageStatus = async (packageId, newStatus) => {
//     let confirmMsg = '';
//     let alertSuccessMsg = '';

//     if (newStatus === 'PUBLISHED') {
//       confirmMsg = `Apakah Anda yakin ingin menerbitkan paket ini? ID: ${packageId.substring(0, 8)}...`;
//       alertSuccessMsg = `Paket ${packageId.substring(0, 8)}... berhasil diterbitkan.`;
//     } else if (newStatus === 'ARCHIVED') {
//       confirmMsg = `Apakah Anda yakin ingin mengarsipkan paket ini? ID: ${packageId.substring(0, 8)}...`;
//       alertSuccessMsg = `Paket ${packageId.substring(0, 8)}... berhasil diarsipkan.`;
//     } else if (newStatus === 'DRAFT') {
//       confirmMsg = `Apakah Anda yakin ingin mengembalikan paket ini ke status Draft? ID: ${packageId.substring(0, 8)}...`;
//       alertSuccessMsg = `Paket ${packageId.substring(0, 8)}... berhasil dikembalikan ke Draft.`;
//     }

//     if (window.confirm(confirmMsg)) {
//       setLoading(true);
//       setError(null);
//       try {
//         const response = await apiClient.put(`/exam-packages/${packageId}/status`, { status: newStatus });
//         const updatedPackage = response.data.data;
//         setExamPackages(prevPackages =>
//           prevPackages.map(pkg => pkg.id === packageId ? updatedPackage : pkg)
//         );
//         // Update status aktif jika ini paket yang sedang aktif
//         if (activePackageId === packageId) {
//           setActivePackageStatus(updatedPackage.status);
//         }
//         alert(alertSuccessMsg);
//       } catch (err) {
//         alert(`Gagal mengubah status paket: ${err.response?.data?.message || 'Terjadi kesalahan.'}`);
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   // --- Conditional Rendering for Initial States ---
//   if (loading && faculties.length === 0) {
//     return <div className="loading-state">Memuat kategori...</div>;
//   }
//   if (error) {
//     return <div className="error-state">Error: {error}</div>;
//   }
//   if (faculties.length === 0 && !loading && !activeFacultyId) {
//     return (
//       <div className="no-data-state">
//         <p>Tidak ada fakultas ditemukan. Silakan tambahkan satu.</p>
//         <button className="btn btn-primary mt-3" onClick={() => setShowAddCategoryForm(true)}>
//           <i className="material-icons">add</i> Tambah Fakultas Pertama
//         </button>
//       </div>
//     );
//   }

//   // --- Table Headers ---
//   const questionTableHeaders = [ // Ganti nama headers agar lebih spesifik
//     'No', 'Pertanyaan', 'A', 'B', 'C', 'D', 'Benar', 'Tipe', 'Aksi'
//   ];
//   const packageTableHeaders = [ // Header untuk tabel paket
//     'No', 'Nama Paket', 'Deskripsi', 'Durasi', 'Soal', 'Status', 'Aksi'
//   ];

//   // --- Render Component ---
//   return (
//     <div className="data-soal-page">
//       <h1 className="page-title">MENU MANAJEMEN SOAL & PAKET</h1> {/* Judul halaman baru */}

//       <div className="soal-content-layout">
//         {/* Sidebar Kategori */}
//         <aside className="categories-sidebar-card card">
//           <div className="card-header card-header-primary">
//             <h4 className="card-title">Kategori (Fakultas)</h4> {/* Judul sidebar baru */}
//           </div>
//           <div className="card-body">
//             <div className="category-list">
//               {faculties.map((faculty) => (
//                 <button
//                   key={faculty.id}
//                   className={`category-item-button ${activeFacultyId === faculty.id ? 'active' : ''}`}
//                   onClick={() => handleCategoryClick(faculty.id, faculty.name)}
//                 >
//                   {faculty.name}
//                 </button>
//               ))}
//               <button className="add-category-button" onClick={() => setShowAddCategoryForm(true)} title="Tambah Kategori Baru">
//                 <i className="material-icons">add</i>
//                 <span>Tambah Kategori</span>
//               </button>
//             </div>
//           </div>
//         </aside>

//         <section className="soal-table-section">
//           {/* Header Utama dengan Tombol Tambah Soal / Paket */}
//           <header className="active-category-display card">
//             <div className="card-header card-header-info">
//               <h4 className="card-title">
//                 {activeFacultyName ? `Paket Ujian untuk ${activeFacultyName}` : 'Pilih Kategori'}
//               </h4>
//             </div>
//             <div className="card-body d-flex justify-content-between align-items-center">
//               {loading && activeFacultyId && <div className="loading-status">Memuat data...</div>}
//               {activeFacultyId && (
//                 <button className="btn btn-primary" onClick={handleAddPackageClick} disabled={!activeFacultyId}>
//                   <i className="material-icons">add</i> Tambah Paket Baru
//                 </button>
//               )}
//             </div>
//           </header>

//           {/* Form Tambah Kategori (Inline) */}
//           {showAddCategoryForm && (
//             <div className="add-category-form-card card mb-4">
//               <div className="card-header card-header-primary">
//                 <h4 className="card-title">Tambah Kategori (Fakultas) Baru</h4>
//               </div>
//               <div className="card-body">
//                 {addCategoryMessage && (
//                   <div className={`alert alert-${addCategoryMessageType} alert-dismissible fade show`} role="alert">
//                     {addCategoryMessage}
//                     <button type="button" className="close" data-dismiss="alert" aria-label="Close" onClick={() => setAddCategoryMessage('')}>
//                       <span aria-hidden="true">&times;</span>
//                     </button>
//                   </div>
//                 )}
//                 <form onSubmit={handleAddCategorySubmit}>
//                   <div className="form-group">
//                     <label htmlFor="newCategoryName">Nama Kategori/Fakultas</label>
//                     <input
//                       type="text"
//                       id="newCategoryName"
//                       className="form-control"
//                       value={newCategoryName}
//                       onChange={(e) => setNewCategoryName(e.target.value)}
//                       placeholder="Contoh: Fakultas Ilmu Komputer"
//                       required
//                     />
//                   </div>
//                   <button type="submit" className="btn btn-primary">
//                     <i className="material-icons">add</i> Tambahkan Kategori
//                   </button>
//                   <button type="button" className="btn btn-warning ml-2" onClick={() => { setShowAddCategoryForm(false); setNewCategoryName(''); setAddCategoryMessage(''); }}>
//                     <i className="material-icons">cancel</i> Batal
//                   </button>
//                 </form>
//               </div>
//             </div>
//           )}

//           {/* Form Tambah/Edit Paket Ujian */}
//           {activeFacultyId && showPackageForm && (
//             <div className="soal-form-card card mb-4"> {/* Re-use soal-form-card for styling */}
//               <div className="card-header card-header-primary">
//                 <h4 className="card-title">{isEditingPackage ? `Edit Paket (ID: ${currentPackage?.id.substring(0, 8)}...)` : 'Tambah Paket Ujian Baru'}</h4>
//               </div>
//               <div className="card-body">
//                 {packageFormMessage && (
//                   <div className={`alert alert-${packageFormMessageType} alert-dismissible fade show`} role="alert">
//                     {packageFormMessage}
//                     <button type="button" className="close" data-dismiss="alert" aria-label="Close" onClick={() => setPackageFormMessage('')}>
//                       <span aria-hidden="true">&times;</span>
//                     </button>
//                   </div>
//                 )}
//                 <form onSubmit={handleSavePackage}>
//                   <div className="form-group">
//                     <label htmlFor="packageName">Nama Paket Ujian</label>
//                     <input
//                       type="text"
//                       id="packageName"
//                       className="form-control"
//                       value={newPackageName}
//                       onChange={(e) => setNewPackageName(e.target.value)}
//                       placeholder="Contoh: UTBK 2025 - Paket A"
//                       required
//                     />
//                   </div>
//                   <div className="form-group">
//                     <label htmlFor="packageDescription">Deskripsi Paket</label>
//                     <textarea
//                       id="packageDescription"
//                       className="form-control"
//                       rows="3"
//                       value={newPackageDescription}
//                       onChange={(e) => setNewPackageDescription(e.target.value)}
//                       placeholder="Deskripsi singkat tentang paket ujian ini..."
//                     ></textarea>
//                   </div>
//                   <div className="form-group">
//                     <label htmlFor="packageDuration">Durasi (Menit)</label>
//                     <input
//                       type="number"
//                       id="packageDuration"
//                       className="form-control"
//                       value={newPackageDuration}
//                       onChange={(e) => setNewPackageDuration(e.target.value)}
//                       placeholder="Contoh: 120"
//                       min="1"
//                     />
//                   </div>
//                   <button type="submit" className="btn btn-primary">
//                     <i className="material-icons">save</i> {isEditingPackage ? 'Simpan Perubahan Paket' : 'Tambahkan Paket'}
//                   </button>
//                   <button type="button" className="btn btn-warning ml-2" onClick={() => setShowPackageForm(false)}>
//                     <i className="material-icons">cancel</i> Batal
//                   </button>
//                 </form>
//               </div>
//             </div>
//           )}

//           {/* Tabel Paket Ujian */}
//           <div className="soal-table-card card mb-4">
//             <div className="card-header card-header-info">
//               <h4 className="card-title">Daftar Paket Ujian</h4>
//               <p className="card-category">{activeFacultyName ? `Untuk Fakultas ${activeFacultyName}` : 'Pilih Fakultas untuk melihat paket.'}</p>
//             </div>
//             <div className="card-body">
//               <div className="table-responsive">
//                 <table className="table">
//                   <thead>
//                     <tr>
//                       {packageTableHeaders.map((header, index) => (
//                         <th key={index}>{header}</th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {examPackages.length > 0 ? (
//                       examPackages.map((pkg, index) => (
//                         <tr key={pkg.id}
//                           className={activePackageId === pkg.id ? 'table-active-row' : ''} // Class untuk baris aktif
//                           onClick={() => handleSelectPackage(pkg.id, pkg.name, pkg.status)}> {/* Clickable row */}
//                           <td>{index + 1}</td>
//                           <td>{pkg.name}</td>
//                           <td>{pkg.description || '-'}</td>
//                           <td>{pkg.durationMinutes || '-'}</td>
//                           <td>{pkg.totalQuestions || 0}</td> {/* Tampilkan jumlah soal */}
//                           <td>
//                             <span className={`badge badge-${pkg.status === 'PUBLISHED' ? 'success' : pkg.status === 'DRAFT' ? 'warning' : 'danger'}`}>
//                               {pkg.status}
//                             </span>
//                           </td>
//                           <td className="action-cell">
//                             <button onClick={(e) => { e.stopPropagation(); handleEditPackage(pkg); }} className="action-button edit-button" title="Edit Paket">
//                               <i className="material-icons">edit</i>
//                             </button>
//                             {pkg.status === 'DRAFT' && (
//                               <button onClick={(e) => { e.stopPropagation(); handleUpdatePackageStatus(pkg.id, 'PUBLISHED'); }} className="action-button publish-button" title="Terbitkan Paket">
//                                 <i className="material-icons">cloud_upload</i>
//                               </button>
//                             )}
//                             {pkg.status === 'PUBLISHED' && (
//                               <button onClick={(e) => { e.stopPropagation(); handleUpdatePackageStatus(pkg.id, 'ARCHIVED'); }} className="action-button archive-button" title="Arsipkan Paket">
//                                 <i className="material-icons">archive</i>
//                               </button>
//                             )}
//                             {pkg.status === 'ARCHIVED' && (
//                               <button onClick={(e) => { e.stopPropagation(); handleUpdatePackageStatus(pkg.id, 'DRAFT'); }} className="action-button draft-button" title="Kembalikan ke Draft">
//                                 <i className="material-icons">unarchive</i>
//                               </button>
//                             )}
//                             <button onClick={(e) => { e.stopPropagation(); handleDeletePackage(pkg.id); }} className="action-button delete-button" title="Hapus Paket">
//                               <i className="material-icons">delete</i>
//                             </button>
//                           </td>
//                         </tr>
//                       ))
//                     ) : (
//                       <tr>
//                         <td colSpan={packageTableHeaders.length} className="text-center">
//                           Tidak ada paket ujian untuk "{activeFacultyName}".
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>

//           {/* Tabel Soal */}
//           {activePackageId && ( // Hanya tampilkan tabel soal jika ada paket aktif
//             <div className="soal-table-card card">
//               <div className="card-header card-header-info">
//                 <h4 className="card-title">Daftar Soal {activePackageName ? `(Paket: ${activePackageName})` : ''}</h4>
//                 <p className="card-category">Kelola soal-soal di paket ujian ini. Status paket: <span className={`badge badge-${activePackageStatus === 'PUBLISHED' ? 'success' : activePackageStatus === 'DRAFT' ? 'warning' : 'danger'}`}>{activePackageStatus}</span></p>
//               </div>
//               <div className="card-body">
//                 <div className="toolbar-top-right"> {/* Tambahkan toolbar di sini */}
//                   <button className="btn btn-primary" onClick={() => { resetQuestionForm(); setShowQuestionForm(true); }} disabled={!activePackageId}>
//                     <i className="material-icons">add</i> Tambah Soal Baru
//                   </button>
//                 </div>
//                 {/* Form Tambah/Edit Soal (dipindahkan ke sini) */}
//                 {showQuestionForm && (
//                   <div className="soal-form-card card mb-4">
//                     <div className="card-header card-header-primary">
//                       <h4 className="card-title">{isEditingQuestion ? `Edit Soal (ID: ${currentQuestion?.id.substring(0, 8)}...)` : 'Tambah Soal Baru'}</h4>
//                     </div>
//                     <div className="card-body">
//                       {questionFormMessage && (
//                         <div className={`alert alert-${questionFormMessageType} alert-dismissible fade show`} role="alert">
//                           {questionFormMessage}
//                           <button type="button" className="close" data-dismiss="alert" aria-label="Close" onClick={() => setQuestionFormMessage('')}>
//                             <span aria-hidden="true">&times;</span>
//                           </button>
//                         </div>
//                       )}

//                       {/* Pilihan Mode Input Soal (Raw Text vs Structured Form) */}
//                       {!isEditingQuestion && ( // Pilihan mode hanya untuk tambah soal baru
//                         <div className="form-group mb-3">
//                           <label>Pilih Mode Input Soal:</label>
//                           <div className="form-check form-check-inline">
//                             <input
//                               type="radio"
//                               id="rawMode"
//                               name="questionInputMode"
//                               className="form-check-input"
//                               value="raw"
//                               checked={questionInputMode === 'raw'}
//                               onChange={() => setQuestionInputMode('raw')}
//                             />
//                             <label className="form-check-label" htmlFor="rawMode">Raw Text (Batch)</label>
//                           </div>
//                           <div className="form-check form-check-inline">
//                             <input
//                               type="radio"
//                               id="structuredMode"
//                               name="questionInputMode"
//                               className="form-check-input"
//                               value="structured"
//                               checked={questionInputMode === 'structured'}
//                               onChange={() => setQuestionInputMode('structured')}
//                             />
//                             <label className="form-check-label" htmlFor="structuredMode">Formulir Terstruktur</label>
//                           </div>
//                         </div>
//                       )}

//                       {/* Form Input Raw Text (untuk Single atau Batch) */}
//                       {questionInputMode === 'raw' && (
//                         <form onSubmit={handleSaveQuestion}>
//                           <div className="form-group">
//                             <label htmlFor="rawTextInput">Raw Text Soal (Format: #Pertanyaan --OpsiA @a)</label>
//                             <textarea
//                               id="rawTextInput"
//                               className="form-control"
//                               rows="8"
//                               value={rawTextInput}
//                               onChange={(e) => setRawTextInput(e.target.value)}
//                               placeholder={isBatchMode ?
//                                 "Contoh Batch:\n# Soal 1\n-- A\n-- B\n@a\n\n# Soal 2\n-- X\n-- Y\n@x" :
//                                 "Contoh Single:\n# Apa ibukota Indonesia?\n-- Bandung\n-- Jakarta\n@b\n\n[IMG:data:image/png;base64,...]"
//                               }
//                               required
//                             ></textarea>
//                           </div>

//                           <div className="form-group form-check-inline">
//                             <input
//                               type="checkbox"
//                               className="form-check-input"
//                               id="isBatchModeCheckbox"
//                               checked={isBatchMode}
//                               onChange={(e) => setIsBatchMode(e.target.checked)}
//                               disabled={isEditingQuestion}
//                             />
//                             <label className="form-check-label" htmlFor="isBatchModeCheckbox">Mode Batch (Multiple Soal)</label>
//                           </div>

//                           {!isBatchMode && (
//                             <div className="form-group mt-3">
//                               <label htmlFor="questionImageUpload">Upload Gambar Soal (Opsional)</label>
//                               <input
//                                 type="file"
//                                 id="questionImageUpload"
//                                 className="form-control-file"
//                                 accept="image/*"
//                                 onChange={handleQuestionImageChange}
//                               />
//                               {questionImageUrlPreview && (
//                                 <img src={questionImageUrlPreview} alt="Preview Gambar Soal" className="img-thumbnail mt-2" style={{ maxWidth: '150px', maxHeight: '150px' }} />
//                               )}
//                               {isEditingQuestion && currentQuestion && currentQuestion.content.imageUrl && !questionImageUrlPreview && (
//                                 <p className="text-muted mt-2">Gambar saat ini: <img src={currentQuestion.content.imageUrl} alt="Gambar Soal Lama" className="img-thumbnail" style={{ maxWidth: '100px', maxHeight: '100px' }} /></p>
//                               )}
//                               {questionImageFile && (
//                                 <button type="button" className="btn btn-sm btn-outline-danger mt-2" onClick={() => { setQuestionImageFile(null); setQuestionImageUrlPreview(''); }}>
//                                   Hapus Gambar Baru
//                                 </button>
//                               )}
//                             </div>
//                           )}

//                           <button type="button" className="btn btn-info btn-sm" onClick={handlePreviewQuestion}>
//                             <i className="material-icons">visibility</i> Preview Soal
//                           </button>
//                           <button type="submit" className="btn btn-primary btn-sm ml-2" disabled={!activePackageId}> {/* Disabled jika tidak ada paket aktif */}
//                             <i className="material-icons">{isEditingQuestion ? 'save' : 'add'}</i> {isEditingQuestion ? 'Simpan Perubahan' : 'Tambahkan Soal'}
//                           </button>
//                           {(isEditingQuestion || showQuestionForm) && (
//                             <button type="button" className="btn btn-warning btn-sm ml-2" onClick={() => setShowQuestionForm(false)}>
//                               <i className="material-icons">cancel</i> Batal
//                             </button>
//                           )}
//                         </form>
//                       )} {/* End of Raw Text Form */}

//                       {/* Form Input Terstruktur */}
//                       {questionInputMode === 'structured' && ( // Tampilkan ini jika mode structured
//                         <form onSubmit={handleSaveQuestion}> {/* Submit handleStructuredSaveQuestion */}
//                           <div className="form-group">
//                             <label htmlFor="structuredQuestionText">Pertanyaan</label>
//                             <textarea
//                               id="structuredQuestionText"
//                               name="questionText"
//                               className="form-control"
//                               rows="4"
//                               value={structuredQuestionForm.questionText}
//                               onChange={handleStructuredFormChange}
//                               placeholder="Tulis teks pertanyaan di sini..."
//                               required
//                             ></textarea>
//                           </div>

//                           <div className="form-group">
//                             <label>Tipe Soal:</label>
//                             <div className="form-check form-check-inline">
//                               <input type="radio" id="typeText" name="questionType" className="form-check-input" value="TEXT" checked={structuredQuestionForm.questionType === 'TEXT'} onChange={handleStructuredFormChange} />
//                               <label className="form-check-label" htmlFor="typeText">Teks</label>
//                             </div>
//                             <div className="form-check form-check-inline">
//                               <input type="radio" id="typeImage" name="questionType" className="form-check-input" value="IMAGE" checked={structuredQuestionForm.questionType === 'IMAGE'} onChange={handleStructuredFormChange} />
//                               <label className="form-check-label" htmlFor="typeImage">Gambar</label>
//                             </div>
//                             <div className="form-check form-check-inline">
//                               <input type="radio" id="typeAudio" name="questionType" className="form-check-input" value="AUDIO" checked={structuredQuestionForm.questionType === 'AUDIO'} onChange={handleStructuredFormChange} />
//                               <label className="form-check-label" htmlFor="typeAudio">Audio</label>
//                             </div>
//                           </div>

//                           {(structuredQuestionForm.questionType === 'IMAGE') && (
//                             <div className="form-group">
//                               <label htmlFor="structuredImageUpload">Upload Gambar Soal</label>
//                               <input type="file" id="structuredImageUpload" className="form-control-file" accept="image/*" onChange={handleQuestionImageChange} />
//                               {structuredQuestionForm.imageUrl && (
//                                 <img src={structuredQuestionForm.imageUrl} alt="Preview Gambar" className="img-thumbnail mt-2" style={{ maxWidth: '150px', maxHeight: '150px' }} />
//                               )}
//                               {structuredImageFile && (
//                                 <button type="button" className="btn btn-sm btn-outline-danger mt-2" onClick={() => { setStructuredImageFile(null); setStructuredQuestionForm(prev => ({ ...prev, imageUrl: '' })); }}>Hapus Gambar</button>
//                               )}
//                             </div>
//                           )}

//                           {(structuredQuestionForm.questionType === 'AUDIO') && (
//                             <div className="form-group">
//                               <label htmlFor="structuredAudioUpload">Upload Audio Soal</label>
//                               <input type="file" id="structuredAudioUpload" className="form-control-file" accept="audio/*" onChange={handleStructuredAudioChange} />
//                               {structuredQuestionForm.audioUrl && (
//                                 <audio controls src={structuredQuestionForm.audioUrl} className="mt-2" style={{ width: '100%' }}></audio>
//                               )}
//                               {structuredAudioFile && (
//                                 <button type="button" className="btn btn-sm btn-outline-danger mt-2" onClick={() => { setStructuredAudioFile(null); setStructuredQuestionForm(prev => ({ ...prev, audioUrl: '' })); }}>Hapus Audio</button>
//                               )}
//                             </div>
//                           )}

//                           {structuredQuestionForm.options.map((optionText, index) => (
//                             <div className="input-group mb-2" key={index}>
//                               <div className="input-group-prepend">
//                                 <span className="input-group-text">{String.fromCharCode(65 + index)}.</span>
//                               </div>
//                               <input
//                                 type="text"
//                                 name={`option-${index}`}
//                                 className="form-control"
//                                 placeholder={`Opsi Jawaban ${String.fromCharCode(65 + index)}`}
//                                 value={optionText}
//                                 onChange={handleStructuredFormChange}
//                                 required={index < 2} // Minimal 2 opsi wajib
//                               />
//                             </div>
//                           ))}

//                           <div className="form-group mt-3">
//                             <label htmlFor="correctOptionId">Jawaban Benar:</label>
//                             <select
//                               id="correctOptionId"
//                               name="correctOptionId"
//                               className="form-control"
//                               value={structuredQuestionForm.correctOptionId}
//                               onChange={handleStructuredFormChange}
//                               required
//                             >
//                               {structuredQuestionForm.options.filter(opt => opt.trim() !== '').map((_, index) => (
//                                 <option key={index} value={String.fromCharCode(97 + index)}>
//                                   {String.fromCharCode(65 + index)}
//                                 </option>
//                               ))}
//                             </select>
//                           </div>

//                           <button type="submit" className="btn btn-primary btn-sm" disabled={!activePackageId}> {/* Disabled jika tidak ada paket aktif */}
//                             <i className="material-icons">add</i> Tambahkan Soal
//                           </button>
//                           <button type="button" className="btn btn-warning btn-sm ml-2" onClick={() => setShowQuestionForm(false)}>
//                             <i className="material-icons">cancel</i> Batal
//                           </button>
//                         </form>
//                       )} {/* End of Structured Form */}

//                       {/* Tampilan Preview Soal (tetap sama) */}
//                       {parsedPreview && (
//                         <div className="preview-section mt-4 card">
//                           <div className="card-header card-header-info">
//                             <h5 className="card-title">Preview Soal{questionInputMode === 'raw' && isBatchMode ? ' (Batch)' : ''}</h5>
//                           </div>
//                           <div className="card-body">
//                             {Array.isArray(parsedPreview) ? (
//                               parsedPreview.map((singleParsed, idx) => (
//                                 <div key={idx} className="mb-3 p-2 border rounded">
//                                   <h6>Soal #{idx + 1}</h6>
//                                   <p><strong>Pertanyaan:</strong> {singleParsed.questionText}</p>
//                                   {singleParsed.imageUrl && <img src={singleParsed.imageUrl} alt={`Preview Image Soal ${idx + 1}`} className="question-image-thumb" />}
//                                   {singleParsed.audioUrl && (
//                                     <audio controls className="question-audio-thumb">
//                                       <source src={singleParsed.audioUrl} type="audio/mpeg" />
//                                       Browser Anda tidak mendukung elemen audio.
//                                     </audio>
//                                   )}
//                                   <p><strong>Opsi:</strong></p>
//                                   <ul>
//                                     {singleParsed.options.map(opt => (
//                                       <li key={opt.id}>{opt.id.toUpperCase()}. {opt.text}</li>
//                                     ))}
//                                   </ul>
//                                   <p><strong>Jawaban Benar:</strong> {singleParsed.correctOptionId ? singleParsed.correctOptionId.toUpperCase() : '-'}</p>
//                                   <p><strong>Tipe:</strong> {singleParsed.questionType}</p>
//                                 </div>
//                               ))
//                             ) : (
//                               <>
//                                 <p><strong>Pertanyaan:</strong> {parsedPreview.questionText}</p>
//                                 {parsedPreview.imageUrl && <img src={parsedPreview.imageUrl} alt="Preview Image" className="question-image-thumb" />}
//                                 {parsedPreview.audioUrl && (
//                                   <audio controls className="question-audio-thumb">
//                                     <source src={parsedPreview.audioUrl} type="audio/mpeg" />
//                                     Browser Anda tidak mendukung elemen audio.
//                                   </audio>
//                                 )}
//                                 <p><strong>Opsi:</strong></p>
//                                 <ul>
//                                   {parsedPreview.options.map(opt => (
//                                     <li key={opt.id}>{opt.id.toUpperCase()}. {opt.text}</li>
//                                   ))}
//                                 </ul>
//                                 <p><strong>Jawaban Benar:</strong> {parsedPreview.correctOptionId ? parsedPreview.correctOptionId.toUpperCase() : '-'}</p>
//                                 <p><strong>Tipe Soal:</strong> {parsedPreview.questionType}</p>
//                               </>
//                             )}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {/* Tabel Soal */}
//                 {activePackageId && ( // Hanya tampilkan tabel soal jika ada paket aktif
//                   <div className="soal-table-card card">
//                     <div className="card-header card-header-info">
//                       <h4 className="card-title">Daftar Soal {activePackageName ? `(Paket: ${activePackageName})` : ''}</h4>
//                       <p className="card-category">Kelola soal-soal di paket ujian ini. Status paket: <span className={`badge badge-${activePackageStatus === 'PUBLISHED' ? 'success' : activePackageStatus === 'DRAFT' ? 'warning' : 'danger'}`}>{activePackageStatus}</span></p>
//                     </div>
//                     <div className="card-body">
//                       <div className="table-responsive">
//                         <table className="table">
//                           <thead>
//                             <tr>
//                               {questionTableHeaders.map((header, index) => (
//                                 <th key={index}>{header}</th>
//                               ))}
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {questions.length > 0 ? (
//                               questions.map((soal, index) => (
//                                 <tr key={soal.id}>
//                                   <td>{index + 1}</td>
//                                   <td>
//                                     {soal.content.questionText}
//                                     {soal.content.imageUrl && (
//                                       <img src={soal.content.imageUrl} alt="Gambar Soal" className="question-image-thumb" />
//                                     )}
//                                     {soal.content.audioUrl && (
//                                       <audio controls className="question-audio-thumb" aria-label="Audio Soal">
//                                         <source src={soal.content.audioUrl} type="audio/mpeg" />
//                                         Browser Anda tidak mendukung elemen audio.
//                                       </audio>
//                                     )}
//                                   </td>
//                                   <td>{getOptionText(soal.content.options, 'a')}</td>
//                                   <td>{getOptionText(soal.content.options, 'b')}</td>
//                                   <td>{getOptionText(soal.content.options, 'c')}</td>
//                                   <td>{getOptionText(soal.content.options, 'd')}</td>
//                                   <td>{getCorrectOptionLetter(soal.content)}</td>
//                                   <td>{soal.questionType}</td>
//                                   <td>
//                                     {/* Status soal kini diambil dari paket aktif */}
//                                     <span className={`badge badge-${activePackageStatus === 'PUBLISHED' ? 'success' : activePackageStatus === 'DRAFT' ? 'warning' : 'danger'}`}>
//                                       {soal.examPackage?.status || 'N/A'} {/* Mengambil status dari paket terkait */}
//                                     </span>
//                                   </td>
//                                   <td className="action-cell">
//                                     <button onClick={() => handleEditSoal(soal)} className="action-button edit-button" title="Edit Soal">
//                                       <i className="material-icons">edit</i>
//                                     </button>

//                                     {/* Tombol Aksi Status Soal (DIHAPUS DARI SINI, KARENA STATUS DIURUS OLEH PAKET) */}
//                                     {/* Hanya tombol delete yang tersisa */}
//                                     <button onClick={() => handleDeleteSoal(soal.id)} className="action-button delete-button" title="Hapus Soal">
//                                       <i className="material-icons">delete</i>
//                                     </button>
//                                   </td>
//                                 </tr>
//                               ))
//                             ) : (
//                               <tr>
//                                 <td colSpan={questionTableHeaders.length} className="text-center">
//                                   Tidak ada soal untuk paket "{activePackageName}".
//                                 </td>
//                               </tr>
//                             )}
//                           </tbody>
//                         </table>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//     </section>
//   </div>
// </div>
//   );
// };

// export default DataSoalPage;
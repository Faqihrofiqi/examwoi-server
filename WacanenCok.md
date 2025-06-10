# Examwoi Hybrid LMS (Sistem Simulasi Ujian Hybrid)

Selamat datang di proyek **Examwoi Hybrid LMS**! Repositori ini mencakup backend API berbasis **Express.js** dan frontend dashboard admin berbasis **React.js**, untuk mendukung sistem simulasi ujian hybrid (online & offline) bagi institusi pendidikan.

## 📋 Daftar Isi
- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Setup Backend (examwoi-api)](#setup-backend-examwoi-api)
- [Setup Frontend (examwoi-frontend)](#setup-frontend-examwoi-frontend)
- [Integrasi dan Pengujian](#integrasi-dan-pengujian)
- [Testing API (Opsional)](#testing-api-opsional)
- [Panduan Login Admin](#panduan-login-admin)
- [Kontak](#kontak)

## 📚 Tentang Proyek
**Examwoi** adalah sistem **LMS hybrid** yang dirancang untuk membantu siswa mempersiapkan diri menghadapi ujian masuk perguruan tinggi. Aplikasi ini mendukung skenario ujian online maupun offline dan dapat dikustomisasi (white-label) oleh institusi.

## 🚀 Fitur Utama

### Backend (Express.js, PostgreSQL, Prisma)
- Autentikasi lengkap (Register, Login, OTP, Reset Password, JWT)
- Manajemen user dan role (Admin, Guru, Siswa)
- CRUD data fakultas dan soal ujian
- Dukungan soal teks, gambar, audio (dengan Base64)
- Draft → Publish → Archive lifecycle soal
- Sinkronisasi progres ujian siswa (untuk mobile app)
- Konfigurasi dinamis (privacy policy, nama app, banner, background)
- Keamanan: Password hashing, rate limit OTP, validasi ketat

### Frontend Admin (React.js, Bootstrap 5, Material Dashboard)
- Dashboard admin: Kelola user, soal, dan konfigurasi aplikasi
- Autentikasi lengkap (login, register, OTP, reset password)
- Input soal via raw text atau formulir (support batch & media upload)
- Manajemen kategori/fakultas (inline form)
- Preview soal dan status (Draft, Published, Archived)
- Dynamic navbar (nama app & sapaan admin)

## 💻 Persyaratan Sistem
Pastikan sistem Anda memiliki:
- Node.js (v18+ disarankan Node.js 20)
- npm
- PostgreSQL
- Akun SMTP2GO (untuk OTP email)

## 🔧 Setup Backend (api)
1. Jalankan `npm install`
2. Buat file `.env` berdasarkan `.env.example`
3. Migrasikan dan seed database:
   - `npx prisma migrate dev --name init_database_schema`
   - `npx prisma generate`
   - `npm run prisma:seed`
4. Jalankan server dengan `npm run dev`

## 🎨 Setup Frontend (examwoi-frontend)
1. Jalankan `npm install`
2. Buat file `.env` berdasarkan `.env.example`
3. Jalankan aplikasi React dengan `npm start`

## 🔄 Integrasi dan Pengujian
1. Jalankan backend (`npm run dev`)
2. Jalankan frontend (`npm start`)
3. Akses dashboard di: [http://localhost:3001/admin/login](http://localhost:3001/admin/login)
4. Login sebagai admin dan uji:
   - Navigasi halaman soal dan user
   - Tambah/edit soal (media, batch, raw)
   - Kelola user dan kategori
   - Edit konten dokumen & upload banner/background

## 🧪 Testing API (Opsional)
- Gunakan ekstensi VS Code **REST Client**
- Buat file `.http` atau `.rest` untuk menguji endpoint secara langsung

## 🔐 Panduan Login Admin
Gunakan akun default hasil seeding:

| Role     | Email                 | Password   |
|----------|-----------------------|------------|
| Admin    | admin@examwoi.com     | admin123   |
| Teacher  | teacher@examwoi.com   | teacher123 |
| Student  | student@examwoi.com   | student123 |

## 📬 Kontak
Jika ada pertanyaan atau butuh bantuan, silakan hubungi pengelola proyek ini melalui email atau issue tracker pada repositori.

---

> Dibuat dengan ❤️ oleh tim pengembang Examwoi.
© 2025 | 21sa1077@mhs.amikompruwokerto.ac.id | bagusprz10
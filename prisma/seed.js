const { PrismaClient, Role, Status, PackageStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai proses seeding...');

  // --- 1. Hapus Semua Data yang Ada (Destructive Operation) ---
  console.log('Menghapus data lama...');
  try {
    await prisma.$transaction([
      prisma.examProgress.deleteMany(),
      prisma.question.deleteMany(),
      prisma.examPackage.deleteMany(),
      prisma.faculty.deleteMany(),
      prisma.otpRequestLog.deleteMany(),
      prisma.user.deleteMany(),
      prisma.appConfig.deleteMany(),
    ]);
    console.log('Data lama berhasil dihapus.');
  } catch (e) {
    console.error('Gagal menghapus data lama (mungkin karena tabel belum ada, ini normal di run pertama):', e.message);
  }

  // --- 2. Hashing Passwords ---
  const adminPassword = await bcrypt.hash('admin123', 10);
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  // --- 3. Create Users ---
  const adminUser = await prisma.user.create({
    data: {
      name: 'admin',
      email: 'admin@examwoi.com',
      password: adminPassword,
      username: 'Admin Examwoi',
      role: Role.ADMIN,
      isVerified: true,
      phone: '081111111111',
      dateOfBirth: new Date('1990-01-01T00:00:00Z'),
      kabupaten: 'Purwokerto',
      profinsi: 'Jawa Tengah',
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  const teacherUser = await prisma.user.create({
    data: {
      name: 'teacher',
      email: 'teacher@examwoi.com',
      password: teacherPassword,
      username: 'Guru Pengajar',
      role: Role.TEACHER,
      isVerified: true,
      phone: '082222222222',
      dateOfBirth: new Date('1985-05-10T00:00:00Z'),
      kabupaten: 'Bandung',
      profinsi: 'Jawa Barat',
    },
  });
  console.log(`Created teacher user: ${teacherUser.email}`);

  const studentUser = await prisma.user.create({
    data: {
      name: 'student',
      email: 'student@examwoi.com',
      password: studentPassword,
      username: 'Siswa Contoh',
      role: Role.STUDENT,
      isVerified: true,
      phone: '083333333333',
      dateOfBirth: new Date('2003-11-20T00:00:00Z'),
      kabupaten: 'Surabaya',
      profinsi: 'Jawa Timur',
    },
  });
  console.log(`Created student user: ${studentUser.email}`);

  // --- 4. Create Faculties ---
  const fkip = await prisma.faculty.create({
    data: {
      name: 'Fakultas Keguruan dan Ilmu Pendidikan',
      description: 'Fakultas ini mendidik calon guru dan peneliti di bidang pendidikan.',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    },
  });
  console.log(`Created faculty: ${fkip.name}`);

  const fteknik = await prisma.faculty.create({
    data: {
      name: 'Fakultas Teknik',
      description: 'Mendidik insinyur profesional di berbagai disiplin ilmu teknik.',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    },
  });
  console.log(`Created faculty: ${fteknik.name}`);

  const fkedokteran = await prisma.faculty.create({
    data: {
      name: 'Fakultas Kedokteran',
      description: 'Fakultas yang mendidik calon dokter dan ahli kesehatan profesional.',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    },
  });
  console.log(`Created faculty: ${fkedokteran.name}`);

  const fkomputer = await prisma.faculty.create({
    data: {
      name: 'Fakultas Ilmu Komputer',
      description: 'Fakultas untuk mendidik ahli di bidang teknologi informasi dan komputasi.',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    },
  });
  console.log(`Created faculty: ${fkomputer.name}`);

  // --- 5. Create Exam Packages ---
  const fkipPackage1 = await prisma.examPackage.create({
    data: {
      name: 'UTBK - FKIP Paket A',
      description: 'Paket soal simulasi UTBK untuk Fakultas Keguruan dan Ilmu Pendidikan.',
      facultyId: fkip.id,
      status: PackageStatus.PUBLISHED, // Untuk testing published package
      publishedAt: new Date(),
      durationMinutes: 120,
      totalQuestions: 0
    },
  });
  console.log(`Created exam package: ${fkipPackage1.name}`);

  const fteknikPackage1 = await prisma.examPackage.create({
    data: {
      name: 'UTBK - Teknik Paket 1',
      description: 'Simulasi ujian teknik dasar.',
      facultyId: fteknik.id,
      status: PackageStatus.PUBLISHED,
      publishedAt: new Date(),
      durationMinutes: 90,
      totalQuestions: 0
    },
  });
  console.log(`Created exam package: ${fteknikPackage1.name}`);

  const fkedokteranPackage1 = await prisma.examPackage.create({
    data: {
      name: 'UTBK - Kedokteran Sesi 1',
      description: 'Simulasi ujian Kedokteran.',
      facultyId: fkedokteran.id,
      status: PackageStatus.DRAFT, // Untuk testing draft package
      publishedAt: null,
      durationMinutes: 100,
      totalQuestions: 0
    },
  });
  console.log(`Created exam package: ${fkedokteranPackage1.name}`);

  const fkomputerPackage1 = await prisma.examPackage.create({
    data: {
      name: 'UTBK - Ilmu Komputer Paket Dasar',
      description: 'Paket dasar untuk calon mahasiswa Ilmu Komputer.',
      facultyId: fkomputer.id,
      status: PackageStatus.PUBLISHED,
      publishedAt: new Date(),
      durationMinutes: 120,
      totalQuestions: 0
    },
  });
  console.log(`Created exam package: ${fkomputerPackage1.name}`);

  // --- 6. Create Questions and Assign to Exam Packages ---
  // Pastikan Question model TIDAK memiliki `status` dan `publishedAt` di prisma/schema.prisma

  // Questions for FKIP Package 1
  const fkipQuestionsData = [
    {
      rawText: '# Pedagogi adalah ilmu tentang?\n-- Anak-anak\n-- Belajar\n-- Mengajar\n-- Kurikulum\n@c',
      content: { questionText: 'Pedagogi adalah ilmu tentang?', options: [{ id: 'a', text: 'Anak-anak' }, { id: 'b', text: 'Belajar' }, { id: 'c', text: 'Mengajar' }, { id: 'd', text: 'Kurikulum' }], correctOptionId: 'c', questionType: 'TEXT' },
      questionType: 'TEXT',
      examPackageId: fkipPackage1.id,
      // status: Status.PUBLISHED, // <-- DIHAPUS
      // publishedAt: new Date(), // <-- DIHAPUS
    },
    {
      rawText: '# Apa singkatan dari PPL?\n-- Praktik Pengalaman Lapangan\n-- Pendidikan Profesi Lanjut\n-- Program Pelatihan Lapangan\n-- Pedoman Pengajaran Lanjutan\n@a',
      content: { questionText: 'Apa singkatan dari PPL?', options: [{ id: 'a', text: 'Praktik Pengalaman Lapangan' }, { id: 'b', text: 'Pendidikan Profesi Lanjut' }, { id: 'c', text: 'Program Pelatihan Lapangan' }, { id: 'd', text: 'Pedoman Pengajaran Lanjutan' }], correctOptionId: 'a', questionType: 'TEXT' },
      questionType: 'TEXT',
      examPackageId: fkipPackage1.id,
      // status: Status.DRAFT, // <-- DIHAPUS
      // publishedAt: null, // <-- DIHAPUS
    }
  ];
  const fkipQuestionResult = await prisma.question.createMany({ data: fkipQuestionsData });
  console.log(`Created ${fkipQuestionResult.count} questions for ${fkipPackage1.name}`);
  await prisma.examPackage.update({
    where: { id: fkipPackage1.id },
    data: { totalQuestions: { increment: fkipQuestionResult.count } }
  });

  // Questions for Fakultas Teknik Package 1
  const fteknikQuestionsData = [
    {
      rawText: '# Berikut adalah simbol dari komponen elektronik apa?\n[IMG:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=]\n-- Resistor\n-- Kapasitor\n-- Induktor\n-- Dioda\n@a',
      content: { questionText: 'Berikut adalah simbol dari komponen elektronik apa?', imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', options: [{ id: 'a', text: 'Resistor' }, { id: 'b', text: 'Kapasitor' }, { id: 'c', text: 'Induktor' }, { id: 'd', text: 'Dioda' }], correctOptionId: 'a', questionType: 'IMAGE' },
      questionType: 'IMAGE',
      examPackageId: fteknikPackage1.id,
      // status: Status.PUBLISHED, // <-- DIHAPUS
      // publishedAt: new Date(), // <-- DIHAPUS
    },
    {
      rawText: '# Hukum Ohm menyatakan hubungan antara tegangan (V), arus (I), dan hambatan (R) sebagai?\n-- V = I * R\n-- I = V * R\n-- R = V * I\n-- V = I / R\n@a',
      content: { questionText: 'Hukum Ohm menyatakan hubungan antara tegangan (V), arus (I), dan hambatan (R) sebagai?', options: [{ id: 'a', text: 'V = I * R' }, { id: 'b', text: 'I = V * R' }, { id: 'c', text: 'R = V * I' }, { id: 'd', text: 'V = I / R' }], correctOptionId: 'a', questionType: 'TEXT' },
      questionType: 'TEXT',
      examPackageId: fteknikPackage1.id,
      // status: Status.PUBLISHED, // <-- DIHAPUS
      // publishedAt: new Date(), // <-- DIHAPUS
    }
  ];
  const fteknikQuestionResult = await prisma.question.createMany({ data: fteknikQuestionsData });
  console.log(`Created ${fteknikQuestionResult.count} questions for ${fteknikPackage1.name}`);
  await prisma.examPackage.update({
    where: { id: fteknikPackage1.id },
    data: { totalQuestions: { increment: fteknikQuestionResult.count } }
  });

  // Questions for Fakultas Kedokteran Package 1 (Sample, will be DRAFT package)
  const fkedokteranQuestionsData = [
    {
      rawText: '# Organ tubuh yang berfungsi memompa darah adalah?\n-- Paru-paru\n-- Ginjal\n-- Jantung\n-- Hati\n@c',
      content: { questionText: 'Organ tubuh yang berfungsi memompa darah adalah?', options: [{ id: 'a', text: 'Paru-paru' }, { id: 'b', text: 'Ginjal' }, { id: 'c', text: 'Jantung' }, { id: 'd', text: 'Hati' }], correctOptionId: 'c', questionType: 'TEXT' },
      questionType: 'TEXT',
      examPackageId: fkedokteranPackage1.id,
      // status: Status.DRAFT, // <-- DIHAPUS
      // publishedAt: null, // <-- DIHAPUS
    }
  ];
  const fkedokteranQuestionResult = await prisma.question.createMany({ data: fkedokteranQuestionsData });
  console.log(`Created ${fkedokteranQuestionResult.count} questions for ${fkedokteranPackage1.name}`);
  await prisma.examPackage.update({
    where: { id: fkedokteranPackage1.id },
    data: { totalQuestions: { increment: fkedokteranQuestionResult.count } }
  });

  // Questions for Fakultas Ilmu Komputer Package 1
  const fkomputerQuestionsData = [
    { rawText: '# Apa kepanjangan dari CPU?\n-- Central Processing Unit\n-- Central Program Unit\n-- Computer Personal Unit\n-- Control Processing Unit\n@a', content: { questionText: 'Apa kepanjangan dari CPU?', options: [{ id: 'a', text: 'Central Processing Unit' }, { id: 'b', text: 'Central Program Unit' }, { id: 'c', text: 'Computer Personal Unit' }, { id: 'd', text: 'Control Processing Unit' }], correctOptionId: 'a', questionType: 'TEXT' }, questionType: 'TEXT', examPackageId: fkomputerPackage1.id },
    { rawText: '# Bahasa pemrograman apa yang paling sering digunakan untuk pengembangan web sisi klien (frontend)?\n-- Python\n-- Java\n-- JavaScript\n-- C++\n@c', content: { questionText: 'Bahasa pemrograman apa yang paling sering digunakan untuk pengembangan web sisi klien (frontend)?', options: [{ id: 'a', text: 'Python' }, { id: 'b', text: 'Java' }, { id: 'c', text: 'JavaScript' }, { id: 'd', text: 'C++' }], correctOptionId: 'c', questionType: 'TEXT' }, questionType: 'TEXT', examPackageId: fkomputerPackage1.id },
    { rawText: '# Apa nama komponen hardware yang berfungsi sebagai "otak" komputer?\n-- RAM\n-- Hard Drive\n-- Motherboard\n-- Processor\n@d', content: { questionText: 'Apa nama komponen hardware yang berfungsi sebagai "otak" komputer?', options: [{ id: 'a', text: 'RAM' }, { id: 'b', text: 'Hard Drive' }, { id: 'c', text: 'Motherboard' }, { id: 'd', text: 'Processor' }], correctOptionId: 'd', questionType: 'TEXT' }, questionType: 'TEXT', examPackageId: fkomputerPackage1.id },
    { rawText: '# Struktur data yang mengikuti prinsip LIFO (Last In, First Out) adalah?\n-- Queue\n-- Stack\n-- Linked List\n-- Tree\n@b', content: { questionText: 'Struktur data yang mengikuti prinsip LIFO (Last In, First Out) adalah?', options: [{ id: 'a', text: 'Queue' }, { id: 'b', text: 'Stack' }, { id: 'c', text: 'Linked List' }, { id: 'd', text: 'Tree' }], correctOptionId: 'b', questionType: 'TEXT' }, questionType: 'TEXT', examPackageId: fkomputerPackage1.id },
    { rawText: '# Perintah dasar untuk menginstal paket di Node.js menggunakan npm adalah?\n-- npm install\n-- npm add\n-- npm get\n-- npm run\n@a', content: { questionText: 'Perintah dasar untuk menginstal paket di Node.js menggunakan npm adalah?', options: [{ id: 'a', text: 'npm install' }, { id: 'b', text: 'npm add' }, { id: 'c', text: 'npm get' }, { id: 'd', text: 'npm run' }], correctOptionId: 'a', questionType: 'TEXT' }, questionType: 'TEXT', examPackageId: fkomputerPackage1.id },
    { rawText: '# Database yang menyimpan data dalam bentuk tabel dengan baris dan kolom disebut database?\n-- NoSQL\n-- Graph\n-- Relasional\n-- Dokumen\n@c', content: { questionText: 'Database yang menyimpan data dalam bentuk tabel dengan baris dan kolom disebut database?', options: [{ id: 'a', text: 'NoSQL' }, { id: 'b', text: 'Graph' }, { id: 'c', text: 'Relasional' }, { id: 'd', text: 'Dokumen' }], correctOptionId: 'c', questionType: 'TEXT' }, questionType: 'TEXT', examPackageId: fkomputerPackage1.id },
    { rawText: '# Apa tujuan utama dari firewall dalam jaringan komputer?\n-- Mempercepat koneksi internet\n-- Melindungi dari serangan siber yang tidak sah\n-- Menyimpan cadangan data\n-- Mengelola alamat IP\n@b', content: { questionText: 'Apa tujuan utama dari firewall dalam jaringan komputer?', options: [{ id: 'a', text: 'Mempercepat koneksi internet' }, { id: 'b', text: 'Melindungi dari serangan siber yang tidak sah' }, { id: 'c', text: 'Menyimpan cadangan data' }, { id: 'd', text: 'Mengelola alamat IP' }], correctOptionId: 'b', questionType: 'TEXT' }, questionType: 'TEXT', examPackageId: fkomputerPackage1.id },
    { rawText: '# Algoritma pengurutan yang membagi list menjadi dua bagian dan mengurutkan secara rekursif disebut?\n-- Bubble Sort\n-- Insertion Sort\n-- Merge Sort\n-- Selection Sort\n@c', content: { questionText: 'Algoritma pengurutan yang membagi list menjadi dua bagian dan mengurutkan secara rekursif disebut?', options: [{ id: 'a', text: 'Bubble Sort' }, { id: 'b', text: 'Insertion Sort' }, { id: 'c', text: 'Merge Sort' }, { id: 'd', text: 'Selection Sort' }], correctOptionId: 'c', questionType: 'TEXT' }, questionType: 'TEXT', examPackageId: fkomputerPackage1.id },
    { rawText: '# Protokol yang digunakan untuk mentransfer halaman web di internet adalah?\n-- FTP\n-- SMTP\n-- HTTP\n-- TCP\n@c', content: { questionText: 'Protokol yang digunakan untuk mentransfer halaman web di internet adalah?', options: [{ id: 'a', text: 'FTP' }, { id: 'b', text: 'SMTP' }, { id: 'c', text: 'HTTP' }, { id: 'd', text: 'TCP' }], correctOptionId: 'c', questionType: 'TEXT' }, questionType: 'TEXT', examPackageId: fkomputerPackage1.id },
    { rawText: '# Apa kepanjangan dari RAM pada komputer?\n-- Read Access Memory\n-- Random Access Memory\n-- Read Only Memory\n-- Rapid Access Memory\n@b', content: { questionText: 'Apa kepanjangan dari RAM pada komputer?', options: [{ id: 'a', text: 'Read Access Memory' }, { id: 'b', text: 'Random Access Memory' }, { id: 'c', text: 'Read Only Memory' }, { id: 'd', text: 'Rapid Access Memory' }], correctOptionId: 'b', questionType: 'TEXT' }, questionType: 'TEXT', examPackageId: fkomputerPackage1.id }
  ];
  const fkomputerQuestionResult = await prisma.question.createMany({ data: fkomputerQuestionsData });
  console.log(`Created ${fkomputerQuestionResult.count} questions for ${fkomputerPackage1.name}`);
  await prisma.examPackage.update({
    where: { id: fkomputerPackage1.id },
    data: { totalQuestions: { increment: fkomputerQuestionResult.count } }
  });

  // --- Create Initial AppConfig entries ---
  await prisma.appConfig.upsert({
    where: { key: 'APP_NAME' },
    update: {},
    create: { key: 'APP_NAME', value: 'Examwoi App', description: 'The main application name', type: 'TEXT' }
  });
  await prisma.appConfig.upsert({
    where: { key: 'PRIVACY_POLICY' },
    update: {},
    create: { key: 'PRIVACY_POLICY', value: 'Ini adalah kebijakan privasi dasar Examwoi. Harap baca dengan seksama. Data Anda aman. [Konten lengkap kebijakan privasi akan ditambahkan di sini].', description: 'Full privacy policy text', type: 'TEXT' }
  });
  await prisma.appConfig.upsert({
    where: { key: 'AD_BANNER_IMAGE_URL' },
    update: {},
    create: { key: 'AD_BANNER_IMAGE_URL', value: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', description: 'Base64 image for advertisement banner', type: 'IMAGE_URL' }
  });
  await prisma.appConfig.upsert({
    where: { key: 'BACKGROUND_IMAGE_URL' },
    update: {},
    create: { key: 'BACKGROUND_IMAGE_URL', value: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', description: 'Base64 image for application background', type: 'IMAGE_URL' }
  });
  await prisma.appConfig.upsert({
    where: { key: 'HELP_TEXT' },
    update: {},
    create: { key: 'HELP_TEXT', value: 'Ini adalah teks bantuan aplikasi Examwoi. Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi tim dukungan kami.', description: 'Konten halaman bantuan.', type: 'TEXT' }
  });
  await prisma.appConfig.upsert({
    where: { key: 'ABOUT_APP_TEXT' },
    update: {},
    create: { key: 'ABOUT_APP_TEXT', value: 'Examwoi adalah platform simulasi ujian inovatif yang dirancang untuk membantu siswa mempersiapkan diri menghadapi tantangan ujian masuk universitas dengan efisien.', description: 'Informasi tentang aplikasi.', type: 'TEXT' }
  });
  console.log('Initial AppConfig entries created.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
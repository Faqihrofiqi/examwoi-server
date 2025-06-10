// prisma/seed.js
const { PrismaClient, Role, Status } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- Hashing Passwords ---
  const adminPassword = await bcrypt.hash('admin123', 10);
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  // --- Create Users ---
  // Pastikan tidak ada customerId di sini
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@examwoi.com' },
    update: {},
    create: {
      email: 'admin@examwoi.com',
      password: adminPassword,
      username: 'Admin Examwoi',
      role: Role.ADMIN,
      isVerified: true, // Auto-verify for seeding
      phone: '081111111111'
    },
  });
  console.log(`Created admin user with ID: ${adminUser.id}`);

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@examwoi.com' },
    update: {},
    create: {
      email: 'teacher@examwoi.com',
      password: teacherPassword,
      username: 'Guru Pengajar',
      role: Role.TEACHER,
      isVerified: true,
      phone: '082222222222'
    },
  });
  console.log(`Created teacher user with ID: ${teacherUser.id}`);

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@examwoi.com' },
    update: {},
    create: {
      email: 'student@examwoi.com',
      password: studentPassword,
      username: 'Siswa Contoh',
      role: Role.STUDENT,
      isVerified: true,
      phone: '083333333333'
    },
  });
  console.log(`Created student user with ID: ${studentUser.id}`);

  // --- Create Faculties ---
  // Pastikan tidak ada customerId di sini
  const fkip = await prisma.faculty.upsert({
    where: { name: 'Fakultas Keguruan dan Ilmu Pendidikan' },
    update: {},
    create: {
      name: 'Fakultas Keguruan dan Ilmu Pendidikan',
      description: 'Fakultas ini mendidik calon guru dan peneliti di bidang pendidikan.',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    },
  });
  console.log(`Created faculty: ${fkip.name}`);

  const fteknik = await prisma.faculty.upsert({
    where: { name: 'Fakultas Teknik' },
    update: {},
    create: {
      name: 'Fakultas Teknik',
      description: 'Mendidik insinyur profesional di berbagai disiplin ilmu teknik.',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    },
  });
  console.log(`Created faculty: ${fteknik.name}`);

  const fkedokteran = await prisma.faculty.upsert({
    where: { name: 'Fakultas Kedokteran' },
    update: {},
    create: {
      name: 'Fakultas Kedokteran',
      description: 'Fakultas yang mendidik calon dokter dan ahli kesehatan profesional.',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    },
  });
  console.log(`Created faculty: ${fkedokteran.name}`);

  // --- Create Questions for Faculties ---
  // Pastikan tidak ada customerId di sini
  await prisma.question.upsert({
    where: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }, // Use a fixed UUID for upsert to work
    update: {},
    create: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Example UUID
      rawText: '# Pedagogi adalah ilmu tentang?\n-- Anak-anak\n-- Belajar\n-- Mengajar\n-- Kurikulum\n@c', // Updated to @
      content: {
        questionText: 'Pedagogi adalah ilmu tentang?',
        options: [
          { id: 'a', text: 'Anak-anak' },
          { id: 'b', text: 'Belajar' },
          { id: 'c', text: 'Mengajar' },
          { id: 'd', text: 'Kurikulum' },
        ],
        correctOptionId: 'c',
        questionType: 'TEXT'
      },
      status: Status.PUBLISHED,
      facultyId: fkip.id,
      publishedAt: new Date(),
    },
  });
  console.log('Created published question for FKIP');

  await prisma.question.upsert({
    where: { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' }, // Another fixed UUID
    update: {},
    create: {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', // Example UUID
      rawText: '# Apa singkatan dari PPL?\n-- Praktik Pengalaman Lapangan\n-- Pendidikan Profesi Lanjut\n-- Program Pelatihan Lapangan\n-- Pedoman Pengajaran Lanjutan\n@a', // Updated to @
      content: {
        questionText: 'Apa singkatan dari PPL?',
        options: [
          { id: 'a', text: 'Praktik Pengalaman Lapangan' },
          { id: 'b', text: 'Pendidikan Profesi Lanjut' },
          { id: 'c', text: 'Program Pelatihan Lapangan' },
          { id: 'd', text: 'Pedoman Pengajaran Lanjutan' },
        ],
        correctOptionId: 'a',
        questionType: 'TEXT'
      },
      status: Status.DRAFT,
      facultyId: fkip.id,
    },
  });
  console.log('Created draft question for FKIP');

  await prisma.question.upsert({
    where: { id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13' },
    update: {},
    create: {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
      rawText: '# Berikut adalah simbol dari komponen elektronik apa?\n[IMG:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=]\n-- Resistor\n-- Kapasitor\n-- Induktor\n-- Dioda\n@a', // Updated to @
      content: {
        questionText: 'Berikut adalah simbol dari komponen elektronik apa?',
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        options: [
          { id: 'a', text: 'Resistor' },
          { id: 'b', text: 'Kapasitor' },
          { id: 'c', text: 'Induktor' },
          { id: 'd', text: 'Dioda' },
        ],
        correctOptionId: 'a',
        questionType: 'IMAGE'
      },
      status: Status.PUBLISHED,
      facultyId: fteknik.id,
      publishedAt: new Date(),
    },
  });
  console.log('Created published image question for Fakultas Teknik');

  await prisma.question.upsert({
    where: { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14' },
    update: {},
    create: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      rawText: '# Hukum Ohm menyatakan hubungan antara tegangan (V), arus (I), dan hambatan (R) sebagai?\n-- V = I * R\n-- I = V * R\n-- R = V * I\n-- V = I / R\n@a', // Updated to @
      content: {
        questionText: 'Hukum Ohm menyatakan hubungan antara tegangan (V), arus (I), dan hambatan (R) sebagai?',
        options: [
          { id: 'a', text: 'V = I * R' },
          { id: 'b', text: 'I = V * R' },
          { id: 'c', text: 'R = V * I' },
          { id: 'd', text: 'V = I / R' },
        ],
        correctOptionId: 'a',
        questionType: 'TEXT'
      },
      status: Status.PUBLISHED,
      facultyId: fteknik.id,
      publishedAt: new Date(),
    },
  });
  console.log('Created published question for Fakultas Teknik');

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
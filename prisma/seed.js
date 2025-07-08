const { PrismaClient, Role, Status, PackageStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding process...');

  // --- 1. Clean existing data ---
  console.log('Cleaning existing data...');
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
    console.log('Existing data cleaned successfully.');
  } catch (e) {
    console.error('Error cleaning data (normal if first run):', e.message);
  }

  // --- 2. Hash passwords ---
  const adminPassword = await bcrypt.hash('admin123', 10);
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  // --- 3. Create Users with name field ---
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@examwoi.com',
      password: adminPassword,
      username: 'admin_user',
      name: 'Admin Examwoi', // Added name field
      role: Role.ADMIN,
      isVerified: true,
      phone: '081111111111',
      dateOfBirth: new Date('1990-01-01'),
      kabupaten: 'Purwokerto',
      profinsi: 'Jawa Tengah',
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@examwoi.com',
      password: teacherPassword,
      username: 'teacher_user',
      name: 'Guru Pengajar', // Added name field
      role: Role.TEACHER,
      isVerified: true,
      phone: '082222222222',
      dateOfBirth: new Date('1985-05-10'),
      kabupaten: 'Bandung',
      profinsi: 'Jawa Barat',
    },
  });
  console.log(`Created teacher user: ${teacherUser.email}`);

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@examwoi.com',
      password: studentPassword,
      username: 'student_user',
      name: 'Siswa Contoh', // Added name field
      role: Role.STUDENT,
      isVerified: true,
      phone: '083333333333',
      dateOfBirth: new Date('2003-11-20'),
      kabupaten: 'Surabaya',
      profinsi: 'Jawa Timur',
    },
  });
  console.log(`Created student user: ${studentUser.email}`);

  // --- 4. Create Faculties ---
  const faculties = [
    {
      name: 'Fakultas Keguruan dan Ilmu Pendidikan',
      description: 'Fakultas ini mendidik calon guru dan peneliti di bidang pendidikan.',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    },
    {
      name: 'Fakultas Teknik',
      description: 'Mendidik insinyur profesional di berbagai disiplin ilmu teknik.',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    },
    {
      name: 'Fakultas Kedokteran',
      description: 'Fakultas yang mendidik calon dokter dan ahli kesehatan profesional.',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    },
    {
      name: 'Fakultas Ilmu Komputer',
      description: 'Fakultas untuk mendidik ahli di bidang teknologi informasi dan komputasi.',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    }
  ];

  const createdFaculties = await Promise.all(
    faculties.map(faculty => prisma.faculty.create({ data: faculty }))
  );
  console.log(`Created ${createdFaculties.length} faculties`);

  // --- 5. Create Exam Packages ---
  const examPackages = [
    {
      name: 'UTBK - FKIP Paket A',
      description: 'Paket soal simulasi UTBK untuk Fakultas Keguruan dan Ilmu Pendidikan.',
      facultyId: createdFaculties[0].id,
      status: PackageStatus.PUBLISHED,
      publishedAt: new Date(),
      durationMinutes: 120,
      totalQuestions: 0
    },
    {
      name: 'UTBK - Teknik Paket 1',
      description: 'Simulasi ujian teknik dasar.',
      facultyId: createdFaculties[1].id,
      status: PackageStatus.PUBLISHED,
      publishedAt: new Date(),
      durationMinutes: 90,
      totalQuestions: 0
    },
    {
      name: 'UTBK - Kedokteran Sesi 1',
      description: 'Simulasi ujian Kedokteran.',
      facultyId: createdFaculties[2].id,
      status: PackageStatus.DRAFT,
      publishedAt: null,
      durationMinutes: 100,
      totalQuestions: 0
    },
    {
      name: 'UTBK - Ilmu Komputer Paket Dasar',
      description: 'Paket dasar untuk calon mahasiswa Ilmu Komputer.',
      facultyId: createdFaculties[3].id,
      status: PackageStatus.PUBLISHED,
      publishedAt: new Date(),
      durationMinutes: 120,
      totalQuestions: 0
    }
  ];

  const createdPackages = await Promise.all(
    examPackages.map(pkg => prisma.examPackage.create({ data: pkg }))
  );
  console.log(`Created ${createdPackages.length} exam packages`);

  // --- 6. Create Questions ---
  const questions = [
    // FKIP Questions
    {
      rawText: '# Pedagogi adalah ilmu tentang?\n-- Anak-anak\n-- Belajar\n-- Mengajar\n-- Kurikulum\n@c',
      content: { questionText: 'Pedagogi adalah ilmu tentang?', options: [{ id: 'a', text: 'Anak-anak' }, { id: 'b', text: 'Belajar' }, { id: 'c', text: 'Mengajar' }, { id: 'd', text: 'Kurikulum' }], correctOptionId: 'c', questionType: 'TEXT' },
      questionType: 'TEXT',
      examPackageId: createdPackages[0].id,
    },
    {
      rawText: '# Apa singkatan dari PPL?\n-- Praktik Pengalaman Lapangan\n-- Pendidikan Profesi Lanjut\n-- Program Pelatihan Lapangan\n-- Pedoman Pengajaran Lanjutan\n@a',
      content: { questionText: 'Apa singkatan dari PPL?', options: [{ id: 'a', text: 'Praktik Pengalaman Lapangan' }, { id: 'b', text: 'Pendidikan Profesi Lanjut' }, { id: 'c', text: 'Program Pelatihan Lapangan' }, { id: 'd', text: 'Pedoman Pengajaran Lanjutan' }], correctOptionId: 'a', questionType: 'TEXT' },
      questionType: 'TEXT',
      examPackageId: createdPackages[0].id,
    },
    // Add more questions as needed...
  ];

  const createdQuestions = await prisma.question.createMany({ data: questions });
  console.log(`Created ${createdQuestions.count} questions`);

  // Update question counts
  await Promise.all(
    createdPackages.map(async (pkg, index) => {
      const count = index === 0 ? 2 : 0; // Adjust counts as needed
      return prisma.examPackage.update({
        where: { id: pkg.id },
        data: { totalQuestions: count }
      });
    })
  );

  // --- 7. Create App Config ---
  const appConfigs = [
    { key: 'APP_NAME', value: 'Examwoi App', description: 'The main application name', type: 'TEXT' },
    { key: 'PRIVACY_POLICY', value: 'Privacy policy text...', description: 'Full privacy policy text', type: 'TEXT' },
    { key: 'AD_BANNER_IMAGE_URL', value: 'data:image/png;base64,...', description: 'Base64 image for advertisement banner', type: 'IMAGE_URL' },
    { key: 'BACKGROUND_IMAGE_URL', value: 'data:image/png;base64,...', description: 'Base64 image for application background', type: 'IMAGE_URL' },
    { key: 'HELP_TEXT', value: 'Help text content...', description: 'Help page content', type: 'TEXT' },
    { key: 'ABOUT_APP_TEXT', value: 'About app text...', description: 'Information about the app', type: 'TEXT' }
  ];

  await Promise.all(
    appConfigs.map(config =>
      prisma.appConfig.upsert({
        where: { key: config.key },
        update: {},
        create: config
      })
    )
  );
  console.log('App config initialized');

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
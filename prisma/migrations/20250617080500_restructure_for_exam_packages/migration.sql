/*
  Warnings:

  - You are about to drop the column `publishedAt` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Question` table. All the data in the column will be lost.
  - Added the required column `examPackageId` to the `ExamProgress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `examPackageId` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "ExamProgress" DROP CONSTRAINT "ExamProgress_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_facultyId_fkey";

-- AlterTable
ALTER TABLE "ExamProgress" ADD COLUMN     "examPackageId" TEXT NOT NULL,
ALTER COLUMN "facultyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "publishedAt",
DROP COLUMN "status",
ADD COLUMN     "examPackageId" TEXT NOT NULL,
ALTER COLUMN "facultyId" DROP NOT NULL;

-- DropEnum
DROP TYPE "Status";

-- CreateTable
CREATE TABLE "ExamPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "facultyId" TEXT NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "totalQuestions" INTEGER,

    CONSTRAINT "ExamPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamPackage_name_key" ON "ExamPackage"("name");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examPackageId_fkey" FOREIGN KEY ("examPackageId") REFERENCES "ExamPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamProgress" ADD CONSTRAINT "ExamProgress_examPackageId_fkey" FOREIGN KEY ("examPackageId") REFERENCES "ExamPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamProgress" ADD CONSTRAINT "ExamProgress_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamPackage" ADD CONSTRAINT "ExamPackage_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

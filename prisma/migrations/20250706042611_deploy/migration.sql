/*
  Warnings:

  - You are about to drop the column `facultyId` on the `ExamProgress` table. All the data in the column will be lost.
  - You are about to drop the column `facultyId` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Question` table. All the data in the column will be lost.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ExamProgress" DROP CONSTRAINT "ExamProgress_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_facultyId_fkey";

-- AlterTable
ALTER TABLE "ExamProgress" DROP COLUMN "facultyId";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "facultyId",
DROP COLUMN "publishedAt",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT NOT NULL;

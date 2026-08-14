/*
  Warnings:

  - You are about to drop the column `section` on the `classroom` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `classroom` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "classroom" DROP COLUMN "section",
DROP COLUMN "subject";

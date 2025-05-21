/*
  Warnings:

  - You are about to drop the column `ext_expires_in` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "ext_expires_in";

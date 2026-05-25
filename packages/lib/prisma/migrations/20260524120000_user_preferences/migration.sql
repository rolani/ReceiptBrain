-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultCurrency" CHAR(3),
ADD COLUMN     "defaultLocation" TEXT,
ADD COLUMN     "defaultLocationCountry" CHAR(2);

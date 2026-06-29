/*
  Warnings:

  - You are about to drop the column `odoo_product_id` on the `peserta` table. All the data in the column will be lost.
  - You are about to drop the column `odoo_product_name` on the `peserta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "peserta" DROP COLUMN "odoo_product_id",
DROP COLUMN "odoo_product_name";

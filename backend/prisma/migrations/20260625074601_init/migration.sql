-- CreateEnum
CREATE TYPE "StatusVerifikasi" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StatusTokenPending" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "peserta" (
    "id" TEXT NOT NULL,
    "id_registrasi" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "no_hp" TEXT NOT NULL,
    "imei_list" JSONB NOT NULL DEFAULT '[]',
    "nominal_beli" DECIMAL(15,2) NOT NULL,
    "struk_url" TEXT NOT NULL,
    "tgl_registrasi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_verif" "StatusVerifikasi" NOT NULL DEFAULT 'PENDING',
    "alasan_reject" TEXT,
    "jumlah_token" INTEGER NOT NULL DEFAULT 0,
    "ikut_undian" BOOLEAN NOT NULL DEFAULT false,
    "odoo_product_id" INTEGER,
    "odoo_product_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peserta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_pending" (
    "id" TEXT NOT NULL,
    "peserta_id" TEXT NOT NULL,
    "imei_list" JSONB NOT NULL DEFAULT '[]',
    "nominal_beli" DECIMAL(15,2) NOT NULL,
    "struk_url" TEXT NOT NULL,
    "status" "StatusTokenPending" NOT NULL DEFAULT 'PENDING',
    "alasan_reject" TEXT,
    "token_diberikan" INTEGER NOT NULL DEFAULT 0,
    "gemini_raw" JSONB,
    "tgl_submit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tgl_verif" TIMESTAMP(3),

    CONSTRAINT "token_pending_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_log" (
    "id" TEXT NOT NULL,
    "peserta_id" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "sumber" TEXT NOT NULL DEFAULT 'registrasi',
    "token_pending_id" TEXT,
    "gemini_raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'verifikator',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemenang" (
    "id" TEXT NOT NULL,
    "peserta_id" TEXT NOT NULL,
    "hadiah" TEXT NOT NULL,
    "tgl_undian" TIMESTAMP(3) NOT NULL,
    "no_undian" TEXT NOT NULL,
    "diumumkan" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pemenang_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "peserta_id_registrasi_key" ON "peserta"("id_registrasi");

-- CreateIndex
CREATE UNIQUE INDEX "peserta_nik_key" ON "peserta"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "pemenang_peserta_id_key" ON "pemenang"("peserta_id");

-- AddForeignKey
ALTER TABLE "token_pending" ADD CONSTRAINT "token_pending_peserta_id_fkey" FOREIGN KEY ("peserta_id") REFERENCES "peserta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_log" ADD CONSTRAINT "token_log_peserta_id_fkey" FOREIGN KEY ("peserta_id") REFERENCES "peserta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemenang" ADD CONSTRAINT "pemenang_peserta_id_fkey" FOREIGN KEY ("peserta_id") REFERENCES "peserta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

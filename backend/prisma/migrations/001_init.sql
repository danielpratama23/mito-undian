-- CreateEnum
CREATE TYPE "StatusVerifikasi" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable: peserta
CREATE TABLE "peserta" (
    "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
    "id_registrasi"    TEXT NOT NULL,
    "nama_lengkap"     VARCHAR(255) NOT NULL,
    "nik"              VARCHAR(16) NOT NULL,
    "no_hp"            VARCHAR(15) NOT NULL,
    "imei"             VARCHAR(20) NOT NULL,
    "nominal_beli"     DECIMAL(15,2) NOT NULL,
    "struk_url"        TEXT NOT NULL,
    "tgl_registrasi"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    "status_verif"     "StatusVerifikasi" NOT NULL DEFAULT 'PENDING',
    "alasan_reject"    TEXT,
    "jumlah_token"     INTEGER NOT NULL DEFAULT 0,
    "ikut_undian"      BOOLEAN NOT NULL DEFAULT false,
    "odoo_product_id"  INTEGER,
    "odoo_product_name" TEXT,
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "peserta_pkey" PRIMARY KEY ("id")
);

-- CreateTable: token_log
CREATE TABLE "token_log" (
    "id"          TEXT NOT NULL DEFAULT gen_random_uuid(),
    "peserta_id"  TEXT NOT NULL,
    "jumlah"      INTEGER NOT NULL,
    "gemini_raw"  JSONB,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "token_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable: admin_users
CREATE TABLE "admin_users" (
    "id"         TEXT NOT NULL DEFAULT gen_random_uuid(),
    "username"   VARCHAR(100) NOT NULL,
    "password"   TEXT NOT NULL,
    "role"       VARCHAR(20) NOT NULL DEFAULT 'verifikator',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: pemenang
CREATE TABLE "pemenang" (
    "id"          TEXT NOT NULL DEFAULT gen_random_uuid(),
    "peserta_id"  TEXT NOT NULL,
    "hadiah"      VARCHAR(255) NOT NULL,
    "tgl_undian"  TIMESTAMPTZ NOT NULL,
    "no_undian"   VARCHAR(50) NOT NULL,
    "diumumkan"   BOOLEAN NOT NULL DEFAULT false,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "pemenang_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
ALTER TABLE "peserta"    ADD CONSTRAINT "peserta_id_registrasi_key" UNIQUE ("id_registrasi");
ALTER TABLE "peserta"    ADD CONSTRAINT "peserta_nik_key"            UNIQUE ("nik");
ALTER TABLE "peserta"    ADD CONSTRAINT "peserta_imei_key"           UNIQUE ("imei");
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_username_key"  UNIQUE ("username");
ALTER TABLE "pemenang"   ADD CONSTRAINT "pemenang_peserta_id_key"    UNIQUE ("peserta_id");

-- Foreign keys
ALTER TABLE "token_log" ADD CONSTRAINT "token_log_peserta_id_fkey"
    FOREIGN KEY ("peserta_id") REFERENCES "peserta"("id") ON DELETE CASCADE;

ALTER TABLE "pemenang" ADD CONSTRAINT "pemenang_peserta_id_fkey"
    FOREIGN KEY ("peserta_id") REFERENCES "peserta"("id") ON DELETE CASCADE;

-- Indexes untuk performa query
CREATE INDEX "peserta_status_verif_idx"   ON "peserta"("status_verif");
CREATE INDEX "peserta_tgl_registrasi_idx" ON "peserta"("tgl_registrasi" DESC);
CREATE INDEX "peserta_nama_idx"            ON "peserta"("nama_lengkap");
CREATE INDEX "token_log_peserta_id_idx"   ON "token_log"("peserta_id");
CREATE INDEX "pemenang_diumumkan_idx"     ON "pemenang"("diumumkan");

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER peserta_updated_at
    BEFORE UPDATE ON "peserta"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

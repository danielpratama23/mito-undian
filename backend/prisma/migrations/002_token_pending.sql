-- Migration 002: multi-IMEI, TokenPending untuk pembelian ulang

-- Rename kolom imei -> imei_list (JSON array) di tabel peserta
ALTER TABLE "peserta" DROP COLUMN IF EXISTS "imei";
ALTER TABLE "peserta" ADD COLUMN IF NOT EXISTS "imei_list" JSONB NOT NULL DEFAULT '[]';

-- Hapus unique constraint imei lama kalau ada
ALTER TABLE "peserta" DROP CONSTRAINT IF EXISTS "peserta_imei_key";

-- Tambah enum baru
DO $$ BEGIN
  CREATE TYPE "StatusTokenPending" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tambah kolom sumber + token_pending_id ke token_log
ALTER TABLE "token_log"
  ADD COLUMN IF NOT EXISTS "sumber" VARCHAR(30) NOT NULL DEFAULT 'registrasi',
  ADD COLUMN IF NOT EXISTS "token_pending_id" TEXT;

-- Buat tabel token_pending
CREATE TABLE IF NOT EXISTS "token_pending" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid(),
  "peserta_id"      TEXT NOT NULL,
  "imei_list"       JSONB NOT NULL DEFAULT '[]',
  "nominal_beli"    DECIMAL(15,2) NOT NULL,
  "struk_url"       TEXT NOT NULL,
  "status"          "StatusTokenPending" NOT NULL DEFAULT 'PENDING',
  "alasan_reject"   TEXT,
  "token_diberikan" INTEGER NOT NULL DEFAULT 0,
  "gemini_raw"      JSONB,
  "tgl_submit"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "tgl_verif"       TIMESTAMPTZ,

  CONSTRAINT "token_pending_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "token_pending_peserta_id_fkey"
    FOREIGN KEY ("peserta_id") REFERENCES "peserta"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "token_pending_peserta_id_idx" ON "token_pending"("peserta_id");
CREATE INDEX IF NOT EXISTS "token_pending_status_idx"     ON "token_pending"("status");
CREATE INDEX IF NOT EXISTS "token_pending_tgl_submit_idx" ON "token_pending"("tgl_submit" DESC);

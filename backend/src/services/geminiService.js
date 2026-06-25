/**
 * geminiService.js
 * Menggunakan Google Gemini AI untuk:
 * 1. Kalkulasi jumlah token setelah admin approve
 * 2. Validasi konsistensi data (nominal vs produk)
 */

const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const TOKEN_PER_RUPIAH = 500000; // Rp500.000 = 1 token

/**
 * Hitung token dan validasi data peserta via Gemini AI
 * Dipanggil SETELAH admin approve registrasi
 */
async function hitungToken({ nama, nik, imei, nominalBeli, productName, odooHarga }) {
  const prompt = `Kamu adalah sistem kalkulasi token otomatis untuk program undian MITO Jawa Timur.

DATA PESERTA YANG SUDAH DIVERIFIKASI ADMIN:
- Nama: ${nama}
- NIK: ${nik}
- IMEI Produk: ${imei}
- Nama Produk (dari sistem MITO/Odoo): ${productName || 'Tidak ditemukan'}
- Harga Jual Produk di Sistem (Odoo): Rp${Number(odooHarga || 0).toLocaleString('id-ID')}
- Nominal di Struk Pembelian: Rp${Number(nominalBeli).toLocaleString('id-ID')}

ATURAN KALKULASI TOKEN:
- Setiap kelipatan Rp500.000 dari nominal pembelian valid = 1 token
- Nominal dibulatkan ke bawah (floor)
- Contoh: Rp1.200.000 → 2 token, Rp500.000 → 1 token, Rp499.999 → 0 token
- Jika nominal struk LEBIH RENDAH dari harga produk di sistem lebih dari 10%, tandai sebagai suspicious

TUGASMU:
Hitung jumlah token yang berhak diterima peserta berdasarkan nominal struk.
Berikan analisis singkat dalam Bahasa Indonesia.

RESPOND ONLY IN VALID JSON (no markdown, no backticks):
{
  "token_count": <integer, minimal 0>,
  "nominal_valid": <integer dalam rupiah, nominal yang digunakan untuk kalkulasi>,
  "is_suspicious": <boolean>,
  "catatan": "<penjelasan singkat kalkulasi dan analisis konsistensi data, max 200 karakter>"
}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,    // rendah untuk konsistensi
          maxOutputTokens: 512,
          topP: 0.8,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON dari response Gemini
    const cleanText = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    // Validasi struktur response
    if (typeof parsed.token_count !== 'number' || parsed.token_count < 0) {
      throw new Error('Gemini mengembalikan token_count tidak valid');
    }

    // Fallback kalkulasi manual jika Gemini aneh
    const tokenManual = Math.floor(Number(nominalBeli) / TOKEN_PER_RUPIAH);
    if (parsed.token_count > tokenManual * 2) {
      console.warn('[GeminiService] Token dari AI terlalu besar, pakai kalkulasi manual');
      parsed.token_count = tokenManual;
      parsed.catatan = `[Auto-corrected] Token dihitung manual: ${tokenManual} token`;
    }

    return {
      tokenCount: parsed.token_count,
      nominalValid: parsed.nominal_valid || Number(nominalBeli),
      isSuspicious: parsed.is_suspicious || false,
      catatan: parsed.catatan,
      geminiRaw: data,
    };

  } catch (err) {
    console.error('[GeminiService] Error:', err.message);

    // Fallback: kalkulasi manual tanpa AI
    const tokenManual = Math.floor(Number(nominalBeli) / TOKEN_PER_RUPIAH);
    return {
      tokenCount: tokenManual,
      nominalValid: Number(nominalBeli),
      isSuspicious: false,
      catatan: `[Fallback kalkulasi manual] Gemini tidak tersedia. Token = floor(${nominalBeli} / 500000) = ${tokenManual}`,
      geminiRaw: null,
      error: err.message,
    };
  }
}

module.exports = { hitungToken };

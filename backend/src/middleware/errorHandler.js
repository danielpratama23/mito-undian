/**
 * errorHandler.js — Global error middleware Express
 */

const { PrismaClientKnownRequestError } = require('@prisma/client/runtime/library')
const multer = require('multer')

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message || err)

  // Multer errors
  if (err instanceof multer.MulterError) {
    const msgs = {
      LIMIT_FILE_SIZE: 'Ukuran file terlalu besar. Maksimal 5MB.',
      LIMIT_UNEXPECTED_FILE: 'Field file tidak sesuai.',
    }
    return res.status(400).json({ success: false, message: msgs[err.code] || `Upload error: ${err.message}` })
  }

  // Prisma unique constraint
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'data'
      const fieldMap = { nik: 'NIK', imei: 'IMEI', id_registrasi: 'ID Registrasi' }
      return res.status(409).json({
        success: false,
        message: `${fieldMap[field] || field} sudah terdaftar dalam sistem`,
      })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' })
    }
    return res.status(400).json({ success: false, message: 'Database error', code: err.code })
  }

  // Custom validation errors
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ success: false, message: err.message })
  }

  // Default 500
  const isProd = process.env.NODE_ENV === 'production'
  return res.status(500).json({
    success: false,
    message: isProd ? 'Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.' : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  })
}

module.exports = errorHandler

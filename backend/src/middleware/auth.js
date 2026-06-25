const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token autentikasi tidak ditemukan' })
  }
  try {
    const token = authHeader.split(' ')[1]
    req.admin = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Sesi login telah habis. Silakan login ulang.'
      : 'Token tidak valid'
    return res.status(401).json({ success: false, message: msg })
  }
}

function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya superadmin.' })
    }
    next()
  })
}

module.exports = { requireAuth, requireSuperAdmin }

const { analyzeReceipt } = require('../services/geminiService')

/**
 * POST /api/analyze-receipt
 * Analyze receipt image with Gemini Vision API
 * Body: multipart/form-data with 'struk' file
 */
async function analyzeReceiptHandler(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Foto struk wajib diunggah' })
    }

    const result = await analyzeReceipt(req.file.buffer)
    
    return res.json({
      success: true,
      data: result
    })
  } catch (err) {
    console.error('[AnalyzeReceipt] Error:', err)
    return res.status(500).json({ success: false, message: 'Gagal menganalisis struk' })
  }
}

module.exports = { analyzeReceiptHandler }
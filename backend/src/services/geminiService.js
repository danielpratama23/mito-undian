const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

/**
 * Analyze receipt image with Gemini Vision API
 * Returns { isValid, productName, nominal, message }
 */
async function analyzeReceipt(imageBuffer) {
  try {
    const base64Image = imageBuffer.toString('base64')

    const prompt = `You are a receipt analyzer for MITO (MITO/MITOCHIBA/BREX) product verification.

Analyze this receipt image and extract:
1. Product name/brand (look for: MITO, MITOCHIBA, BREX, or similar)
2. Total amount/nominal (in Rupiah, format: number only without Rp or dots)

Rules:
- If the receipt contains MITO, MITOCHIBA, or BREX products, return isValid: true
- If no MITO/MITOCHIBA/BREX product found, return isValid: false with message "Struk tidak mengandung produk MITO/MITOCHIBA/BREX"
- Extract the total amount as a number (e.g., 500000 for Rp 500.000)
- If you cannot read the amount, return nominal: 0

Respond ONLY in this JSON format (no markdown, no code blocks):
{
  "isValid": true/false,
  "productName": "detected product name or null",
  "nominal": 0,
  "message": "success message or error message"
}`

    const result = await model.generateContent([
      {
        text: prompt
      },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      }
    ])

    const response = await result.response
    const text = response.text()

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        isValid: false,
        productName: null,
        nominal: 0,
        message: 'Gagal membaca struk. Coba lagi.'
      }
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      isValid: parsed.isValid || false,
      productName: parsed.productName || null,
      nominal: parsed.nominal || 0,
      message: parsed.message || 'Struk berhasil dianalisis'
    }

  } catch (error) {
    console.error('[Gemini] Error analyzing receipt:', error)
    return {
      isValid: false,
      productName: null,
      nominal: 0,
      message: 'Gagal menganalisis struk. Coba lagi.'
    }
  }
}

module.exports = { analyzeReceipt }
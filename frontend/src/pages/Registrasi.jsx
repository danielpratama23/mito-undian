import React, { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-toastify'
import { Upload, CheckCircle2, AlertCircle, Loader2, Plus, Trash2, Package, RefreshCw, Lock, CheckIcon, Camera, ScanLine } from 'lucide-react'
import axios from 'axios'
import { formatInputRupiah, hitungEstimasiToken } from '../utils'
import { BrowserMultiFormatReader } from '@zxing/browser'

const imeiItem = z.object({
  value: z.string()
    .min(9, 'IMEI / Unique Code minimal 9 digit')
})

const schema = z.object({
  namaLengkap: z.string().min(3, 'Nama minimal 3 karakter'),
  nik:         z.string().length(16, 'NIK harus 16 digit').regex(/^\d+$/, 'NIK hanya angka'),
  noHp:        z.string().min(10, 'Nomor HP tidak valid').max(15),
  imeiItems:   z.array(imeiItem).min(1, 'Minimal 1 IMEI').max(10),
  nominalBeli: z.string().min(1, 'Nominal wajib diisi'),
  struk:       z.any().refine(f => f?.length > 0, 'Foto struk wajib diunggah'),
})

// ── Success screen — registrasi baru ─────────────────────────────────────────
function SuccessBaru({ data }) {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4 pt-24">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Registrasi Berhasil!</h2>
        <p className="text-gray-500 mb-6">Data kamu sedang diverifikasi oleh tim MITO (1–3 hari kerja)</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ID Registrasi</span>
            <span className="font-mono font-bold text-mito-red">{data.idRegistrasi}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Nama</span>
            <span className="font-medium">{data.namaLengkap}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">IMEI Didaftarkan</span>
            <span className="font-bold">{data.imeiCount} produk</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="badge-pending">Menunggu Verifikasi</span>
          </div>
        </div>
        <p className="text-xs text-gray-400">Simpan ID Registrasi untuk cek status di halaman Pemenang</p>
      </div>
    </div>
  )
}

// ── Success screen — pembelian ulang ─────────────────────────────────────────
function SuccessUlang({ data }) {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [navigate])
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4 pt-24">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pembelian Tambahan Terkirim!</h2>
        <p className="text-gray-500 mb-2">
          NIK kamu sudah terdaftar. Pembelian ini akan diverifikasi untuk menambah token.
        </p>
        <div className="bg-blue-50 rounded-xl p-4 text-left space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ID Registrasi</span>
            <span className="font-mono font-bold text-blue-700">{data.idRegistrasi}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Nama</span>
            <span className="font-medium">{data.namaLengkap}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">IMEI Baru</span>
            <span className="font-bold">{data.imeiCount} produk</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Token Sekarang</span>
            <span className="font-bold text-amber-600">{data.pesertaToken} token</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status Pembelian Ini</span>
            <span className="badge-pending">Menunggu Verifikasi</span>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Token tambahan akan masuk setelah admin menyetujui pembelian ini
        </p>
      </div>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function Registrasi() {
  const [submitted, setSubmitted] = useState(null)
  const [preview, setPreview] = useState(null)
  const [nikData, setNikData] = useState(null) // Data NIK yang sudah terdaftar
  const [validatingNIK, setValidatingNIK] = useState(false)
  const [nikError, setNikError] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [analyzingReceipt, setAnalyzingReceipt] = useState(false)
  const [receiptResult, setReceiptResult] = useState(null)
  const videoRef = useRef(null)
  const codeReaderRef = useRef(null)

  const { register, control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, getValues } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { imeiItems: [{ value: '' }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'imeiItems' })

  const nominalValue  = watch('nominalBeli') || ''
  const nikValue      = watch('nik') || ''
  const namaValue     = watch('namaLengkap') || ''
  const noHpValue     = watch('noHp') || ''
  const estimasiToken = hitungEstimasiToken(nominalValue)

  // Validasi NIK saat berubah
  useEffect(() => {
    const validateNIK = async () => {
      if (nikValue.length !== 16) {
        setNikData(null)
        setNikError(null)
        return
      }

      setValidatingNIK(true)
      try {
        const res = await axios.get('/api/registrasi/validasi/nik', {
          params: { nik: nikValue },
        })
        
        if (res.data.found) {
          const data = res.data.data
          setNikData(data)
          setNikError(null)
          
          // Auto-fill name dan phone jika NIK ditemukan
          setValue('namaLengkap', data.namaLengkap)
          setValue('noHp', data.noHp)
        } else {
          setNikData(null)
          setNikError(null)
        }
      } catch (err) {
        console.error('Error validating NIK:', err)
        setNikData(null)
        setNikError(null)
      } finally {
        setValidatingNIK(false)
      }
    }

    const debounce = setTimeout(validateNIK, 300)
    return () => clearTimeout(debounce)
  }, [nikValue, setValue])

  // Validasi nama saat berubah (jika NIK sudah terdaftar)
  useEffect(() => {
    if (nikData && namaValue && namaValue !== nikData.namaLengkap) {
      setNikError(`Nama tidak sesuai dengan NIK yang terdaftar. Nama terdaftar: "${nikData.namaLengkap}"`)
    } else {
      setNikError(null)
    }
  }, [namaValue, nikData])

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) {
      setValue('struk', e.target.files)
      const reader = new FileReader()
      reader.onload = ev => setPreview(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  // ── Scan IMEI dengan kamera ──────────────────────────────────────────────────
  const startScan = async () => {
    setShowScanner(true)
    setScanning(true)
    
    try {
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader
      
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices()
      const selectedDevice = videoInputDevices.find(d => d.label.toLowerCase().includes('back')) || videoInputDevices[0]
      
      if (!selectedDevice) {
        throw new Error('Tidak ada kamera yang terdeteksi')
      }
      
      await codeReader.decodeFromVideoDevice(selectedDevice.deviceId, videoRef.current, (result, err) => {
        if (result) {
          // Cek apakah IMEI valid (minimal 9 digit)
          const imei = result.getText().trim()
          if (imei.length >= 9 && /^\d+$/.test(imei)) {
            // Tambah ke field IMEI yang masih kosong, atau buat baru
            const currentValues = getValues('imeiItems').map(i => i.value.trim())
            if (!currentValues.includes(imei) && fields.length < 10) {
              append({ value: imei })
              toast.success(`IMEI terdeteksi: ${imei}`)
              stopScan()
            } else if (currentValues.includes(imei)) {
              toast.warning('IMEI sudah ada di daftar')
            } else {
              toast.warning('Maksimal 10 IMEI')
            }
          }
        }
        if (err) {
          // Ignore scan errors (tidak ada barcode di frame)
        }
      })
    } catch (err) {
      console.error('Scan error:', err)
      toast.error('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.')
      setShowScanner(false)
      setScanning(false)
    }
  }

  const stopScan = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }
    setScanning(false)
    setShowScanner(false)
  }

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
      }
    }
  }, [])

  // ── Analyze struk dengan Gemini ─────────────────────────────────────────────
  const analyzeReceipt = async (file) => {
    setAnalyzingReceipt(true)
    setReceiptResult(null)
    
    try {
      const formData = new FormData()
      formData.append('struk', file)
      
      const res = await axios.post('/api/analyze-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      
      if (res.data.success) {
        const result = res.data.data
        setReceiptResult(result)
        
        if (result.isValid) {
          // Auto-fill nominal jika valid
          if (result.nominal > 0) {
            const formatted = formatInputRupiah(result.nominal.toString())
            setValue('nominalBeli', formatted)
            toast.success(`✓ Struk valid (${result.productName || 'Produk MITO'}). Nominal: Rp ${result.nominal.toLocaleString('id-ID')}`)
          } else {
            toast.success(`✓ Struk valid (${result.productName || 'Produk MITO'})`)
          }
        } else {
          toast.error(result.message || 'Struk tidak mengandung produk MITO/MITOCHIBA/BREX')
        }
      }
    } catch (err) {
      console.error('Analyze receipt error:', err)
      toast.error('Gagal menganalisis struk. Coba lagi.')
    } finally {
      setAnalyzingReceipt(false)
    }
  }

  // Override handleFileChange untuk auto-analyze
  const handleFileChangeWithAnalysis = async (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileChange(e)
      // Auto analyze setelah upload
      await analyzeReceipt(file)
    }
  }

  async function onSubmit(data) {
    // Validasi nama jika NIK sudah terdaftar
    if (nikData && data.namaLengkap !== nikData.namaLengkap) {
      toast.error(`Nama tidak sesuai dengan NIK yang terdaftar. Nama terdaftar: "${nikData.namaLengkap}"`)
      return
    }

    const imeiList = data.imeiItems.map(i => i.value.trim())
    const formData = new FormData()
    formData.append('namaLengkap', data.namaLengkap)
    formData.append('nik', data.nik)
    formData.append('noHp', data.noHp)
    formData.append('imeiList', JSON.stringify(imeiList))
    formData.append('nominalBeli', data.nominalBeli.replace(/\D/g, ''))
    formData.append('struk', data.struk[0])

    try {
      const res = await axios.post('/api/registrasi', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSubmitted(res.data)
      toast.success(res.data.isNewRegistration ? 'Registrasi berhasil!' : 'Pembelian tambahan terkirim!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.')
    }
  }

  if (submitted?.isNewRegistration === true)  return <SuccessBaru  data={submitted.data} />
  if (submitted?.isNewRegistration === false) return <SuccessUlang data={submitted.data} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12 px-4 pt-24">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Form Registrasi</h1>
          <p className="text-gray-500">Program Undian MITO Jawa Timur 2026</p>
        </div>

        {/* Token estimator */}
        <div className="bg-gradient-to-r from-mito-red to-orange-500 rounded-2xl p-4 mb-6 text-white text-center">
          <p className="text-sm opacity-80">Estimasi Token Kamu</p>
          <p className="text-4xl font-black">{estimasiToken}</p>
          <p className="text-xs opacity-70">setiap Rp500.000 = 1 token</p>
        </div>

        {/* Info pembelian ulang */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2 mb-5">
          <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            <strong>Sudah pernah daftar?</strong> Isi form ini lagi dengan NIK yang sama untuk mendaftarkan pembelian produk baru. Token akan ditambahkan ke akun kamu yang sudah ada.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">

          {/* NIK */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor KTP (NIK)</label>
            <div className="relative">
              <input 
                {...register('nik')} 
                maxLength={16} 
                className="input-field font-mono pr-10" 
                placeholder="16 digit NIK"
                disabled={false}
              />
              {validatingNIK && (
                <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              )}
              {nikData && !validatingNIK && (
                <CheckIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
              )}
            </div>
            {errors.nik && <p className="text-red-500 text-xs mt-1">{errors.nik.message}</p>}
            {nikData && (
              <p className="text-xs text-green-600 mt-1">✓ NIK terdaftar — Nama dan No. HP sudah terisi otomatis (readonly)</p>
            )}
          </div>

          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              Nama Lengkap (sesuai KTP)
              {nikData && <Lock className="w-3.5 h-3.5 text-gray-400" />}
            </label>
            <input 
              {...register('namaLengkap')} 
              className="input-field" 
              placeholder="Masukkan nama lengkap"
              readOnly={!!nikData}
            />
            {nikError && <p className="text-red-500 text-xs mt-1">⚠️ {nikError}</p>}
            {errors.namaLengkap && <p className="text-red-500 text-xs mt-1">{errors.namaLengkap.message}</p>}
          </div>

          {/* No HP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              Nomor Handphone
              {nikData && <Lock className="w-3.5 h-3.5 text-gray-400" />}
            </label>
            <input 
              {...register('noHp')} 
              className="input-field" 
              placeholder="08xxxxxxxxxx"
              readOnly={!!nikData}
            />
            {errors.noHp && <p className="text-red-500 text-xs mt-1">{errors.noHp.message}</p>}
          </div>

          {/* Multi-IMEI */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                IMEI / Unique Code Produk MITO
              </label>
              <span className="text-xs text-gray-400">{fields.length}/10 produk</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Cek IMEI di dus/kotak produk atau menu Pengaturan › Tentang Ponsel
            </p>
            
            {/* Scanner Modal */}
            {showScanner && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-4 max-w-md w-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800">Scan IMEI / Barcode</h3>
                    <button type="button" onClick={stopScan} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                    <video ref={videoRef} className="w-full h-full" playsInline />
                    {scanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-white/50 rounded-lg w-48 h-48 flex items-center justify-center">
                          <ScanLine className="w-16 h-16 text-white animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Arahkan kamera ke barcode/QR code pada produk
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <div className="relative">
                      <Package className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        {...register(`imeiItems.${index}.value`)}
                        className="input-field pl-9 font-mono text-sm"
                        placeholder={`IMEI / Unique Code produk ${index + 1}`}
                      />
                    </div>
                    {errors.imeiItems?.[index]?.value && (
                      <p className="text-red-500 text-xs mt-1">{errors.imeiItems[index].value.message}</p>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-2.5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {fields.length < 10 && (
              <button
                type="button"
                onClick={() => append({ value: '' })}
                className="mt-3 flex items-center gap-1.5 text-sm text-mito-red hover:text-mito-redDark font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah Produk Lain
              </button>
            )}
            <button
              type="button"
              onClick={startScan}
              disabled={scanning || fields.length >= 10}
              className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4" /> Scan dengan Kamera
            </button>
            {errors.imeiItems && !Array.isArray(errors.imeiItems) && (
              <p className="text-red-500 text-xs mt-1">{errors.imeiItems.message}</p>
            )}
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Pembelian</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
              <input
                {...register('nominalBeli')}
                className="input-field pl-10"
                placeholder="500.000"
                onChange={e => {
                  const formatted = formatInputRupiah(e.target.value)
                  e.target.value = formatted
                  setValue('nominalBeli', formatted)
                }}
              />
            </div>
            {errors.nominalBeli && <p className="text-red-500 text-xs mt-1">{errors.nominalBeli.message}</p>}
          </div>

          {/* Upload Struk */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto Struk Pembelian</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-mito-red transition-colors">
              {preview ? (
                <img src={preview} alt="Preview struk" className="max-h-40 rounded-lg object-contain" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Klik untuk upload foto struk</span>
                  <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (max 5MB)</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChangeWithAnalysis} />
            </label>
            {errors.struk && <p className="text-red-500 text-xs mt-1">{errors.struk.message}</p>}
            
            {/* Analyzing indicator */}
            {analyzingReceipt && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menganalisis struk dengan AI...</span>
              </div>
            )}
            
            {/* Receipt result */}
            {receiptResult && (
              <div className={`mt-2 p-3 rounded-lg text-sm ${receiptResult.isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {receiptResult.isValid ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">✓ Struk valid</p>
                      {receiptResult.productName && (
                        <p className="text-xs mt-0.5">Produk: {receiptResult.productName}</p>
                      )}
                      {receiptResult.nominal > 0 && (
                        <p className="text-xs mt-0.5">Nominal: Rp {receiptResult.nominal.toLocaleString('id-ID')}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{receiptResult.message || 'Struk tidak mengandung produk MITO/MITOCHIBA/BREX'}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 rounded-xl p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Data akan diverifikasi tim MITO dalam 1–3 hari kerja. Token diberikan setelah verifikasi disetujui.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || validatingNIK || !!nikError}
            className="btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {isSubmitting ? 'Mengirim...' : 'Daftar / Tambah Pembelian'}
          </button>
        </form>
      </div>
    </div>
  )
}

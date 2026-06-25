export const formatRupiah = (angka) => {
  if (!angka && angka !== 0) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(angka)
}

export const formatTanggal = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export const formatTanggalWaktu = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export const hitungEstimasiToken = (nominalStr) => {
  const num = parseInt(String(nominalStr).replace(/\D/g, '') || '0')
  return Math.floor(num / 500000)
}

export const formatInputRupiah = (val) => {
  const num = String(val).replace(/\D/g, '')
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const maskNIK = (nik) => {
  if (!nik || nik.length < 8) return nik
  return nik.slice(0, 4) + '****' + nik.slice(-4)
}

export const maskHP = (hp) => {
  if (!hp || hp.length < 8) return hp
  return hp.slice(0, 4) + '****' + hp.slice(-3)
}

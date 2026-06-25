import React from 'react'
import { Clock, CheckCircle2, XCircle } from 'lucide-react'

const config = {
  PENDING:  { label: 'Menunggu Verifikasi', cls: 'badge-pending',  Icon: Clock },
  APPROVED: { label: 'Disetujui',           cls: 'badge-approved', Icon: CheckCircle2 },
  REJECTED: { label: 'Ditolak',             cls: 'badge-rejected', Icon: XCircle },
}

export default function StatusBadge({ status }) {
  const { label, cls, Icon } = config[status] || config.PENDING
  return (
    <span className={cls}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </span>
  )
}

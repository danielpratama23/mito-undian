import React from 'react'
import { Coins } from 'lucide-react'

export default function TokenBadge({ jumlah, size = 'md' }) {
  const sizes = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-base px-3 py-1',
    lg: 'text-xl px-4 py-2',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 font-bold rounded-full ${sizes[size]}`}>
      <Coins className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      {jumlah} Token
    </span>
  )
}

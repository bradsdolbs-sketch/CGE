'use client'

import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  title: string
}

export default function ShareButton({ title }: ShareButtonProps) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {})
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-[#e8e4de] transition-colors hover:border-charcoal"
      style={{
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '13px',
        color: '#8a7968',
        background: 'transparent',
        borderRadius: '2px',
        cursor: 'pointer',
      }}
    >
      <Share2 className="w-4 h-4" />
      Share this property
    </button>
  )
}

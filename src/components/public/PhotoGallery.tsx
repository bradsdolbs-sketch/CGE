'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { clsx } from 'clsx'
import { getFileUrl } from '@/lib/file-url'

interface PhotoGalleryProps {
  photos: string[]
  primaryPhoto?: string | null
  altBase?: string
}

export default function PhotoGallery({ photos, primaryPhoto, altBase = 'Property' }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Deduplicate and order: primary first, then rest
  const allPhotos = (() => {
    const urls: string[] = []
    if (primaryPhoto) urls.push(getFileUrl(primaryPhoto))
    photos.forEach((p) => {
      const url = getFileUrl(p)
      if (!urls.includes(url)) urls.push(url)
    })
    return urls.length > 0 ? urls : ['/placeholder-property.jpg']
  })()

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? 0 : (i - 1 + allPhotos.length) % allPhotos.length))
  }, [allPhotos.length])

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? 0 : (i + 1) % allPhotos.length))
  }, [allPhotos.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIndex, prev, next])

  return (
    <>
      {/* Gallery grid */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[420px] sm:h-[520px]">
        {/* Main image */}
        <div
          className="col-span-4 sm:col-span-3 row-span-2 relative cursor-zoom-in group"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={allPhotos[0]}
            alt={`${altBase} — main photo`}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, 75vw"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          </div>
          <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
            1 / {allPhotos.length}
          </div>
        </div>

        {/* Thumbnails (desktop) */}
        {allPhotos.slice(1, 3).map((photo, i) => (
          <div
            key={photo}
            className="hidden sm:block relative cursor-zoom-in group overflow-hidden"
            onClick={() => openLightbox(i + 1)}
          >
            <Image
              src={photo}
              alt={`${altBase} — photo ${i + 2}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="25vw"
            />
            {i === 1 && allPhotos.length > 3 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">+{allPhotos.length - 3}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Thumbnail strip */}
      {allPhotos.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scroll-x">
          {allPhotos.map((photo, i) => (
            <button
              key={photo}
              onClick={() => openLightbox(i)}
              className={clsx(
                'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                lightboxIndex === i
                  ? 'border-terracotta'
                  : 'border-transparent hover:border-charcoal-300'
              )}
              aria-label={`View photo ${i + 1}`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={photo}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
            {lightboxIndex + 1} / {allPhotos.length}
          </div>

          {/* Prev */}
          {allPhotos.length > 1 && (
            <button
              className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); prev() }}
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative w-full max-w-5xl mx-16 aspect-[4/3]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={allPhotos[lightboxIndex]}
              alt={`${altBase} — photo ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Next */}
          {allPhotos.length > 1 && (
            <button
              className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); next() }}
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Thumbnail strip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw]">
            {allPhotos.map((photo, i) => (
              <button
                key={photo}
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i) }}
                className={clsx(
                  'flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-colors',
                  i === lightboxIndex ? 'border-terracotta' : 'border-white/20 hover:border-white/50'
                )}
              >
                <div className="relative w-full h-full">
                  <Image src={photo} alt="" fill className="object-cover" sizes="48px" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

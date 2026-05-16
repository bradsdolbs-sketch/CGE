'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProgressiveImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  objectFit?: 'cover' | 'contain' | 'fill'
}

/**
 * Drop-in Next.js Image wrapper that fades in once loaded,
 * showing a shimmer skeleton while the image is pending.
 */
export default function ProgressiveImage({
  src,
  alt,
  fill,
  width,
  height,
  className = '',
  priority = false,
  sizes,
  objectFit = 'cover',
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Shimmer placeholder */}
      {!loaded && (
        <div className="absolute inset-0 skeleton" aria-hidden="true" />
      )}

      {/* Actual image */}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        priority={priority}
        sizes={sizes ?? '100vw'}
        onLoad={() => setLoaded(true)}
        className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        style={{ objectFit }}
      />
    </div>
  )
}

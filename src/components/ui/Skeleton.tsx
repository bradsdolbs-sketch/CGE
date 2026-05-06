import { clsx } from 'clsx'

// ─── Base Skeleton ────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={clsx('skeleton rounded', className)}
      style={style}
      aria-hidden="true"
    />
  )
}

// ─── Skeleton Text ────────────────────────────────────────────────────────────

interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3', 'w-1/2']

  return (
    <div className={clsx('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx('h-4', widths[i % widths.length])}
        />
      ))}
    </div>
  )
}

// ─── Skeleton Image ───────────────────────────────────────────────────────────

interface SkeletonImageProps {
  aspectRatio?: '1/1' | '4/3' | '16/9' | '3/2'
  className?: string
}

export function SkeletonImage({ aspectRatio = '4/3', className }: SkeletonImageProps) {
  const ratioMap = {
    '1/1': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    '3/2': 'aspect-[3/2]',
  }

  return (
    <Skeleton className={clsx('w-full rounded-lg', ratioMap[aspectRatio], className)} />
  )
}

// ─── Skeleton Card (property card shape) ─────────────────────────────────────

export function SkeletonCard() {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-charcoal-100"
      aria-hidden="true"
    >
      {/* Image */}
      <SkeletonImage aspectRatio="4/3" className="rounded-none" />
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Price */}
        <Skeleton className="h-6 w-1/3" />
        {/* Address */}
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        {/* Stats row */}
        <div className="flex gap-4 pt-1">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  )
}

export default Skeleton

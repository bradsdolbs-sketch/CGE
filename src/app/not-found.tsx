import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-[#c4622d] font-semibold text-sm tracking-widest uppercase mb-4">404</p>
        <h1 className="text-4xl font-bold text-[#1a1a1a] mb-3" style={{ fontFamily: 'var(--font-syne)' }}>
          Page not found
        </h1>
        <p className="text-[#8a7968] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 bg-[#1A3D2B] text-white text-sm font-semibold rounded-lg hover:bg-[#15302200] transition"
            style={{ backgroundColor: '#1A3D2B' }}
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 border border-[#d5cfc8] text-[#1a1a1a] text-sm font-semibold rounded-lg hover:bg-white transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}

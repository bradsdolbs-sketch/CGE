import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Your Next Home — Central Gate Estates',
  description: 'Tell us what you need and we\'ll match you to the right property in East London within 24 hours.',
}

export default function TenantFindPage() {
  return (
    <div style={{ height: 'calc(100vh - 72px)', background: '#0f1a13' }}>
      <iframe
        src="/tenant-search/index.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="Find your next home"
      />
    </div>
  )
}

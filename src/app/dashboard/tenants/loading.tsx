export default function TenantsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-7 w-28 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="skeleton h-9 w-32 rounded-lg" />
      </div>

      {/* Search + filters */}
      <div className="flex gap-3">
        <div className="skeleton h-9 flex-1 max-w-xs rounded-lg" />
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex gap-6">
          {['Name', 'Property', 'Tenancy', 'Status'].map(h => (
            <div key={h} className="skeleton h-3 w-16" />
          ))}
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-4">
              <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <div className="skeleton h-4 w-40 mb-1.5" />
                <div className="skeleton h-3 w-28" />
              </div>
              <div className="skeleton h-3 w-32 hidden sm:block" />
              <div className="skeleton h-3 w-20 hidden md:block" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

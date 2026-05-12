export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-7 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-gray-200 rounded mb-1.5" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function RentLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="skeleton h-7 w-40 mb-2" />
        <div className="skeleton h-4 w-56" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="skeleton h-3 w-20 mb-3" />
            <div className="skeleton h-8 w-24" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Rows */}
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="skeleton h-4 w-48 mb-1.5" />
              <div className="skeleton h-3 w-32" />
            </div>
            <div className="skeleton h-5 w-16 rounded-full" />
            <div className="skeleton h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

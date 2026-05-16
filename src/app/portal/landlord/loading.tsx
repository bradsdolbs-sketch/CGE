export default function LandlordPortalLoading() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <div className="skeleton h-7 w-44 mb-2" />
        <div className="skeleton h-4 w-64" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="skeleton h-3 w-16 mb-3" />
            <div className="skeleton h-7 w-20 mb-1" />
            <div className="skeleton h-3 w-12" />
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-48" />
              <div className="skeleton h-3 w-32" />
              <div className="skeleton h-3 w-64" />
            </div>
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

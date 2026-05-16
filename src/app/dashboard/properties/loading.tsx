export default function PropertiesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-7 w-36 mb-2" />
          <div className="skeleton h-4 w-52" />
        </div>
        <div className="skeleton h-9 w-36 rounded-lg" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="skeleton h-44 w-full rounded-none" />
            <div className="p-4 space-y-2">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="flex gap-3 pt-1">
                <div className="skeleton h-3 w-12" />
                <div className="skeleton h-3 w-12" />
                <div className="skeleton h-3 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

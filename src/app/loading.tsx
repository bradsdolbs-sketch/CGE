export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f5f2ee] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#8a7968]">Loading…</p>
      </div>
    </main>
  )
}

export default function TenantPortalLoading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-[#c4622d] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#8a7968]">Loading…</p>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Free Rental Valuation | Central Gate Estates',
  description: 'Get an instant indicative rental valuation for your London property. Free for properties in our catchment area.',
}

export default function ValuationPage() {
  return (
    <div className="min-h-screen bg-[#0E1411] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <iframe
          src="/valuation/index.html"
          className="w-full rounded-2xl"
          style={{ height: '90vh', maxWidth: '520px', border: 'none' }}
          title="Rental Valuation Bot"
        />
      </div>
    </div>
  )
}

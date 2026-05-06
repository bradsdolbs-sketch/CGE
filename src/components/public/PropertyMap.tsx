'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'

interface PropertyMapProps {
  lat: number
  lng: number
  address: string
  /** Offset the pin slightly for privacy */
  approximate?: boolean
}

// This component is only used on client — Leaflet cannot run on server
function LeafletMap({ lat, lng, address, approximate = true }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    // Dynamic import to avoid SSR issues
    const initMap = async () => {
      const L = (await import('leaflet')).default
      // @ts-ignore — leaflet CSS has no type declarations
      await import('leaflet/dist/leaflet.css')

      // Avoid reinitialising if already mounted
      if (mapInstanceRef.current) return

      // Slight offset for privacy if approximate
      const displayLat = approximate ? lat + (Math.random() - 0.5) * 0.001 : lat
      const displayLng = approximate ? lng + (Math.random() - 0.5) * 0.001 : lng

      const map = L.map(mapRef.current!, {
        center: [displayLat, displayLng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      // Custom terracotta pin icon
      const icon = L.divIcon({
        html: `<div style="width:36px;height:36px;background:#1A3D2B;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })

      const marker = L.marker([displayLat, displayLng], { icon }).addTo(map)

      if (address) {
        marker.bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:13px;font-weight:600;color:#1a1a1a;padding:2px 4px;">${address}</div>`,
          { closeButton: false }
        )
      }

      mapInstanceRef.current = map
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        ;(mapInstanceRef.current as { remove: () => void }).remove()
        mapInstanceRef.current = null
      }
    }
  }, [lat, lng, address, approximate])

  return (
    <div className="rounded-xl overflow-hidden border border-charcoal-200">
      <div ref={mapRef} className="h-[400px] w-full" />
    </div>
  )
}

// Export with no SSR
const PropertyMap = dynamic(() => Promise.resolve(LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-charcoal-100 rounded-xl flex items-center justify-center border border-charcoal-200">
      <div className="text-center text-charcoal-400">
        <MapPin className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">Loading map…</p>
      </div>
    </div>
  ),
})

export default PropertyMap
export { PropertyMap }

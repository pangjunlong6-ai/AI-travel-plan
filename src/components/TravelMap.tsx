import { useEffect } from 'react'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { LocateFixed, Navigation2 } from 'lucide-react'
import type { TripDay } from '../types/trip'

type TravelMapProps = {
  day: TripDay
  selectedSlot: number
  onSelectSlot: (index: number) => void
  locateSignal: number
}

function FitDay({ day, locateSignal }: { day: TripDay; locateSignal: number }) {
  const map = useMap()
  useEffect(() => {
    const points = day.slots.map((slot) => [slot.lat, slot.lng] as [number, number])
    if (points.length === 1) map.setView(points[0], 14, { animate: true })
    else map.fitBounds(points, { padding: [72, 72], animate: true, maxZoom: 14 })
  }, [day, locateSignal, map])
  return null
}

export function TravelMap({ day, selectedSlot, onSelectSlot, locateSignal }: TravelMapProps) {
  const route = day.slots.map((slot) => [slot.lat, slot.lng] as [number, number])
  const selected = day.slots[selectedSlot] ?? day.slots[0]
  const offlinePreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('offline')

  return (
    <section className="map-panel" aria-label="当日路线地图">
      <MapContainer center={[selected.lat, selected.lng]} zoom={13} zoomControl={false} className="travel-map" scrollWheelZoom>
        {!offlinePreview && <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />}
        <Polyline positions={route} pathOptions={{ color: 'oklch(0.74 0.15 190)', weight: 4, dashArray: '3 11', lineCap: 'round' }} />
        {day.slots.map((slot, index) => (
          <CircleMarker
            key={`${day.date}-${slot.name}`}
            center={[slot.lat, slot.lng]}
            radius={selectedSlot === index ? 11 : 8}
            pathOptions={{
              color: selectedSlot === index ? 'oklch(0.69 0.20 30)' : 'oklch(0.55 0.13 190)',
              fillColor: selectedSlot === index ? 'oklch(0.69 0.20 30)' : 'oklch(0.74 0.15 190)',
              fillOpacity: 1,
              weight: selectedSlot === index ? 5 : 3,
              opacity: 0.35,
            }}
            eventHandlers={{ click: () => onSelectSlot(index) }}
          >
            <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent={selectedSlot === index}>
              <strong>{index + 1}. {slot.name}</strong><br /><span>{slot.time}</span>
            </Tooltip>
          </CircleMarker>
        ))}
        <FitDay day={day} locateSignal={locateSignal} />
      </MapContainer>

      <div className="map-topline">
        <div>
          <span className="soft-label"><Navigation2 size={13} /> 今天的路线</span>
          <h2>{day.theme}</h2>
        </div>
        <span className="route-distance">{day.slots.length} 个停靠点</span>
      </div>

      <div className="map-focus-card">
        <span className="focus-index">{String(selectedSlot + 1).padStart(2, '0')}</span>
        <div>
          <strong>{selected.name}</strong>
          <span>{selected.time} · {selected.transport?.mode ?? '自由前往'}</span>
        </div>
        <LocateFixed size={17} />
      </div>

      <p className="map-offline-note">地图瓦片需要联网；行程内容离线仍可阅读。</p>
    </section>
  )
}

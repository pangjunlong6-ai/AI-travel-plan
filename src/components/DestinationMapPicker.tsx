import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'

type Position = { lat: number; lng: number }

function PickOnMap({ position, onPick }: { position: Position | null; onPick: (position: Position) => void }) {
  useMapEvents({ click: (event) => onPick({ lat: event.latlng.lat, lng: event.latlng.lng }) })
  if (!position) return null
  return <CircleMarker center={[position.lat, position.lng]} radius={9} pathOptions={{ color: 'white', fillColor: 'oklch(0.61 0.22 255)', fillOpacity: 1, weight: 4 }} />
}

export function DestinationMapPicker({ position, onPick, status }: { position: Position | null; onPick: (position: Position) => void; status?: string }) {
  return (
    <div className="destination-picker">
      <MapContainer center={position ? [position.lat, position.lng] : [34.5, 104]} zoom={position ? 8 : 3} zoomControl className="destination-picker-map">
        <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <PickOnMap position={position} onPick={onPick} />
      </MapContainer>
      <div className="destination-picker-help"><span>拖动地图并点击选择目的地</span><strong>{status ?? (position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : '尚未选点')}</strong></div>
    </div>
  )
}

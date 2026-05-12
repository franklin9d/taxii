import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

export const driverIcon = L.divIcon({
  html: '<div style="font-size: 24px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚕</div>',
  className: 'driver-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{id: string, position: [number, number], icon?: L.Icon | L.DivIcon}>;
  onClick?: (latlng: [number, number]) => void;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function MapEventsWrapper({ onClick }: { onClick?: (latlng: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) onClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

export function MapComponent({ center, zoom = 15, markers = [], onClick }: MapProps) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={center} zoom={zoom} />
      <MapEventsWrapper onClick={onClick} />
      {markers.map(m => (
        <Marker key={m.id} position={m.position} icon={m.icon || defaultIcon} />
      ))}
    </MapContainer>
  );
}

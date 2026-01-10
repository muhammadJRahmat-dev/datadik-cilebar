'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for leaflet marker icons in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface SchoolMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  slug: string;
  npsn?: string;
}

export default function CilebarMap({ schools }: { schools: SchoolMarker[] }) {
  useEffect(() => {
    // Fix leaflet icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const defaultCenter: [number, number] = [-6.2146, 107.3000]; // Approximate coordinates for Cilebar

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border shadow-md">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains='abcd'
          maxZoom={20}
        />
        {schools.map((school) => {
          const profileUrl = typeof window !== 'undefined' 
            ? `${window.location.protocol}//${school.slug}.${window.location.host.replace('www.', '')}`
            : '#';

          return (
            <Marker 
              key={school.id} 
              position={[school.lat, school.lng]} 
              icon={icon}
            >
              <Popup>
                <div className="p-2 min-w-[150px]">
                  <h3 className="font-bold text-primary mb-1">{school.name}</h3>
                  <div className="text-xs text-muted-foreground mb-2">
                    NPSN: {school.npsn || '-'}
                  </div>
                  <a 
                    href={profileUrl}
                    className="inline-flex items-center justify-center w-full px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Buka Portal Sekolah
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

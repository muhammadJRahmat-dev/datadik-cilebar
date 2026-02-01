'use client';

import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ScaleControl, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { ExternalLink, School } from 'lucide-react';

// Fix Leaflet marker icons
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface SchoolMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  slug: string;
  npsn?: string;
}

const defaultCenter = {
  lat: -6.1956, // Updated coordinates for better center on Cilebar
  lng: 107.3600
};

export default function CilebarMap({ schools }: { schools: SchoolMarker[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full rounded-[2.5rem] bg-slate-100 flex flex-col items-center justify-center animate-pulse gap-4 text-slate-400">
        <School className="h-10 w-10 opacity-50" />
        <span className="text-xs font-bold uppercase tracking-widest">Memuat Peta...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-[2.5rem] overflow-hidden border-2 border-slate-100/50 shadow-2xl relative z-0">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={13}
        scrollWheelZoom={false}
        zoomControl={false} // Custom zoom control position
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        {/* CartoDB Voyager - Free, Modern, No API Key */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomleft" />

        {schools.map((school) => (
          <Marker
            key={school.id}
            position={[school.lat, school.lng]}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <h3 className="font-black text-slate-900 mb-1 text-sm leading-tight">{school.name}</h3>
                <div className="text-[10px] font-bold text-slate-500 mb-3 bg-slate-100 w-fit px-2 py-0.5 rounded-full border border-slate-200">
                  NPSN: {school.npsn || '-'}
                </div>
                <a
                  href={typeof window !== 'undefined'
                    ? `${window.location.protocol}//${school.slug}.${window.location.host.replace('www.', '').replace('localhost:3000', 'datadikcilebar.my.id')}`
                    : '#'}
                  className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                >
                  Buka Portal <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg z-[400] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Live Data Map</span>
      </div>
    </div>
  );
}


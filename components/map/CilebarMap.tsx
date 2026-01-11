'use client';

import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup as LeafletPopup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: -6.1956, // Updated coordinates for better center on Cilebar
  lng: 107.3600
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  styles: [
    {
      "featureType": "administrative",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#444444" }]
    },
    {
      "featureType": "landscape",
      "elementType": "all",
      "stylers": [{ "color": "#f2f2f2" }]
    },
    {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "road",
      "elementType": "all",
      "stylers": [{ "saturation": -100 }, { "lightness": 45 }]
    },
    {
      "featureType": "road.highway",
      "elementType": "all",
      "stylers": [{ "visibility": "simplified" }]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "transit",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "water",
      "elementType": "all",
      "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }]
    }
  ]
};

export default function CilebarMap({ schools }: { schools: SchoolMarker[] }) {
  const [selectedSchool, setSelectedSchool] = useState<SchoolMarker | null>(null);
  const [mapError, setMapError] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  // Global error listener for Google Maps specific errors like ApiProjectMapError
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleGoogleMapsError = (event: any) => {
      if (event.message?.includes('Google Maps JavaScript API error') || 
          event.message?.includes('ApiProjectMapError')) {
        console.warn('Google Maps API Error detected, switching to Leaflet fallback...');
        setMapError(true);
      }
    };

    window.addEventListener('error', handleGoogleMapsError, true);
    return () => window.removeEventListener('error', handleGoogleMapsError, true);
  }, []);

  useEffect(() => {
    if (loadError) {
      console.error('Google Maps Load Error:', loadError);
      setMapError(true);
    }
  }, [loadError]);

  const onSelect = useCallback((school: SchoolMarker) => {
    setSelectedSchool(school);
  }, []);

  if (mapError || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-125 w-full rounded-xl overflow-hidden border shadow-md relative">
        <MapContainer 
          center={[defaultCenter.lat, defaultCenter.lng]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {schools.map((school) => (
            <LeafletMarker 
              key={school.id} 
              position={[school.lat, school.lng]}
              eventHandlers={{
                click: () => onSelect(school),
              }}
            >
              <LeafletPopup>
                <div className="p-1 min-w-[150px]">
                  <h3 className="font-bold text-slate-900 mb-1 text-xs">{school.name}</h3>
                  <div className="text-[10px] text-slate-500 mb-2">
                    NPSN: {school.npsn || '-'}
                  </div>
                  <a 
                    href={typeof window !== 'undefined' 
                      ? `${window.location.protocol}//${school.slug}.${window.location.host.replace('www.', '').replace('localhost:3000', 'datadikcilebar.my.id')}`
                      : '#'}
                    className="inline-flex items-center justify-center w-full px-2 py-1 text-[10px] font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-all"
                  >
                    Buka Portal
                  </a>
                </div>
              </LeafletPopup>
            </LeafletMarker>
          ))}
        </MapContainer>
        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-slate-600 z-[1000] border shadow-sm">
          Fallback Mode: OpenStreetMap
        </div>
      </div>
    );
  }

  if (!isLoaded) return <div className="h-125 w-full rounded-xl flex items-center justify-center bg-slate-100 animate-pulse text-slate-400">Loading Map...</div>;

  return (
    <div className="h-125 w-full rounded-xl overflow-hidden border shadow-md relative group">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={13}
        options={mapOptions}
        onLoad={() => console.warn('Google Maps Loaded')}
      >
        {schools.map((school) => (
          <Marker
            key={school.id}
            position={{ lat: school.lat, lng: school.lng }}
            onClick={() => onSelect(school)}
            title={school.name}
            icon={typeof window !== 'undefined' && window.google ? {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            } : undefined}
          />
        ))}

        {selectedSchool && (
          <InfoWindow
            position={{ lat: selectedSchool.lat, lng: selectedSchool.lng }}
            onCloseClick={() => setSelectedSchool(null)}
          >
            <div className="p-2 min-w-[180px] max-w-[220px]">
              <h3 className="font-bold text-slate-900 mb-1 text-sm">{selectedSchool.name}</h3>
              <div className="text-[10px] text-slate-500 mb-3 flex items-center gap-1">
                <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">NPSN: {selectedSchool.npsn || '-'}</span>
              </div>
              <a 
                href={typeof window !== 'undefined' 
                  ? `${window.location.protocol}//${selectedSchool.slug}.${window.location.host.replace('www.', '').replace('localhost:3000', 'datadikcilebar.my.id')}`
                  : '#'}
                className="inline-flex items-center justify-center w-full px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98]"
              >
                Buka Portal Sekolah
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      {/* Overlay info if API Key is missing */}
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="absolute top-4 left-4 right-4 bg-amber-50 border border-amber-200 p-2 rounded-lg text-[10px] text-amber-800 shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          ⚠️ Google Maps API Key belum terpasang di .env.local
        </div>
      )}
    </div>
  );
}

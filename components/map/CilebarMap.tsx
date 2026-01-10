'use client';

import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useCallback, useMemo } from 'react';

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

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const onSelect = useCallback((school: SchoolMarker) => {
    setSelectedSchool(school);
  }, []);

  if (!isLoaded) return <div className="h-[500px] w-full rounded-xl flex items-center justify-center bg-slate-100 animate-pulse text-slate-400">Loading Map...</div>;

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border shadow-md relative group">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={13}
        options={mapOptions}
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

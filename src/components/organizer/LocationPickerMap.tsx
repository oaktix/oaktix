"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin } from "lucide-react";

// Casting to any to bypass react-leaflet v5 type declaration mismatches with React 19
const LeafletMapContainer = MapContainer as any;
const LeafletTileLayer = TileLayer as any;
const LeafletMarker = Marker as any;

// Custom marker icon using an elegant SVG to bypass standard Leaflet asset bundling issues
const customIcon = typeof window !== "undefined" ? L.divIcon({
  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 border-2 border-white shadow-xl text-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
         </div>`,
  className: "custom-leaflet-pin",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
}) : undefined;

interface LocationPickerMapProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number, address: string) => void;
}

// Map helper to update view when coordinates are modified
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Click events listener on the map
function MapEvents({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({ lat, lng, onChange }: LocationPickerMapProps) {
  const [geocoding, setGeocoding] = useState(false);

  // Default to Lagos, Nigeria if no coordinates are supplied
  const defaultLat = lat || 6.5244;
  const defaultLng = lng || 3.3792;
  const center: [number, number] = [defaultLat, defaultLng];

  const handleMapClick = async (clickedLat: number, clickedLng: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${clickedLat}&lon=${clickedLng}&accept-language=en`
      );
      const data = await res.json();
      const address = data.display_name || `${clickedLat.toFixed(5)}, ${clickedLng.toFixed(5)}`;
      onChange(clickedLat, clickedLng, address);
    } catch (err) {
      console.error("Reverse geocoding failed", err);
      onChange(clickedLat, clickedLng, `${clickedLat.toFixed(5)}, ${clickedLng.toFixed(5)}`);
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Click on the map to pinpoint venue location
        </span>
        {geocoding && (
          <span className="flex items-center gap-1 text-indigo-400 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Resolving address...
          </span>
        )}
      </div>

      <div className="w-full h-64 rounded-2xl overflow-hidden border border-white/10 relative z-10 shadow-inner">
        <LeafletMapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <ChangeView center={center} />
          <LeafletTileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onClick={handleMapClick} />
          {lat && lng && customIcon && (
            <LeafletMarker position={[lat, lng]} icon={customIcon} />
          )}
        </LeafletMapContainer>
      </div>
      {lat && lng && (
        <p className="text-[10px] text-zinc-500 font-mono">
          Coordinates Selected: {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}

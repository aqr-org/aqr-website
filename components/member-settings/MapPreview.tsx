"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

interface MapPreviewProps {
  mapref: string | null;
  addr1: string;
  addr2: string;
  addr3: string;
  addr4: string;
  addr5: string;
  postcode: string;
  country: string;
  onLocationSelect?: (lat: number, lon: number) => void;
}

interface Coordinates {
  lat: number;
  lon: number;
}

// Component to handle map clicks and track zoom
function MapClickHandler({ 
  onLocationSelect,
  onZoomChange 
}: { 
  onLocationSelect?: (lat: number, lon: number) => void;
  onZoomChange?: (zoom: number) => void;
}) {
  if (typeof window === "undefined") return null;
  
  const { useMapEvents, useMap } = require("react-leaflet");
  const map = useMap();
  
  // Track zoom changes
  useEffect(() => {
    const handleZoomEnd = () => {
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
    };
    
    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onZoomChange]);
  
  useMapEvents({
    click: (e: any) => {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component to update map center without changing zoom
function MapCenterUpdater({ center }: { center: [number, number] }) {
  if (typeof window === "undefined") return null;
  
  const { useMap } = require("react-leaflet");
  const map = useMap();
  
  useEffect(() => {
    // Set center without changing zoom
    map.setView(center, map.getZoom());
  }, [map, center]);
  
  return null;
}

export default function MapPreview({
  mapref,
  addr1,
  addr2,
  addr3,
  addr4,
  addr5,
  postcode,
  country,
  onLocationSelect,
}: MapPreviewProps) {
  // Initialize coordinates from mapref immediately if available
  const parseCoordinates = (coordString: string | null): Coordinates | null => {
    if (!coordString || !coordString.trim()) return null;
    try {
      const parts = coordString.split(",").map((s) => s.trim());
      if (parts.length !== 2) return null;

      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);

      if (isNaN(lat) || isNaN(lon)) return null;
      if (lat < -90 || lat > 90) return null;
      if (lon < -180 || lon > 180) return null;

      return { lat, lon };
    } catch {
      return null;
    }
  };

  const [coordinates, setCoordinates] = useState<Coordinates | null>(() => 
    parseCoordinates(mapref)
  );
  const [currentZoom, setCurrentZoom] = useState<number>(13); // Track user's zoom level
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevMaprefRef = useRef<string | null>(mapref);
  const isFirstRender = useRef(true);
  const hasUserZoomed = useRef(false); // Track if user has manually zoomed

  // Fix for default marker icon in Next.js - run once on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
    }
  }, []);

  useEffect(() => {
    const fetchCoordinates = async () => {
      setIsLoading(true);
      setError(null);

      // First, try to use mapref if available and valid
      if (mapref && mapref.trim()) {
        const coords = parseCoordinates(mapref);
        if (coords) {
          setCoordinates(coords);
          setIsLoading(false);
          prevMaprefRef.current = mapref;
          isFirstRender.current = false;
          return;
        }
      }

      // Otherwise, geocode the address with progressive fallback
      try {
        const coords = await geocodeAddressWithFallback(addr1, addr2, addr3, addr4, addr5, postcode, country);
        if (coords) {
          setCoordinates(coords);
        } else {
          setError("Could not find location for this address. Click on the map to set your location.");
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        setError("Failed to geocode address. Click on the map to set your location.");
      } finally {
        setIsLoading(false);
        prevMaprefRef.current = mapref;
        isFirstRender.current = false;
      }
    };

    // Only fetch coordinates on initial mount or when mapref changes
    const maprefChanged = prevMaprefRef.current !== mapref;
    if (isFirstRender.current || maprefChanged) {
      fetchCoordinates();
    }
  }, [mapref, addr1, addr2, addr3, addr4, addr5, postcode, country]);

  // Update coordinates when mapref changes externally
  useEffect(() => {
    if (mapref && mapref.trim()) {
      const coords = parseCoordinates(mapref);
      if (coords) {
        setCoordinates(coords);
      }
    }
  }, [mapref]);

  const handleLocationSelect = (lat: number, lon: number) => {
    setCoordinates({ lat, lon });
    if (onLocationSelect) {
      onLocationSelect(lat, lon);
    }
    // Don't reset zoom - keep the user's current zoom level
  };

  const handleZoomChange = (zoom: number) => {
    setCurrentZoom(zoom);
    hasUserZoomed.current = true;
  };

  const buildAddressString = (
    addr1: string,
    addr2: string,
    addr3: string,
    addr4: string,
    addr5: string,
    postcode: string,
    country: string
  ): string => {
    const parts: string[] = [];
    
    if (addr1?.trim()) parts.push(addr1.trim());
    if (addr2?.trim()) parts.push(addr2.trim());
    if (addr3?.trim()) parts.push(addr3.trim());
    if (addr4?.trim()) parts.push(addr4.trim());
    if (addr5?.trim()) parts.push(addr5.trim());
    if (postcode?.trim()) parts.push(postcode.trim());
    if (country?.trim()) parts.push(country.trim());

    return parts.join(", ");
  };

  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    if (!address || !address.trim()) {
      return null;
    }

    try {
      // Use Nominatim API with proper headers to avoid rate limiting issues
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            "User-Agent": "AQR-Website/1.0", // Required by Nominatim
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);

      if (isNaN(lat) || isNaN(lon)) {
        return null;
      }

      return { lat, lon };
    } catch (err) {
      console.error("Geocoding error:", err);
      throw err;
    }
  };

  const geocodeAddressWithFallback = async (
    addr1: string,
    addr2: string,
    addr3: string,
    addr4: string,
    addr5: string,
    postcode: string,
    country: string
  ): Promise<Coordinates | null> => {
    // Try progressively simpler address combinations
    // Priority order: most specific to least specific
    
    // 1. Full address (all fields)
    let addressString = buildAddressString(addr1, addr2, addr3, addr4, addr5, postcode, country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    // 2. Without addr5 (remove least important field first)
    addressString = buildAddressString(addr1, addr2, addr3, addr4, '', postcode, country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    // 3. Without addr4 and addr5
    addressString = buildAddressString(addr1, addr2, addr3, '', '', postcode, country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    // 4. Without addr3, addr4, addr5
    addressString = buildAddressString(addr1, addr2, '', '', '', postcode, country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    // 5. Without addr2, addr3, addr4, addr5 (just addr1, postcode, country)
    addressString = buildAddressString(addr1, '', '', '', '', postcode, country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    // 6. Just postcode and country
    addressString = buildAddressString('', '', '', '', '', postcode, country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    // 7. Just country (last resort - very broad, usually not useful but included for completeness)
    addressString = buildAddressString('', '', '', '', '', '', country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    return null;
  };

  // Default center (London) if no coordinates available
  const defaultCenter: [number, number] = [51.5074, -0.1278];
  const defaultZoom = 13;

  if (isLoading && !coordinates) {
    return (
      <div className="w-full h-[350px] border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  // Initial center - only used on first render
  const initialCenter: [number, number] = coordinates 
    ? [coordinates.lat, coordinates.lon] 
    : defaultCenter;
  // Use current zoom if user has zoomed, otherwise use default
  const zoom = hasUserZoomed.current ? currentZoom : defaultZoom;

  return (
    <div className="w-full h-[350px] border border-gray-300 rounded-lg overflow-hidden relative">
      {error && !coordinates && (
        <div className="absolute top-2 left-2 right-2 z-[1000] bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}
      <div className="absolute top-2 right-2 z-[1000] bg-white border border-gray-300 px-3 py-1 rounded text-xs shadow-md">
        Click on the map to set your location
      </div>
      <MapContainer
        key="map-container" // Use fixed key to prevent remounting when coordinates change
        center={initialCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {coordinates && (
          <>
            <Marker position={[coordinates.lat, coordinates.lon]} />
            <MapCenterUpdater center={[coordinates.lat, coordinates.lon]} />
          </>
        )}
        <MapClickHandler 
          onLocationSelect={handleLocationSelect}
          onZoomChange={handleZoomChange}
        />
      </MapContainer>
    </div>
  );
}

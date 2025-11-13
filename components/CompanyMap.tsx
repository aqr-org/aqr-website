"use client";

import { useState, useEffect } from "react";
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

interface CompanyMapProps {
  companyName?: string;
  mapref: string | null;
  addr1?: string | null;
  addr2?: string | null;
  addr3?: string | null;
  addr4?: string | null;
  addr5?: string | null;
  postcode?: string | null;
  country?: string | null;
}

interface Coordinates {
  lat: number;
  lon: number;
}

export default function CompanyMap({
  companyName,
  mapref,
  addr1,
  addr2,
  addr3,
  addr4,
  addr5,
  postcode,
  country,
}: CompanyMapProps) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          return;
        }
      }

      // Otherwise, geocode the address with progressive fallback
      try {
        const coords = await geocodeAddressWithFallback(
          addr1 || '',
          addr2 || '',
          addr3 || '',
          addr4 || '',
          addr5 || '',
          postcode || '',
          country || ''
        );
        if (coords) {
          setCoordinates(coords);
        } else {
          setError("Could not find location");
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        setError("Failed to geocode address");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoordinates();
  }, [mapref, addr1, addr2, addr3, addr4, addr5, postcode, country]);

  const parseCoordinates = (coordString: string): Coordinates | null => {
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            "User-Agent": "AQR-Website/1.0",
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
    let addressString = buildAddressString(addr1, addr2, addr3, addr4, addr5, postcode, country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    addressString = buildAddressString(addr1, addr2, addr3, addr4, '', postcode, country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    addressString = buildAddressString(addr1, addr2, addr3, '', '', postcode, country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    addressString = buildAddressString(addr1, addr2, '', '', '', postcode, country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    addressString = buildAddressString(addr1, '', '', '', '', postcode, country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    addressString = buildAddressString('', '', '', '', '', postcode, country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    addressString = buildAddressString('', '', '', '', '', '', country);
    if (addressString) {
      const coords = await geocodeAddress(addressString);
      if (coords) return coords;
    }

    return null;
  };

  // Don't render anything if still loading or if there's an error/no coordinates
  if (isLoading || error || !coordinates) {
    return null;
  }

  const center: [number, number] = [coordinates.lat, coordinates.lon];
  const zoom = 13;

  return (
    <section className="space-y-5 mt-24">
      <h2 className="text-[2.375rem] leading-none">Location of {companyName}</h2>
      <svg className="h-[2px] w-full" width="100%" height="100%">
        <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
      <div className="w-full h-[400px] border border-gray-300 rounded-lg overflow-hidden mt-8">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[coordinates.lat, coordinates.lon]} />
        </MapContainer>
      </div>
    </section>
  );
}


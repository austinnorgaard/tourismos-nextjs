/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 * 
 * CRITICAL: SDK Loading Pattern (MUST use this exact approach)
 * ============================================================
 * 
 * ❌ WRONG: script.src = url  (gets blocked by ad blockers)
 * ✅ CORRECT: fetch(url).then(text => script.textContent = text)
 * 
 * const API_KEY = process.env.NEXT_PUBLIC_FRONTEND_FORGE_API_KEY;
 * const FORGE_BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_FORGE_API_URL;
 * const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;
 * 
 * const scriptUrl = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&libraries=places,drawing,geometry,visualization`;
 * 
 * fetch(scriptUrl, { headers: { 'Origin': window.location.origin } })
 *   .then(r => r.text())
 *   .then(content => {
 *     const script = document.createElement('script');
 *     script.textContent = content;  // NOT script.src!
 *     document.head.appendChild(script);
 *     // Poll for window.google.maps availability
 *   });
 * 
 * Available Libraries:
 * - places: PlacesService, AutocompleteService
 * - drawing: DrawingManager (markers, polygons, circles, polylines, rectangles)
 * - geometry: distance/area calculations
 * - visualization: HeatmapLayer
 * 
 * Common Services (initialize after map creation):
 * - new google.maps.places.PlacesService(map)
 * - new google.maps.Geocoder()
 * - new google.maps.DirectionsService()
 * - new google.maps.DistanceMatrixService()
 * - new google.maps.ElevationService()
 * - new google.maps.drawing.DrawingManager(options)
 * 
 * Layers:
 * - new google.maps.TrafficLayer()
 * - new google.maps.TransitLayer()
 * - new google.maps.BicyclingLayer()
 * - new google.maps.visualization.HeatmapLayer({ data: [] })
 */

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: unknown;
  }
}

interface MapInstance {
  setCenter: (c: { lat: number; lng: number }) => void;
  setZoom: (z: number) => void;
}

interface GoogleWindow {
  maps: {
    Map: new (el: HTMLDivElement, opts: Record<string, unknown>) => MapInstance;
  };
}

const API_KEY = process.env.NEXT_PUBLIC_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onMapReady?: (map: unknown) => void;
}

export function MapView({
  center = { lat: 37.7749, lng: -122.4194 },
  zoom = 12,
  className = "w-full h-[500px]",
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);

  useEffect(() => {
    if (!window.google) {
      const scriptUrl = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&libraries=places,drawing,geometry,visualization,marker`;
      
      fetch(scriptUrl, {
        method: 'GET',
        headers: { 'Origin': window.location.origin },
      })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.text();
        })
        .then(scriptContent => {
          const script = document.createElement('script');
          script.textContent = scriptContent;
          document.head.appendChild(script);
          
              const checkGoogle = setInterval(() => {
                const g = window.google as unknown as { maps?: unknown } | undefined;
                if (g && g.maps) {
                  clearInterval(checkGoogle);
                  initMap();
                }
              }, 100);
          
          setTimeout(() => clearInterval(checkGoogle), 10000);
        })
        .catch(error => console.error('Failed to fetch Google Maps script:', error));
    } else {
      initMap();
    }

    function initMap() {
      if (!mapContainer.current || !window.google || map.current) return;

  const g = window.google as unknown as GoogleWindow;
      map.current = new g.maps.Map(mapContainer.current as HTMLDivElement, {
        zoom,
        center,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapId: 'DEMO_MAP_ID',
      });

      if (onMapReady) {
        onMapReady(map.current as unknown);
      }
    }
  }, [center, zoom, onMapReady]);

  useEffect(() => {
  if (map.current) {
  map.current.setCenter(center);
  map.current.setZoom(zoom);
    }
  }, [center, zoom, onMapReady]);

  return <div ref={mapContainer} className={className} />;
}

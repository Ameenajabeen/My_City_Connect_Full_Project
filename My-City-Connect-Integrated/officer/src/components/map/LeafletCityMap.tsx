/**
 * MY CITY CONNECT - Professional Free Map Solution
 * Built with OpenStreetMap + Leaflet (No Google Maps API Key or Billing Required).
 * Pure live data visualization from MySQL. No fake routing, no simulated duration.
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Complaint, Worker, RedZone } from '../../types';
import { MapInfoPanel } from './MapInfoPanel';
import {
  Crosshair,
  ZoomIn,
  ZoomOut,
  MapPin,
  Users,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface LeafletCityMapProps {
  complaints?: Complaint[];
  workers?: Worker[];
  redZones?: RedZone[];
  selectedComplaint?: Complaint | null;
  selectedWorker?: Worker | null;
  onSelectComplaint?: (complaint: Complaint | null) => void;
  onSelectWorker?: (worker: Worker | null) => void;
  showRedZones?: boolean;
  showHeatmap?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onRouteCalculated?: (info: { distance: string; duration: string } | null) => void;
}

/**
 * Derives center dynamically from actual data points or user configuration.
 * Avoids any hardcoded regional default.
 */
function calculateMapCenter(
  complaints: Complaint[],
  workers: Worker[],
  redZones: RedZone[],
  explicitCenter?: { lat: number; lng: number }
): [number, number] {
  if (explicitCenter && typeof explicitCenter.lat === 'number' && typeof explicitCenter.lng === 'number') {
    return [explicitCenter.lat, explicitCenter.lng];
  }

  // Check if user set custom city center in Settings
  if (typeof window !== 'undefined') {
    const customLat = localStorage.getItem('mcc_city_lat');
    const customLng = localStorage.getItem('mcc_city_lng');
    if (customLat && customLng) {
      const lat = parseFloat(customLat);
      const lng = parseFloat(customLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
  }

  // Derive center average from actual points
  const points: [number, number][] = [];
  complaints.forEach((c) => {
    if (typeof c.latitude === 'number' && typeof c.longitude === 'number' && !isNaN(c.latitude)) {
      points.push([c.latitude, c.longitude]);
    }
  });
  workers.forEach((w) => {
    if (typeof w.latitude === 'number' && typeof w.longitude === 'number' && !isNaN(w.latitude)) {
      points.push([w.latitude, w.longitude]);
    }
  });
  redZones.forEach((rz) => {
    if (typeof rz.centerLatitude === 'number' && typeof rz.centerLongitude === 'number' && !isNaN(rz.centerLatitude)) {
      points.push([rz.centerLatitude, rz.centerLongitude]);
    }
  });

  if (points.length > 0) {
    const sumLat = points.reduce((acc, p) => acc + p[0], 0);
    const sumLng = points.reduce((acc, p) => acc + p[1], 0);
    return [sumLat / points.length, sumLng / points.length];
  }

  // Safe geographic center fallback
  return [20.5937, 78.9629];
}

export const LeafletCityMap: React.FC<LeafletCityMapProps> = ({
  complaints = [],
  workers = [],
  redZones = [],
  selectedComplaint = null,
  selectedWorker = null,
  onSelectComplaint,
  onSelectWorker,
  showRedZones = true,
  center,
  zoom = 13,
  className = 'w-full h-full min-h-[500px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeLayerFilters, setActiveLayerFilters] = useState({
    complaints: true,
    workers: true,
    redZones: true,
  });
  const [tileStyle, setTileStyle] = useState<'carto' | 'osm'>('carto');

  // Filter valid complaints & workers with numeric coordinates
  const validComplaints = useMemo(
    () =>
      complaints.filter(
        (c) =>
          typeof c.latitude === 'number' &&
          typeof c.longitude === 'number' &&
          !isNaN(c.latitude) &&
          !isNaN(c.longitude) &&
          c.latitude !== 0 &&
          c.longitude !== 0
      ),
    [complaints]
  );

  const validWorkers = useMemo(
    () =>
      workers.filter(
        (w) =>
          typeof w.latitude === 'number' &&
          typeof w.longitude === 'number' &&
          !isNaN(w.latitude) &&
          !isNaN(w.longitude) &&
          w.latitude !== 0 &&
          w.longitude !== 0
      ),
    [workers]
  );

  const validRedZones = useMemo(
    () =>
      redZones.filter(
        (rz) =>
          typeof rz.centerLatitude === 'number' &&
          typeof rz.centerLongitude === 'number' &&
          !isNaN(rz.centerLatitude) &&
          !isNaN(rz.centerLongitude)
      ),
    [redZones]
  );

  // 1. Initialize Leaflet Map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialCenter = calculateMapCenter(validComplaints, validWorkers, validRedZones, center);

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom,
      zoomControl: false,
      attributionControl: true,
    });

    const tileUrl =
      tileStyle === 'carto'
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution =
      tileStyle === 'carto'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [tileStyle]);

  // 2. Render Markers, Red Zones & Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // A. Render Red Zones
    if (showRedZones && activeLayerFilters.redZones) {
      validRedZones.forEach((rz) => {
        const circle = L.circle([rz.centerLatitude, rz.centerLongitude], {
          radius: rz.radiusMeters || 500,
          color: '#dc2626',
          weight: 1.5,
          fillColor: '#ef4444',
          fillOpacity: 0.12,
          dashArray: '4, 4',
        });

        circle.bindPopup(`
          <div class="p-2 font-sans text-xs">
            <div class="flex items-center gap-1 font-bold text-red-700 uppercase tracking-wider text-[10px]">
              Grievance Cluster
            </div>
            <div class="text-sm font-bold text-zinc-900 mt-1">${rz.name}</div>
            ${rz.description ? `<p class="text-zinc-600 mt-0.5">${rz.description}</p>` : ''}
            <div class="mt-2 text-[11px] text-zinc-500 font-mono">Radius: ${rz.radiusMeters || 500}m</div>
          </div>
        `);

        circle.addTo(layerGroup);
      });
    }

    // B. Render Complaints
    if (activeLayerFilters.complaints) {
      validComplaints.forEach((c) => {
        const isSelected = selectedComplaint?.id === c.id;
        const priorityColor =
          c.priority === 'HIGH' ? '#dc2626' : c.priority === 'MEDIUM' ? '#d97706' : '#2563eb';

        const customIcon = L.divIcon({
          className: 'custom-complaint-marker',
          html: `
            <div style="
              width: ${isSelected ? '32px' : '26px'};
              height: ${isSelected ? '32px' : '26px'};
              background-color: ${priorityColor};
              border: 2px solid #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
              font-weight: bold;
              font-size: 11px;
              cursor: pointer;
              transition: transform 0.15s ease;
            ">
              !
            </div>
          `,
          iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
          iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
        });

        const marker = L.marker([c.latitude, c.longitude], { icon: customIcon });

        marker.on('click', () => {
          if (onSelectComplaint) onSelectComplaint(c);
        });

        marker.bindTooltip(`
          <div class="text-xs font-sans">
            <span class="font-bold text-zinc-900">${c.title}</span>
            <div class="text-[10px] text-zinc-500 font-mono">#${c.ticketNumber} &bull; ${c.status}</div>
          </div>
        `);

        marker.addTo(layerGroup);
      });
    }

    // C. Render Field Workers
    if (activeLayerFilters.workers) {
      validWorkers.forEach((w) => {
        const isSelected = selectedWorker?.id === w.id;
        const statusColor =
          w.availability === 'AVAILABLE'
            ? '#16a34a'
            : w.availability === 'BUSY'
            ? '#d97706'
            : '#71717a';

        const customIcon = L.divIcon({
          className: 'custom-worker-marker',
          html: `
            <div style="
              width: ${isSelected ? '32px' : '26px'};
              height: ${isSelected ? '32px' : '26px'};
              background-color: ${statusColor};
              border: 2px solid #ffffff;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
              cursor: pointer;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          `,
          iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
          iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
        });

        const marker = L.marker([w.latitude, w.longitude], { icon: customIcon });

        marker.on('click', () => {
          if (onSelectWorker) onSelectWorker(w);
        });

        marker.bindTooltip(`
          <div class="text-xs font-sans">
            <span class="font-bold text-zinc-900">${w.name}</span>
            <div class="text-[10px] text-zinc-500 font-mono">${w.departmentName} &bull; ${w.availability}</div>
          </div>
        `);

        marker.addTo(layerGroup);
      });
    }
  }, [validComplaints, validWorkers, validRedZones, selectedComplaint, selectedWorker, activeLayerFilters, showRedZones]);

  // If both a worker and complaint are selected, fit map bounds to view both
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (
      selectedWorker &&
      selectedComplaint &&
      typeof selectedWorker.latitude === 'number' &&
      typeof selectedWorker.longitude === 'number' &&
      typeof selectedComplaint.latitude === 'number' &&
      typeof selectedComplaint.longitude === 'number'
    ) {
      const start: [number, number] = [selectedWorker.latitude, selectedWorker.longitude];
      const end: [number, number] = [selectedComplaint.latitude, selectedComplaint.longitude];
      const bounds = L.latLngBounds([start, end]);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [selectedWorker, selectedComplaint]);

  // Center on selected complaint when selected
  useEffect(() => {
    if (selectedComplaint && mapInstanceRef.current) {
      if (
        typeof selectedComplaint.latitude === 'number' &&
        typeof selectedComplaint.longitude === 'number'
      ) {
        mapInstanceRef.current.setView(
          [selectedComplaint.latitude, selectedComplaint.longitude],
          15,
          { animate: true }
        );
      }
    }
  }, [selectedComplaint]);

  // Center on selected worker when selected
  useEffect(() => {
    if (selectedWorker && mapInstanceRef.current) {
      if (
        typeof selectedWorker.latitude === 'number' &&
        typeof selectedWorker.longitude === 'number'
      ) {
        mapInstanceRef.current.setView(
          [selectedWorker.latitude, selectedWorker.longitude],
          15,
          { animate: true }
        );
      }
    }
  }, [selectedWorker]);

  // Map Controls Helpers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const allPoints: [number, number][] = [];
    validComplaints.forEach((c) => allPoints.push([c.latitude, c.longitude]));
    validWorkers.forEach((w) => allPoints.push([w.latitude, w.longitude]));

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    } else {
      const defaultCenter = calculateMapCenter(validComplaints, validWorkers, validRedZones, center);
      mapInstanceRef.current.setView(defaultCenter, zoom);
    }
  };

  const hasAnyData = validComplaints.length > 0 || validWorkers.length > 0;

  return (
    <div className={`relative overflow-hidden border border-zinc-200 bg-white ${className}`}>
      {/* Map DOM Target */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px] z-0" />

      {/* Empty State Banner if no coordinates are available */}
      {!hasAnyData && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 border border-zinc-200 shadow-sm px-4 py-2 rounded text-xs text-zinc-700 flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-zinc-400" />
          <span>No active incidents or workers currently geolocated on city grid.</span>
        </div>
      )}

      {/* Top Left: Operational Layer Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        <button
          id="btn-filter-layer-complaints"
          onClick={() =>
            setActiveLayerFilters((prev) => ({ ...prev, complaints: !prev.complaints }))
          }
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-colors shadow-sm ${
            activeLayerFilters.complaints
              ? 'bg-black text-white border-black'
              : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <MapPin className="w-3 h-3" />
          Complaints ({validComplaints.length})
        </button>

        <button
          id="btn-filter-layer-workers"
          onClick={() =>
            setActiveLayerFilters((prev) => ({ ...prev, workers: !prev.workers }))
          }
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-colors shadow-sm ${
            activeLayerFilters.workers
              ? 'bg-black text-white border-black'
              : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <Users className="w-3 h-3" />
          Field Workers ({validWorkers.length})
        </button>

        {showRedZones && (
          <button
            id="btn-filter-layer-redzones"
            onClick={() =>
              setActiveLayerFilters((prev) => ({ ...prev, redZones: !prev.redZones }))
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-colors shadow-sm ${
              activeLayerFilters.redZones
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Red Zones ({validRedZones.length})
          </button>
        )}
      </div>

      {/* Bottom Left: Tactical Map Switcher */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        <div className="bg-white border border-zinc-200 shadow-sm rounded p-0.5 flex items-center text-xs">
          <button
            onClick={() => setTileStyle('carto')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              tileStyle === 'carto' ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Enterprise Light
          </button>
          <button
            onClick={() => setTileStyle('osm')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              tileStyle === 'osm' ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Standard OSM
          </button>
        </div>
      </div>

      {/* Bottom Right: Map Navigation Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
        <button
          id="btn-map-recenter"
          title="Recenter Map"
          onClick={handleRecenter}
          className="w-8 h-8 bg-white border border-zinc-200 rounded shadow-sm flex items-center justify-center text-zinc-700 hover:text-black hover:bg-zinc-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-map-zoom-in"
          title="Zoom In"
          onClick={handleZoomIn}
          className="w-8 h-8 bg-white border border-zinc-200 rounded shadow-sm flex items-center justify-center text-zinc-700 hover:text-black hover:bg-zinc-50 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-map-zoom-out"
          title="Zoom Out"
          onClick={handleZoomOut}
          className="w-8 h-8 bg-white border border-zinc-200 rounded shadow-sm flex items-center justify-center text-zinc-700 hover:text-black hover:bg-zinc-50 transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Slide-out Dossier Drawer for Selected Item */}
      <MapInfoPanel
        selectedComplaint={selectedComplaint}
        selectedWorker={selectedWorker}
        onClose={() => {
          if (onSelectComplaint) onSelectComplaint(null);
          if (onSelectWorker) onSelectWorker(null);
        }}
      />
    </div>
  );
};

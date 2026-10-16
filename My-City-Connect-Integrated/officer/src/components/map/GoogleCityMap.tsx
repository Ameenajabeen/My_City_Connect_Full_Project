/// <reference types="google.maps" />

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import type { Complaint, Worker, RedZone } from '../../types';
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

const mapsLoaderState = globalThis as typeof globalThis & {
  __mccGoogleMapsLoaderConfigured?: boolean;
};

export interface GoogleCityMapProps {
  complaints?: Complaint[];
  workers?: Worker[];
  redZones?: RedZone[];

  selectedComplaint?: Complaint | null;
  selectedWorker?: Worker | null;

  onSelectComplaint?: (complaint: Complaint | null) => void;
  onSelectWorker?: (worker: Worker | null) => void;

  showRedZones?: boolean;
  showHeatmap?: boolean;

  center?: {
    lat: number;
    lng: number;
  };

  zoom?: number;
  className?: string;

  onRouteCalculated?: (
    info: {
      distance: string;
      duration: string;
    } | null
  ) => void;
}

/* ---------------------------------------------------------
   Validate coordinates
--------------------------------------------------------- */

function isValidCoordinate(
  lat: unknown,
  lng: unknown
): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat !== 0 &&
    lng !== 0
  );
}

/* ---------------------------------------------------------
   Calculate initial map center
--------------------------------------------------------- */

function calculateMapCenter(
  complaints: Complaint[],
  workers: Worker[],
  redZones: RedZone[],
  explicitCenter?: {
    lat: number;
    lng: number;
  }
): {
  lat: number;
  lng: number;
} {
  // 1. Explicit center supplied by parent
  if (
    explicitCenter &&
    Number.isFinite(explicitCenter.lat) &&
    Number.isFinite(explicitCenter.lng)
  ) {
    return explicitCenter;
  }

  // 2. Saved city center
  if (typeof window !== 'undefined') {
    const savedLat = localStorage.getItem('mcc_city_lat');
    const savedLng = localStorage.getItem('mcc_city_lng');

    if (savedLat && savedLng) {
      const lat = Number.parseFloat(savedLat);
      const lng = Number.parseFloat(savedLng);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
  }

  // 3. Calculate from available geographic data
  const points: Array<{
    lat: number;
    lng: number;
  }> = [];

  complaints.forEach((complaint) => {
    if (
      isValidCoordinate(
        complaint.latitude,
        complaint.longitude
      )
    ) {
      points.push({
        lat: complaint.latitude,
        lng: complaint.longitude,
      });
    }
  });

  workers.forEach((worker) => {
    if (
      isValidCoordinate(
        worker.latitude,
        worker.longitude
      )
    ) {
      points.push({
        lat: worker.latitude,
        lng: worker.longitude!,
      });
    }
  });

  redZones.forEach((zone) => {
    if (
      isValidCoordinate(
        zone.centerLatitude,
        zone.centerLongitude
      )
    ) {
      points.push({
        lat: zone.centerLatitude,
        lng: zone.centerLongitude,
      });
    }
  });

  if (points.length > 0) {
    const lat =
      points.reduce((sum, point) => sum + point.lat, 0) /
      points.length;

    const lng =
      points.reduce((sum, point) => sum + point.lng, 0) /
      points.length;

    return {
      lat,
      lng,
    };
  }

  // 4. India fallback
  return {
    lat: 20.5937,
    lng: 78.9629,
  };
}

/* =========================================================
   GOOGLE CITY MAP
========================================================= */

export const GoogleCityMap: React.FC<GoogleCityMapProps> = ({
  complaints = [],
  workers = [],
  redZones = [],

  selectedComplaint = null,
  selectedWorker = null,

  onSelectComplaint = undefined,
  onSelectWorker = undefined,

  showRedZones = true,

  center = undefined,
  zoom = 13,

  className = 'w-full h-full min-h-[500px]',
}: GoogleCityMapProps) => {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<google.maps.Map | null>(null);

  const markersRef =
    useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const redZoneCirclesRef =
    useRef<google.maps.Circle[]>([]);

  const [mapReady, setMapReady] =
    useState(false);

  const [mapError, setMapError] =
    useState<string | null>(null);

  const [activeLayerFilters, setActiveLayerFilters] =
    useState({
      complaints: true,
      workers: true,
      redZones: true,
    });

  /* -------------------------------------------------------
     Valid complaints
  ------------------------------------------------------- */

  const validComplaints = useMemo(() => {
    return complaints.filter((complaint) =>
      isValidCoordinate(
        complaint.latitude,
        complaint.longitude
      )
    );
  }, [complaints]);

  /* -------------------------------------------------------
     Valid workers
  ------------------------------------------------------- */

  const validWorkers = useMemo(() => {
    return workers.filter((worker) =>
      isValidCoordinate(
        worker.latitude,
        worker.longitude
      )
    );
  }, [workers]);

  /* -------------------------------------------------------
     Valid red zones
  ------------------------------------------------------- */

  const validRedZones = useMemo(() => {
    return redZones.filter((zone) =>
      isValidCoordinate(
        zone.centerLatitude,
        zone.centerLongitude
      )
    );
  }, [redZones]);

  /* =======================================================
     1. INITIALIZE GOOGLE MAP
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const initializeMap = async () => {
      if (!mapContainerRef.current) {
        return;
      }

      const apiKey =
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        const message =
          'Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to .env.local';

        console.error(message);
        setMapError(message);
        return;
      }

      try {
        if (!mapsLoaderState.__mccGoogleMapsLoaderConfigured) {
          setOptions({
            key: apiKey,
            v: 'weekly',
          });
          mapsLoaderState.__mccGoogleMapsLoaderConfigured = true;
        }

        // Load Maps library
        const mapsLibrary =
          (await importLibrary(
            'maps'
          )) as google.maps.MapsLibrary;

        // Load marker library
        await importLibrary('marker');

        if (
          cancelled ||
          !mapContainerRef.current
        ) {
          return;
        }

        const initialCenter =
          calculateMapCenter(
            validComplaints,
            validWorkers,
            validRedZones,
            center
          );

        const map =
          new mapsLibrary.Map(
            mapContainerRef.current,
            {
              center: initialCenter,
              zoom,

              /*
               * DEMO_MAP_ID allows AdvancedMarkerElement
               * testing.
               *
               * Later we will replace this with your
               * production Google Cloud Map ID.
               */
              mapId: 'DEMO_MAP_ID',

              mapTypeControl: true,
              streetViewControl: false,
              fullscreenControl: true,
              zoomControl: false,
              clickableIcons: true,

              gestureHandling: 'greedy',
            }
          );

        mapRef.current = map;

        setMapReady(true);
        setMapError(null);
      } catch (error) {
        console.error(
          'Google Maps initialization failed:',
          error
        );

        setMapError(
          'Google Maps could not be loaded. Check your API key, billing, API restrictions, and browser console.'
        );
      }
    };

    initializeMap();

    return () => {
      cancelled = true;

      markersRef.current.forEach(
        (marker) => {
          marker.map = null;
        }
      );

      markersRef.current = [];

      redZoneCirclesRef.current.forEach(
        (circle: google.maps.Circle) => {
          circle.setMap(null);
        }
      );

      redZoneCirclesRef.current = [];

      mapRef.current = null;

      setMapReady(false);
    };

    // Initialization should happen once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     2. RENDER COMPLAINTS / WORKERS / RED ZONES
  ======================================================= */

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    let cancelled = false;

    const renderLayers = async () => {
      try {
        const markerLibrary =
          (await importLibrary(
            'marker'
          )) as google.maps.MarkerLibrary;

        if (cancelled || !mapRef.current) {
          return;
        }

        const map = mapRef.current;

        /* -----------------------------------------------
           Remove previous markers
        ------------------------------------------------ */

        markersRef.current.forEach(
          (marker: google.maps.marker.AdvancedMarkerElement) => {
            marker.map = null;
          }
        );

        markersRef.current = [];

        /* -----------------------------------------------
           Remove previous red zones
        ------------------------------------------------ */

        redZoneCirclesRef.current.forEach(
          (circle: google.maps.Circle) => {
            circle.setMap(null);
          }
        );

        redZoneCirclesRef.current = [];

        /* =================================================
           RED ZONES
        ================================================= */

        if (
          showRedZones &&
          activeLayerFilters.redZones
        ) {
          validRedZones.forEach((zone: RedZone) => {
            const circle =
              new google.maps.Circle({
                map,

                center: {
                  lat: zone.centerLatitude,
                  lng: zone.centerLongitude,
                },

                radius:
                  typeof zone.radiusMeters === 'number'
                    ? zone.radiusMeters
                    : 500,

                strokeColor: '#dc2626',
                strokeOpacity: 0.8,
                strokeWeight: 2,

                fillColor: '#ef4444',
                fillOpacity: 0.15,
              });

            redZoneCirclesRef.current.push(
              circle
            );
          });
        }

        /* =================================================
           COMPLAINT MARKERS
        ================================================= */

        if (
          activeLayerFilters.complaints
        ) {
          validComplaints.forEach(
            (complaint: Complaint) => {
              const selected =
                selectedComplaint?.id ===
                complaint.id;

              let background =
                '#2563eb';

              if (
                complaint.priority ===
                'HIGH'
              ) {
                background =
                  '#dc2626';
              } else if (
                complaint.priority ===
                'MEDIUM'
              ) {
                background =
                  '#d97706';
              }

              const pin =
                new markerLibrary.PinElement({
                  background,
                  borderColor:
                    '#ffffff',
                  glyphColor:
                    '#ffffff',
                  glyphText: '!',
                  scale: selected
                    ? 1.35
                    : 1,
                });

              const marker =
                new markerLibrary.AdvancedMarkerElement(
                  {
                    map,

                    position: {
                      lat: complaint.latitude,
                      lng: complaint.longitude,
                    },

                    title:
                      `${complaint.category} - ${complaint.ticketNumber ?? 'N/A'}`,

                    content:
                      pin.element,
                  }
                );

              marker.addListener(
                'click',
                () => {
                  onSelectComplaint?.(
                    complaint
                  );
                }
              );

              markersRef.current.push(
                marker
              );
            }
          );
        }

        /* =================================================
           WORKER MARKERS
        ================================================= */

        if (
          activeLayerFilters.workers
        ) {
          validWorkers.forEach(
            (worker: Worker) => {
              const selected =
                selectedWorker?.id ===
                worker.id;

              let background =
                '#71717a';

              if (
                worker.availability ===
                'AVAILABLE'
              ) {
                background =
                  '#16a34a';
              } else if (
                worker.availability ===
                'BUSY'
              ) {
                background =
                  '#d97706';
              }

              const pin =
                new markerLibrary.PinElement({
                  background,
                  borderColor:
                    '#ffffff',
                  glyphColor:
                    '#ffffff',
                  glyphText: 'W',
                  scale: selected
                    ? 1.35
                    : 1,
                });

              const marker =
                new markerLibrary.AdvancedMarkerElement(
                  {
                    map,

                    position: {
                      lat: worker.latitude!,
                      lng: worker.longitude!,
                    },

                    title:
                      `${worker.name} - ${worker.availability}`,

                    content:
                      pin.element,
                  }
                );

              marker.addListener(
                'click',
                () => {
                  onSelectWorker?.(
                    worker
                  );
                }
              );

              markersRef.current.push(
                marker
              );
            }
          );
        }
      } catch (error) {
        console.error(
          'Failed to render Google Maps layers:',
          error
        );
      }
    };

    renderLayers();

    return () => {
      cancelled = true;
    };
  }, [
    mapReady,
    validComplaints,
    validWorkers,
    validRedZones,
    selectedComplaint,
    selectedWorker,
    activeLayerFilters,
    showRedZones,
    onSelectComplaint,
    onSelectWorker,
  ]);

  /* =======================================================
     3. SELECTED COMPLAINT
  ======================================================= */

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !selectedComplaint ||
      !isValidCoordinate(
        selectedComplaint.latitude,
        selectedComplaint.longitude
      )
    ) {
      return;
    }

    map.panTo({
      lat: selectedComplaint.latitude,
      lng: selectedComplaint.longitude,
    });

    map.setZoom(16);
  }, [selectedComplaint]);

  /* =======================================================
     4. SELECTED WORKER
  ======================================================= */

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !selectedWorker ||
      !isValidCoordinate(
        selectedWorker.latitude,
        selectedWorker.longitude
      )
    ) {
      return;
    }

    map.panTo({
      lat: selectedWorker.latitude!,
      lng: selectedWorker.longitude!,
    });

    map.setZoom(16);
  }, [selectedWorker]);

  /* =======================================================
     5. SHOW WORKER + COMPLAINT TOGETHER
  ======================================================= */

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !selectedWorker ||
      !selectedComplaint
    ) {
      return;
    }

    if (
      !isValidCoordinate(
        selectedWorker.latitude,
        selectedWorker.longitude
      )
    ) {
      return;
    }

    if (
      !isValidCoordinate(
        selectedComplaint.latitude,
        selectedComplaint.longitude
      )
    ) {
      return;
    }

    const bounds =
      new google.maps.LatLngBounds();

    bounds.extend({
      lat: selectedWorker.latitude!,
      lng: selectedWorker.longitude!,
    });

    bounds.extend({
      lat: selectedComplaint.latitude!,
      lng: selectedComplaint.longitude!,
    });

    map.fitBounds(bounds, 80);
  }, [
    selectedWorker,
    selectedComplaint,
  ]);

  /* =======================================================
     6. ZOOM IN
  ======================================================= */

  const handleZoomIn = () => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const currentZoom =
      map.getZoom() ?? zoom;

    map.setZoom(currentZoom + 1);
  };

  /* =======================================================
     7. ZOOM OUT
  ======================================================= */

  const handleZoomOut = () => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const currentZoom =
      map.getZoom() ?? zoom;

    map.setZoom(
      Math.max(currentZoom - 1, 2)
    );
  };

  /* =======================================================
     8. RECENTER
  ======================================================= */

  const handleRecenter = () => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const points: Array<{
      lat: number;
      lng: number;
    }> = [];

    validComplaints.forEach(
      (complaint: Complaint) => {
        points.push({
          lat: complaint.latitude,
          lng: complaint.longitude,
        });
      }
    );

    validWorkers.forEach(
      (worker: Worker) => {
        points.push({
          lat: worker.latitude ?? 0,
          lng: worker.longitude ?? 0,
        });
      }
    );

    validRedZones.forEach(
      (zone: RedZone) => {
        points.push({
          lat: zone.centerLatitude,
          lng: zone.centerLongitude,
        });
      }
    );

    /* No geographic data */
    if (points.length === 0) {
      map.panTo(
        calculateMapCenter(
          validComplaints,
          validWorkers,
          validRedZones,
          center
        )
      );

      map.setZoom(zoom);

      return;
    }

    /* Fit all geographic data */
    const bounds =
      new google.maps.LatLngBounds();

    points.forEach((point: { lat: number; lng: number }) => {
      bounds.extend(point);
    });

    map.fitBounds(bounds, 60);
  };

  /* =======================================================
     9. DATA STATE
  ======================================================= */

  const hasAnyData =
    validComplaints.length > 0 ||
    validWorkers.length > 0;

  /* =======================================================
     10. UI
  ======================================================= */

  return (
    <div
      className={`relative overflow-hidden border border-zinc-200 bg-white ${className}`}
    >
      {/* ================================================
          GOOGLE MAP
      ================================================= */}

      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[500px]"
      />

      {/* ================================================
          MAP ERROR
      ================================================= */}

      {mapError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <h3 className="mb-2 text-sm font-bold text-zinc-900">
              Google Maps unavailable
            </h3>

            <p className="text-xs leading-5 text-zinc-600">
              {mapError}
            </p>
          </div>
        </div>
      )}

      {/* ================================================
          EMPTY STATE
      ================================================= */}

      {mapReady && !hasAnyData && (
        <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded border border-zinc-200 bg-white/95 px-4 py-2 text-xs text-zinc-700 shadow-sm">
            <Crosshair className="h-3.5 w-3.5 text-zinc-400" />

            <span>
              No active incidents or workers currently
              geolocated on city grid.
            </span>
          </div>
        </div>
      )}

      {/* ================================================
          LAYER FILTERS
      ================================================= */}

      {mapReady && (
        <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
          {/* Complaints */}

          <button
            id="btn-filter-layer-complaints"
            type="button"
            onClick={() =>
              setActiveLayerFilters(
                (previous) => ({
                  ...previous,
                  complaints:
                    !previous.complaints,
                })
              )
            }
            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors ${
              activeLayerFilters.complaints
                ? 'border-black bg-black text-white'
                : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <MapPin className="h-3 w-3" />

            Complaints (
            {validComplaints.length}
            )
          </button>

          {/* Workers */}

          <button
            id="btn-filter-layer-workers"
            type="button"
            onClick={() =>
              setActiveLayerFilters(
                (previous) => ({
                  ...previous,
                  workers:
                    !previous.workers,
                })
              )
            }
            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors ${
              activeLayerFilters.workers
                ? 'border-black bg-black text-white'
                : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <Users className="h-3 w-3" />

            Field Workers (
            {validWorkers.length}
            )
          </button>

          {/* Red Zones */}

          {showRedZones && (
            <button
              id="btn-filter-layer-redzones"
              type="button"
              onClick={() =>
                setActiveLayerFilters(
                  (previous) => ({
                    ...previous,
                    redZones:
                      !previous.redZones,
                  })
                )
              }
              className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors ${
                activeLayerFilters.redZones
                  ? 'border-red-600 bg-red-600 text-white'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />

              Red Zones (
              {validRedZones.length}
              )
            </button>
          )}
        </div>
      )}

      {/* ================================================
          MAP CONTROLS
      ================================================= */}

      {mapReady && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
          {/* Recenter */}

          <button
            id="btn-map-recenter"
            type="button"
            title="Recenter Map"
            onClick={handleRecenter}
            className="flex h-8 w-8 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 hover:text-black"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Zoom In */}

          <button
            id="btn-map-zoom-in"
            type="button"
            title="Zoom In"
            onClick={handleZoomIn}
            className="flex h-8 w-8 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 hover:text-black"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          {/* Zoom Out */}

          <button
            id="btn-map-zoom-out"
            type="button"
            title="Zoom Out"
            onClick={handleZoomOut}
            className="flex h-8 w-8 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 hover:text-black"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ================================================
          EXISTING INFORMATION PANEL
      ================================================= */}

      <MapInfoPanel
        selectedComplaint={
          selectedComplaint
        }
        selectedWorker={
          selectedWorker
        }
        onClose={() => {
          onSelectComplaint?.(null);
          onSelectWorker?.(null);
        }}
      />
    </div>
  );
};

export default GoogleCityMap;
/**
 * MY CITY CONNECT - Red Zones Page
 * Monitors high-density civic complaint clusters, severity heat zones, and municipal containment.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { RedZoneSeverityBadge } from '../components/common/Badge';
import { CityMap } from '../components/map/CityMap';
import { StateView } from '../components/common/StateView';
import { useApp } from '../context/AppContext';
import { redZoneService } from '../services/redZoneService';
import { RedZone } from '../types';
import {
  AlertOctagon,
  RefreshCw,
  MapPin,
  Building2,
  TrendingUp,
  Radio,
  FileText,
} from 'lucide-react';

export const RedZonesPage: React.FC = () => {
  const { refreshTrigger } = useApp();

  const [redZones, setRedZones] = useState<RedZone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [selectedZone, setSelectedZone] = useState<RedZone | null>(null);

  const loadRedZones = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await redZoneService.getRedZones();
      setRedZones(res);
      if (res.length > 0) {
        setSelectedZone(res[0]);
      }
    } catch {
      setIsError(true);
      setRedZones([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRedZones();
  }, [loadRedZones, refreshTrigger]);

  return (
    <PageContainer
      title="Civic Red Zone Density Areas"
      subtitle="Automated clustering analysis identifying municipal wards with acute complaint concentration requiring emergency mobilization."
      actions={
        <button
          id="btn-refresh-redzones"
          onClick={loadRedZones}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-calculate Clusters
        </button>
      }
    >
      <div className="space-y-6">
        {/* Tactical Map with Red Zone Overlays */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Geographic Cluster Map
            </h3>
            {redZones.length > 0 && (
              <span className="text-xs font-mono text-rose-400 font-bold">
                {redZones.length} Active High-Density Zones
              </span>
            )}
          </div>
          <CityMap redZones={redZones} className="w-full h-80 lg:h-96" />
        </div>

        {/* Zones Directory List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Active Municipal Red Zones
            </h3>
          </div>

          {isLoading ? (
            <StateView type="loading" title="Analyzing complaint density clusters..." />
          ) : isError ? (
            <StateView
              type="error"
              title="Unable to load red zones"
              message="Could not retrieve geospatial clusters from the backend API."
              onRetry={loadRedZones}
            />
          ) : redZones.length === 0 ? (
            <StateView
              type="empty"
              title="No red zones detected."
              message="Civic issue density is currently within normal municipal thresholds across all monitored sectors."
              onRetry={loadRedZones}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {redZones.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer bg-slate-900/60 backdrop-blur-xs flex flex-col justify-between ${
                      isSelected
                        ? 'border-rose-500/60 ring-1 ring-rose-500/30'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">
                            {zone.name}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-400">
                            {zone.ward || 'Municipal Ward'}
                          </span>
                        </div>
                        <RedZoneSeverityBadge severity={zone.severity} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                        <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Complaints
                          </span>
                          <span className="font-mono text-base font-extrabold text-white">
                            {zone.complaintCount}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Radius
                          </span>
                          <span className="font-mono text-base font-extrabold text-blue-400">
                            {zone.radiusMeters}m
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-300 pt-1">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            Top Issue: <strong className="text-white">{zone.topCategory}</strong>
                          </span>
                        </div>
                        {zone.departmentName && (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              Lead Dept: <strong className="text-white">{zone.departmentName}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Center: {zone.centerLatitude.toFixed(4)}, {zone.centerLongitude.toFixed(4)}</span>
                      {zone.activeWorkersDispatched !== undefined && (
                        <span className="text-emerald-400">
                          {zone.activeWorkersDispatched} Workers on site
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

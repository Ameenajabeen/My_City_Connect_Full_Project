/**
 * MY CITY CONNECT - Dashboard Page
 * High-performance operations command center overview.
 * White + Black Enterprise Visual Language.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { KPIGrid } from '../components/dashboard/KPIGrid';
import { RecentComplaints } from '../components/dashboard/RecentComplaints';
import { CityMap } from '../components/map/CityMap';
import { useApp } from '../context/AppContext';
import { complaintService } from '../services/complaintService';
import { workerService } from '../services/workerService';
import { redZoneService } from '../services/redZoneService';
import { Complaint, Worker, RedZone, DashboardKPIData } from '../types';
import {
  MapPin,
  RefreshCw,
  ArrowRight,
  WifiOff,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { backendConnected, isCheckingBackend, recheckConnection, refreshTrigger, navigate } =
    useApp();

  const [kpiData, setKpiData] = useState<DashboardKPIData | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [redZones, setRedZones] = useState<RedZone[]>([]);

  const [loadingKpi, setLoadingKpi] = useState<boolean>(true);
  const [loadingComplaints, setLoadingComplaints] = useState<boolean>(true);
  const [errorKpi, setErrorKpi] = useState<boolean>(false);
  const [errorComplaints, setErrorComplaints] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
    // 1. Fetch KPIs
    setLoadingKpi(true);
    setErrorKpi(false);
    try {
      const kpis = await complaintService.getDashboardKPIs();
      setKpiData(kpis);
    } catch {
      setErrorKpi(true);
      setKpiData(null);
    } finally {
      setLoadingKpi(false);
    }

    // 2. Fetch Recent Complaints
    setLoadingComplaints(true);
    setErrorComplaints(false);
    try {
      const recent = await complaintService.getComplaints({ limit: 8 });
      setComplaints(recent.data || []);
    } catch {
      setErrorComplaints(true);
      setComplaints([]);
    } finally {
      setLoadingComplaints(false);
    }

    // 3. Fetch Workers for Map
    try {
      const workerList = await workerService.getWorkers();
      setWorkers(workerList);
    } catch {
      setWorkers([]);
    }

    // 4. Fetch Red Zones
    try {
      const zones = await redZoneService.getRedZones();
      setRedZones(zones);
    } catch {
      setRedZones([]);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);

  return (
    <PageContainer
      title="Operations Command Center"
      subtitle="Real-time municipal telemetry, citizen complaint dispatch, and field workforce logistics monitoring."
      actions={
        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-dashboard"
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-800 hover:text-black bg-white hover:bg-zinc-50 border border-zinc-300 rounded transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-600" />
            Refresh Telemetry
          </button>
          <button
            id="btn-goto-live-map"
            onClick={() => navigate('/map')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded transition-colors shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5" />
            Open Tactical Map
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Connection status notice if backend is offline */}
        {!backendConnected && !isCheckingBackend && (
          <div className="rounded-lg border border-zinc-300 bg-zinc-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-zinc-800">
              <WifiOff className="w-5 h-5 shrink-0 text-zinc-600" />
              <div>
                <p className="font-bold text-zinc-900">Backend API Standby</p>
                <p className="text-zinc-600 mt-0.5">
                  Operating in standby mode. Live complaints and telemetry stream automatically once the NestJS backend API is online.
                </p>
              </div>
            </div>
            <button
              id="btn-dashboard-recheck-connection"
              onClick={recheckConnection}
              className="shrink-0 px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded font-bold transition-colors"
            >
              Test Backend Connection
            </button>
          </div>
        )}

        {/* 1. KPI Grid (6 metrics) */}
        <section aria-label="Key Performance Indicators">
          <KPIGrid data={kpiData} isLoading={loadingKpi} isError={errorKpi} />
        </section>

        {/* 2. Tactical Live Map Overview */}
        <section aria-label="Tactical City Overview" className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                City Tactical Map (Leaflet / OSM)
              </h2>
            </div>
            <button
              id="btn-dashboard-map-link"
              onClick={() => navigate('/map')}
              className="text-xs font-bold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1"
            >
              Full Screen Map Controls
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="border border-zinc-200 rounded-lg overflow-hidden shadow-xs bg-white">
            <CityMap
              complaints={complaints}
              workers={workers}
              redZones={redZones}
              onSelectComplaint={(c) => c && navigate(`/complaints/${c.id}`)}
              onSelectWorker={(w) => w && navigate(`/workers/${w.id}`)}
              className="w-full h-[400px] lg:h-[480px]"
            />
          </div>
        </section>

        {/* 3. Recent Complaints Table */}
        <section aria-label="Recent Citizen Complaints">
          <RecentComplaints
            complaints={complaints}
            isLoading={loadingComplaints}
            isError={errorComplaints}
            onRetry={fetchDashboardData}
          />
        </section>
      </div>
    </PageContainer>
  );
};

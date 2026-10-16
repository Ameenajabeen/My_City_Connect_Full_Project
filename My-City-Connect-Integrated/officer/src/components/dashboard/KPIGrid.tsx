/**
 * MY CITY CONNECT - Dashboard KPI Grid
 * Renders the 6 municipal command KPI metrics.
 */
import React from 'react';
import { KPIStatCard } from './KPIStatCard';
import { DashboardKPIData } from '../../types';
import {
  FileText,
  Clock,
  PlayCircle,
  ShieldCheck,
  AlertTriangle,
  HardHat,
} from 'lucide-react';

interface KPIGridProps {
  data?: DashboardKPIData | null;
  isLoading?: boolean;
  isError?: boolean;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ data, isLoading, isError }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Total Complaints */}
      <KPIStatCard
        id="kpi-total-complaints"
        title="Total Complaints"
        value={data?.totalComplaints}
        icon={FileText}
        variant="blue"
        isLoading={isLoading}
        isError={isError}
        trend={data?.trends?.totalTrend}
        emptyLabel="Data unavailable"
      />

      {/* 2. Pending */}
      <KPIStatCard
        id="kpi-pending-complaints"
        title="Pending"
        value={data?.pendingComplaints}
        icon={Clock}
        variant="amber"
        isLoading={isLoading}
        isError={isError}
        trend={data?.trends?.pendingTrend}
        emptyLabel="Data unavailable"
      />

      {/* 3. In Progress */}
      <KPIStatCard
        id="kpi-in-progress"
        title="In Progress"
        value={data?.inProgressComplaints}
        icon={PlayCircle}
        variant="purple"
        isLoading={isLoading}
        isError={isError}
        trend={data?.trends?.inProgressTrend}
        emptyLabel="Data unavailable"
      />

      {/* 4. Resolved */}
      <KPIStatCard
        id="kpi-resolved"
        title="Resolved"
        value={data?.resolvedComplaints}
        icon={ShieldCheck}
        variant="emerald"
        isLoading={isLoading}
        isError={isError}
        trend={data?.trends?.resolvedTrend}
        emptyLabel="Data unavailable"
      />

      {/* 5. High Priority */}
      <KPIStatCard
        id="kpi-high-priority"
        title="High Priority"
        value={data?.highPriorityComplaints}
        icon={AlertTriangle}
        variant="rose"
        isLoading={isLoading}
        isError={isError}
        trend={data?.trends?.highPriorityTrend}
        emptyLabel="Data unavailable"
      />

      {/* 6. Active Workers */}
      <KPIStatCard
        id="kpi-active-workers"
        title="Active Workers"
        value={data?.activeWorkers}
        subtitle={data?.totalWorkers ? `of ${data.totalWorkers} total` : undefined}
        icon={HardHat}
        variant="slate"
        isLoading={isLoading}
        isError={isError}
        trend={data?.trends?.activeWorkersTrend}
        emptyLabel="Data unavailable"
      />
    </div>
  );
};

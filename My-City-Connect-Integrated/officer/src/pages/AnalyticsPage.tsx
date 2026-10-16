/**
 * MY CITY CONNECT - Analytics & Civic Intelligence Page
 * Uses Recharts to visualize real backend complaint trends, category distributions, and SLA metrics.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { StateView } from '../components/common/StateView';
import { useApp } from '../context/AppContext';
import { analyticsService } from '../services/analyticsService';
import { departmentService } from '../services/departmentService';
import { AnalyticsData, Department } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Clock,
  TrendingUp,
  PieChart as PieIcon,
  Building2,
} from 'lucide-react';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const AnalyticsPage: React.FC = () => {
  const { refreshTrigger } = useApp();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Filters
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '3m'>('30d');
  const [departmentId, setDepartmentId] = useState<string | 'ALL'>('ALL');

  // Fetch departments
  useEffect(() => {
    departmentService
      .getDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await analyticsService.getAnalytics({
        period,
        departmentId: departmentId !== 'ALL' ? departmentId : undefined,
      });
      setAnalytics(res);
    } catch {
      setIsError(true);
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  }, [period, departmentId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, refreshTrigger]);

  const hasData =
    analytics &&
    ((analytics.trendsOverTime && analytics.trendsOverTime.length > 0) ||
      (analytics.categoryBreakdown && analytics.categoryBreakdown.length > 0) ||
      (analytics.departmentResolutionTimes && analytics.departmentResolutionTimes.length > 0) ||
      (analytics.wardPerformance && analytics.wardPerformance.length > 0));

  return (
    <PageContainer
      title="City-Wide Operations Analytics"
      subtitle="Data intelligence on complaint velocity, resolution lead times, and municipal departmental workloads."
      actions={
        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-analytics"
            onClick={loadAnalytics}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Analytics
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Controls & Filter Bar */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Selector */}
            <div className="flex rounded-lg bg-slate-950 border border-slate-700/80 p-0.5">
              {(['today', '7d', '30d', '3m'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    period === p
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p === 'today'
                    ? 'Today'
                    : p === '7d'
                    ? 'Past 7 Days'
                    : p === '30d'
                    ? 'Past 30 Days'
                    : 'Past 3 Months'}
                </button>
              ))}
            </div>

            {/* Department Filter */}
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400">
            Telemetry Period:{' '}
            <strong className="text-white">
              {period === 'today'
                ? 'Current Day'
                : period === '7d'
                ? 'Last 7 Days'
                : period === '30d'
                ? 'Rolling 30 Days'
                : 'Quarterly'}
            </strong>
          </div>
        </div>

        {/* State View if Loading, Error, or Empty */}
        {isLoading ? (
          <StateView type="loading" title="Compiling operational analytics charts..." />
        ) : isError ? (
          <StateView
            type="error"
            title="Unable to load analytics"
            message="The analytics aggregation service is currently unreachable."
            onRetry={loadAnalytics}
          />
        ) : !hasData ? (
          <StateView
            type="empty"
            title="No analytics data available for the selected period."
            message="As citizen complaints and worker resolutions are recorded, historical analytics and throughput trends will populate here automatically."
            onRetry={loadAnalytics}
          />
        ) : (
          <div className="space-y-6">
            {/* Top Row: Trend Chart (Full Width) */}
            {analytics?.trendsOverTime && analytics.trendsOverTime.length > 0 && (
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Complaint Velocity & Resolution Trends
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Real-time Backend Aggregates</span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics.trendsOverTime}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="complaints"
                        name="Reported Issues"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorComplaints)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        name="Resolved Issues"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorResolved)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Bottom 2-Col Grid: Category Breakdown & Resolution Times */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown Bar Chart */}
              {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 && (
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Complaints by Category
                    </h3>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.categoryBreakdown}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" fontSize={11} />
                        <YAxis
                          type="category"
                          dataKey="category"
                          stroke="#64748b"
                          fontSize={10}
                          width={90}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            color: '#f8fafc',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="count" name="Issues Count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                          {analytics.categoryBreakdown.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Department Resolution Times */}
              {analytics?.departmentResolutionTimes &&
                analytics.departmentResolutionTimes.length > 0 && (
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Average Resolution Time (Hours)
                      </h3>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.departmentResolutionTimes}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="department" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '8px',
                              color: '#f8fafc',
                              fontSize: '12px',
                            }}
                          />
                          <Bar
                            dataKey="avgHours"
                            name="Avg Hours to Resolve"
                            fill="#f59e0b"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

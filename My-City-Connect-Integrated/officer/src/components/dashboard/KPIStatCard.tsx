/**
 * MY CITY CONNECT - KPI Stat Card
 * Enterprise White + Black high-contrast metric card.
 */
import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface KPIStatCardProps {
  id?: string;
  title: string;
  value?: number | string | null;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  variant?: 'blue' | 'rose' | 'amber' | 'emerald' | 'purple' | 'slate';
  isLoading?: boolean;
  isError?: boolean;
  emptyLabel?: string;
}

export const KPIStatCard: React.FC<KPIStatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel = 'vs last period',
  isLoading = false,
  isError = false,
  emptyLabel = '0',
}) => {
  return (
    <div
      id={id}
      className="p-5 rounded-lg border border-zinc-200 bg-white shadow-xs hover:border-zinc-400 transition-colors flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            {title}
          </span>
          {subtitle && <p className="text-[11px] text-zinc-400">{subtitle}</p>}
        </div>
        <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-20 bg-zinc-100 animate-pulse rounded" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-1.5 text-red-600 py-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold">Unavailable</span>
          </div>
        ) : value === undefined || value === null ? (
          <div className="py-1">
            <span className="text-2xl font-mono font-bold text-zinc-400">
              {emptyLabel}
            </span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 tracking-tight font-mono">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
          </div>
        )}

        {!isLoading && !isError && trend !== undefined && (
          <div className="mt-2.5 flex items-center gap-1 text-[11px] font-mono">
            {trend > 0 ? (
              <span className="inline-flex items-center text-red-600 font-bold">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +{trend}%
              </span>
            ) : trend < 0 ? (
              <span className="inline-flex items-center text-emerald-600 font-bold">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                {trend}%
              </span>
            ) : (
              <span className="inline-flex items-center text-zinc-500">
                <Minus className="w-3 h-3 mr-0.5" />
                0%
              </span>
            )}
            <span className="text-zinc-500 ml-1">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

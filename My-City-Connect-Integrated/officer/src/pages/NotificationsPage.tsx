/**
 * MY CITY CONNECT - Notifications & Alerts Page
 * Streams real-time alerts, citizen complaint arrivals, and worker status changes.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { StateView } from '../components/common/StateView';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notificationService';
import { DashboardNotification } from '../types';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  HardHat,
  AlertOctagon,
  RefreshCw,
  Clock,
  CheckCheck,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { refreshTrigger, setUnreadCount, navigate } = useApp();

  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res);
      setUnreadCount(res.filter((n) => !n.read).length);
    } catch {
      setIsError(true);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications, refreshTrigger]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  const getIcon = (type: DashboardNotification['type']) => {
    switch (type) {
      case 'HIGH_PRIORITY_COMPLAINT':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'RED_ZONE_DETECTED':
        return <AlertOctagon className="w-4 h-4 text-amber-400" />;
      case 'WORKER_LOCATION_UPDATED':
      case 'WORKER_ASSIGNED':
      case 'WORKER_ACCEPTED':
        return <HardHat className="w-4 h-4 text-slate-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <PageContainer
      title="Real-Time Telemetry & Alerts"
      subtitle="Operational event stream capturing critical civic incidents, worker dispatches, and emergency escalations."
      actions={
        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.read) && (
            <button
              id="btn-mark-all-read"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 rounded-lg transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark All Read
            </button>
          )}
          <button
            id="btn-refresh-notifications"
            onClick={loadNotifications}
            className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="space-y-4 max-w-4xl">
        {isLoading ? (
          <StateView type="loading" title="Retrieving notification stream..." />
        ) : isError ? (
          <StateView
            type="error"
            title="Failed to load notifications"
            message="Could not connect to the alerts service."
            onRetry={loadNotifications}
          />
        ) : notifications.length === 0 ? (
          <StateView
            type="empty"
            title="No notifications or alerts at this time."
            message="Telemetry notices, emergency red zone escalations, and citizen complaint notifications will stream here in real time."
            onRetry={loadNotifications}
          />
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read) handleMarkAsRead(n.id);
                  if (n.complaintId) navigate(`/complaints/${n.complaintId}`);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  n.read
                    ? 'border-slate-800/80 bg-slate-900/40 text-slate-400'
                    : 'border-blue-500/30 bg-blue-950/20 text-slate-200'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    n.read
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs font-bold leading-tight truncate ${
                        n.read ? 'text-slate-300' : 'text-white'
                      }`}
                    >
                      {n.title}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(n.createdAt || n.timestamp || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>

                  <div className="mt-2 flex items-center gap-3 text-[11px]">
                    <span className="font-mono text-blue-400 font-semibold uppercase text-[10px]">
                      {n.type.replace('_', ' ')}
                    </span>
                    {n.complaintId && (
                      <span className="text-slate-400 hover:text-blue-300">
                        View Complaint #{n.complaintId} →
                      </span>
                    )}
                  </div>
                </div>

                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

/**
 * MY CITY CONNECT - Unified State Viewer
 * Enterprise White + Black styling for Loading, Empty, Error, and Standby representations.
 */
import React from 'react';
import {
  AlertCircle,
  Inbox,
  RefreshCw,
  WifiOff,
  Loader2,
} from 'lucide-react';

interface StateViewProps {
  type: 'loading' | 'empty' | 'error' | 'offline';
  title?: string;
  message?: string;
  onRetry?: () => void;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export const StateView: React.FC<StateViewProps> = ({
  type,
  title,
  message,
  onRetry,
  actionText,
  onAction,
  className = '',
  icon,
}) => {
  if (type === 'loading') {
    return (
      <div
        className={`flex flex-col items-center justify-center py-16 px-6 text-center rounded-lg border border-zinc-200 bg-white ${className}`}
      >
        <div className="w-10 h-10 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-3">
          <Loader2 className="w-5 h-5 text-zinc-900 animate-spin" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900">
          {title || 'Loading data from backend...'}
        </h3>
        <p className="mt-1 text-xs text-zinc-500 max-w-md">
          {message || 'Querying active municipal records. Please stand by.'}
        </p>
      </div>
    );
  }

  if (type === 'empty') {
    return (
      <div
        className={`flex flex-col items-center justify-center py-16 px-6 text-center rounded-lg border border-zinc-200 bg-white ${className}`}
      >
        <div className="w-10 h-10 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-3 text-zinc-600">
          {icon || <Inbox className="w-5 h-5 text-zinc-600" />}
        </div>
        <h3 className="text-sm font-bold text-zinc-900">
          {title || 'No records available'}
        </h3>
        <p className="mt-1 text-xs text-zinc-500 max-w-md">
          {message || 'There are currently no records returned by the backend service.'}
        </p>
        {(actionText || onRetry) && (
          <div className="mt-4 flex items-center gap-2">
            {onRetry && (
              <button
                id="btn-retry-empty-state"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded border border-zinc-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Data
              </button>
            )}
            {actionText && onAction && (
              <button
                id="btn-action-empty-state"
                onClick={onAction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded transition-colors"
              >
                {actionText}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (type === 'offline') {
    return (
      <div
        className={`flex flex-col items-center justify-center py-16 px-6 text-center rounded-lg border border-zinc-200 bg-white ${className}`}
      >
        <div className="w-10 h-10 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-3 text-zinc-700">
          {icon || <WifiOff className="w-5 h-5 text-zinc-700" />}
        </div>
        <h3 className="text-sm font-bold text-zinc-900">
          {title || 'Backend service on standby'}
        </h3>
        <p className="mt-1 text-xs text-zinc-500 max-w-md">
          {message || 'Connect the NestJS API service to populate live citizen telemetry.'}
        </p>
        {onRetry && (
          <button
            id="btn-reconnect-backend"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Connection
          </button>
        )}
      </div>
    );
  }

  // Error state
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center rounded-lg border border-red-200 bg-white ${className}`}
    >
      <div className="w-10 h-10 rounded bg-red-50 border border-red-200 flex items-center justify-center mb-3 text-red-600">
        {icon || <AlertCircle className="w-5 h-5 text-red-600" />}
      </div>
      <h3 className="text-sm font-bold text-zinc-900">
        {title || 'Unable to load data'}
      </h3>
      <p className="mt-1 text-xs text-zinc-500 max-w-md">
        {message || 'An error occurred while communicating with the backend API.'}
      </p>
      {onRetry && (
        <button
          id="btn-retry-error-state"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded border border-zinc-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};

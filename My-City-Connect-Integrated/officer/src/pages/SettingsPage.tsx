/**
 * MY CITY CONNECT - System Settings & Diagnostics Page
 * Allows configuring and testing backend API endpoints, municipal GIS center coordinates, and officer session.
 * Fully OpenStreetMap + Leaflet (No Google Maps API Key or Billing Required).
 */
import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useApp } from '../context/AppContext';
import { apiClient, getApiBaseUrl } from '../services/apiClient';
import {
  Server,
  MapPin,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Compass,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { officer, recheckConnection } = useApp();

  const [customApiUrl, setCustomApiUrl] = useState<string>(() => {
    return localStorage.getItem('mcc_api_url') || getApiBaseUrl();
  });

  const [cityLat, setCityLat] = useState<string>(() => {
    return localStorage.getItem('mcc_city_lat') || '';
  });

  const [cityLng, setCityLng] = useState<string>(() => {
    return localStorage.getItem('mcc_city_lng') || '';
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'failed';
    message: string;
    latencyMs?: number;
  }>({
    status: 'idle',
    message: '',
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (customApiUrl) {
      localStorage.setItem('mcc_api_url', customApiUrl.trim());
    }

    if (cityLat.trim()) {
      localStorage.setItem('mcc_city_lat', cityLat.trim());
    } else {
      localStorage.removeItem('mcc_city_lat');
    }

    if (cityLng.trim()) {
      localStorage.setItem('mcc_city_lng', cityLng.trim());
    } else {
      localStorage.removeItem('mcc_city_lng');
    }

    // Clean up any old Google Maps legacy items
    localStorage.removeItem('mcc_gmaps_key');
    localStorage.removeItem('mcc_gmaps_billing_disabled_key');

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    recheckConnection();
  };

  const handleTestConnection = async () => {
    setTestResult({ status: 'testing', message: 'Pinging backend endpoint...' });
    const startTime = performance.now();
    try {
      const res = await apiClient.checkConnection();
      const latency = Math.round(performance.now() - startTime);
      if (res.connected) {
        setTestResult({
          status: 'success',
          message: res.message || 'Connected successfully to NestJS backend service.',
          latencyMs: latency,
        });
      } else {
        setTestResult({
          status: 'failed',
          message: res.message || 'Backend responded with an error status.',
          latencyMs: latency,
        });
      }
    } catch {
      const latency = Math.round(performance.now() - startTime);
      setTestResult({
        status: 'failed',
        message: 'Unable to reach the specified API URL. Verify the backend service is running.',
        latencyMs: latency,
      });
    }
  };

  return (
    <PageContainer
      title="System & API Configuration"
      subtitle="Configure connection endpoints, municipal GIS map parameters, and inspect officer session credentials."
    >
      <div className="space-y-6 max-w-4xl">
        {savedSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Settings saved successfully. Re-syncing connection state.</span>
          </div>
        )}

        {/* Backend API Configuration */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">NestJS Backend API Gateway</h3>
              <p className="text-xs text-slate-400">
                Configure the REST and WebSocket base URL for citizen complaints and worker dispatches
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                API Base URL
              </label>
              <div className="flex gap-2">
                <input
                  id="input-backend-api-url"
                  type="text"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  placeholder="e.g. http://localhost:5000 or /api"
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
                <button
                  id="btn-test-connection"
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testResult.status === 'testing'}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1.5 shrink-0"
                >
                  {testResult.status === 'testing' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  Test Ping
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Currently targeting:{' '}
                <strong className="text-slate-300 font-mono">{customApiUrl || '/api'}</strong>
              </p>
            </div>

            {/* Test result banner */}
            {testResult.status !== 'idle' && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2.5 border ${
                  testResult.status === 'success'
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                    : testResult.status === 'failed'
                    ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300'
                }`}
              >
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : testResult.status === 'failed' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-spin" />
                )}
                <div>
                  <span className="font-semibold block">{testResult.message}</span>
                  {testResult.latencyMs !== undefined && (
                    <span className="text-[10px] font-mono text-slate-400">
                      Roundtrip Latency: {testResult.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Municipal GIS Center Coordinates */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Compass className="w-4 h-4 text-emerald-400" />
                Municipal GIS Default Coordinates (OpenStreetMap + Leaflet)
              </div>
              <p className="text-[11px] text-slate-400">
                The map automatically derives its viewport center from real active incidents and workers in MySQL.
                You can optionally configure explicit coordinates for your municipality below:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Municipal Center Latitude
                  </label>
                  <input
                    id="input-city-lat"
                    type="number"
                    step="any"
                    value={cityLat}
                    onChange={(e) => setCityLat(e.target.value)}
                    placeholder="e.g. 12.9716 (optional)"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Municipal Center Longitude
                  </label>
                  <input
                    id="input-city-lng"
                    type="number"
                    step="any"
                    value={cityLng}
                    onChange={(e) => setCityLng(e.target.value)}
                    placeholder="e.g. 77.5946 (optional)"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Zero external API keys or billing accounts needed. 100% Free OpenStreetMap tile layers.</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3">
              <button
                id="btn-save-settings"
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Officer Session Profile */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Authenticated Officer Session</h3>
              <p className="text-xs text-slate-400">
                Credentials verified via JWT bearer authorization
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Officer Name</span>
              <span className="font-semibold text-slate-200">{officer?.name || 'Officer'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Authorized Role</span>
              <span className="font-semibold text-blue-400">{officer?.role || 'OFFICER'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Officer ID</span>
              <span className="font-mono text-slate-300">{officer?.id || '—'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Assigned Department</span>
              <span className="text-slate-300">{officer?.departmentName || 'City Central Command'}</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

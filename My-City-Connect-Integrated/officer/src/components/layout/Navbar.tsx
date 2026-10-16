/**
 * MY CITY CONNECT - Top Navbar
 * Enterprise White + Black styling for Municipal Operations Command Center.
 */
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Bell,
  Wifi,
  WifiOff,
  Menu,
  RefreshCw,
  User,
  Shield,
  Clock,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentPath,
    navigate,
    backendConnected,
    isCheckingBackend,
    recheckConnection,
    officer,
    logout,
    unreadCount,
    setIsMobileDrawerOpen,
    globalSearch,
    setGlobalSearch,
    triggerRefresh,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (path: string): string => {
    if (path.startsWith('/complaints/')) return 'Incident Dossier';
    if (path.startsWith('/workers/')) return 'Personnel Dossier';
    switch (path) {
      case '/dashboard':
        return 'Operations Command Center';
      case '/complaints':
        return 'Civic Complaints Register';
      case '/map':
        return 'City Tactical Live Map (Leaflet)';
      case '/workers':
        return 'Field Workforce Directory';
      case '/red-zones':
        return 'Grievance Clusters & Red Zones';
      case '/departments':
        return 'Municipal Departments';
      case '/analytics':
        return 'City Operations Analytics';
      case '/notifications':
        return 'Real-Time Alerts & Telemetry';
      case '/settings':
        return 'System & Backend Settings';
      case '/login':
        return 'Officer Authentication';
      default:
        return 'Officer Command Center';
    }
  };

  return (
    <header className="h-16 sticky top-0 z-30 bg-white border-b border-zinc-200 px-4 lg:px-6 flex items-center justify-between gap-4">
      {/* Left side: Mobile Menu + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="btn-open-mobile-drawer"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="md:hidden p-2 rounded text-zinc-600 hover:text-black hover:bg-zinc-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <h1 className="text-base font-bold text-zinc-900 truncate tracking-tight">
            {getPageTitle(currentPath)}
          </h1>
          <p className="hidden sm:block text-xs text-zinc-500 truncate">
            MY CITY CONNECT • Municipal Operations Command
          </p>
        </div>
      </div>

      {/* Middle: Global Search Input */}
      <div className="hidden lg:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            id="input-global-search"
            type="text"
            placeholder="Search complaints, workers, ticket #..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded bg-zinc-50 border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 hover:text-black bg-zinc-200 px-1.5 py-0.5 rounded"
            >
              ESC
            </button>
          )}
        </div>
      </div>

      {/* Right side: Clock, Backend Status, Notification, Profile */}
      <div className="flex items-center gap-2.5 md:gap-3 shrink-0">
        {/* Real-time Clock */}
        <div className="hidden xl:flex flex-col text-right pr-3 border-r border-zinc-200">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-900">
            <Clock className="w-3.5 h-3.5 text-zinc-600" />
            <span>{currentTime || '00:00:00'}</span>
          </div>
          <span className="text-[10px] text-zinc-500">{currentDate}</span>
        </div>

        {/* Backend Connection Indicator */}
        <button
          id="btn-navbar-connection-status"
          onClick={recheckConnection}
          disabled={isCheckingBackend}
          title={backendConnected ? 'NestJS Backend Connected (Click to re-ping)' : 'Backend Standby (Click to retry)'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold tracking-wider transition-all border ${
            backendConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
          }`}
        >
          {isCheckingBackend ? (
            <RefreshCw className="w-3 h-3 animate-spin text-zinc-500" />
          ) : backendConnected ? (
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
          ) : (
            <WifiOff className="w-3 h-3 text-zinc-500" />
          )}
          <span className="text-[10px] font-mono font-bold">
            {backendConnected ? 'ONLINE' : 'STANDBY'}
          </span>
        </button>

        {/* Quick manual refresh */}
        <button
          id="btn-global-refresh"
          onClick={triggerRefresh}
          title="Refresh All Operations Data"
          className="p-2 rounded text-zinc-600 hover:text-black hover:bg-zinc-100 border border-zinc-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Notifications Icon Button */}
        <button
          id="btn-navbar-notifications"
          onClick={() => navigate('/notifications')}
          title="Alerts & Notifications"
          className="relative p-2 rounded text-zinc-600 hover:text-black hover:bg-zinc-100 border border-zinc-200 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Officer Profile Menu */}
        <div className="relative">
          <button
            id="btn-officer-profile-menu"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-100 border border-transparent hover:border-zinc-200 transition-colors"
          >
            <div className="w-8 h-8 rounded bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
              {officer?.name ? officer.name.charAt(0).toUpperCase() : <Shield className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-semibold text-zinc-900 leading-none truncate max-w-[120px]">
                {officer?.name || 'Duty Officer'}
              </span>
              <span className="block text-[10px] text-zinc-500 leading-none mt-1">
                {officer?.role ? officer.role.replace('_', ' ') : 'OFFICER'}
              </span>
            </div>
            <ChevronDown className="hidden sm:block w-3 h-3 text-zinc-400" />
          </button>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded border border-zinc-200 bg-white p-1 text-zinc-900 shadow-xl z-50 animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-zinc-100">
                  <p className="text-xs font-bold text-zinc-900">{officer?.name || 'Municipal Officer'}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{officer?.email || 'officer@city.gov'}</p>
                  <p className="mt-1 text-[10px] font-mono text-zinc-600">
                    Badge: {officer?.badgeNumber || 'MCC-OFF-01'}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    id="btn-menu-settings"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 hover:text-black hover:bg-zinc-100 rounded transition-colors text-left"
                  >
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    Officer Preferences
                  </button>
                  <button
                    id="btn-menu-logout"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded transition-colors text-left font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out Command Center
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

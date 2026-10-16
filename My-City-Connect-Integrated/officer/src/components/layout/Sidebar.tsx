/**
 * MY CITY CONNECT - Sidebar Navigation
 * Professional Enterprise White + Black Navigation Shell.
 */
import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  MapPin,
  Users,
  AlertOctagon,
  Building2,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  X,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const {
    currentPath,
    navigate,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    officer,
    logout,
    unreadCount,
    backendConnected,
  } = useApp();

  const navItems: NavItem[] = [
    { id: 'nav-dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'nav-complaints', label: 'Complaints', path: '/complaints', icon: FileSpreadsheet },
    { id: 'nav-map', label: 'Live Map', path: '/map', icon: MapPin },
    { id: 'nav-workers', label: 'Field Workers', path: '/workers', icon: Users },
    { id: 'nav-red-zones', label: 'Red Zones', path: '/red-zones', icon: AlertOctagon },
    { id: 'nav-departments', label: 'Departments', path: '/departments', icon: Building2 },
    { id: 'nav-analytics', label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { id: 'nav-notifications', label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { id: 'nav-settings', label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const sidebarContent = (
    <aside
      className={`h-full flex flex-col justify-between bg-white border-r border-zinc-200 text-zinc-900 transition-all duration-200 select-none ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200">
          <div
            onClick={() => handleNavClick('/dashboard')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            <div className="w-9 h-9 rounded bg-black flex items-center justify-center text-white font-bold shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="leading-tight overflow-hidden">
                <span className="block text-sm font-extrabold tracking-wider text-zinc-900">
                  MY CITY CONNECT
                </span>
                <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                  Command Center
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse button */}
          <button
            id="btn-toggle-sidebar"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-1.5 rounded text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            id="btn-close-mobile-drawer"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="md:hidden p-1.5 rounded text-zinc-500 hover:text-black hover:bg-zinc-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPath === item.path ||
              (item.path !== '/dashboard' && currentPath.startsWith(item.path));

            return (
              <button
                key={item.id}
                id={item.id}
                onClick={() => handleNavClick(item.path)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-black text-white font-bold shadow-sm'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-500 group-hover:text-black'
                  }`}
                />
                {!isSidebarCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {/* Badge if present */}
                {Boolean(item.badge && item.badge > 0) && (
                  <span
                    className={`shrink-0 text-[10px] font-bold rounded-full px-1.5 py-0.2 min-w-4 text-center ${
                      isActive
                        ? 'bg-white text-black'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on hover when collapsed */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-black text-white text-xs font-semibold rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                    {Boolean(item.badge && item.badge > 0) && ` (${item.badge})`}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Status Section */}
      <div className="p-3 border-t border-zinc-200 bg-zinc-50">
        {/* Connection status indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded text-[11px] mb-2 border ${
            backendConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-zinc-100 text-zinc-700 border-zinc-300'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              backendConnected ? 'bg-emerald-600' : 'bg-zinc-400'
            }`}
          />
          {!isSidebarCollapsed && (
            <span className="truncate font-bold uppercase tracking-wider text-[10px]">
              {backendConnected ? 'Backend Live' : 'Backend Standby'}
            </span>
          )}
        </div>

        {/* Officer info */}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded hover:bg-zinc-100 transition-colors">
          <div className="w-8 h-8 rounded bg-zinc-900 text-white flex items-center justify-center font-bold shrink-0 text-xs">
            {officer?.name ? officer.name.charAt(0).toUpperCase() : 'O'}
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-900 truncate leading-tight">
                {officer?.name || 'Duty Officer'}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {officer?.role ? officer.role.replace('_', ' ') : 'MUNICIPAL OFFICER'}
              </p>
            </div>
          )}
          {!isSidebarCollapsed && (
            <button
              id="btn-logout-sidebar"
              onClick={logout}
              title="Sign Out"
              className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-zinc-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-72 h-full shadow-2xl animate-in slide-in-from-left duration-150">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

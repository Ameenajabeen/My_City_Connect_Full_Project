/**
 * MY CITY CONNECT - Officer Command Center
 * Main Application Shell & Route Orchestrator
 * Enterprise White + Black styling
 */
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { WorkersPage } from './pages/WorkersPage';
import { WorkerDetailPage } from './pages/WorkerDetailPage';
import { RedZonesPage } from './pages/RedZonesPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

const RouterView: React.FC = () => {
  const { currentPath, officer } = useApp();
  const routePath = currentPath.split('?')[0];

  // If path is login, show standalone login page
  if (routePath === '/login') {
    return <LoginPage />;
  }

  if (!officer) {
    return <LoginPage />;
  }

  // Determine current page component
  const renderCurrentPage = () => {
    // Dynamic Route: /complaints/:id
    if (routePath.startsWith('/complaints/')) {
      const complaintId = routePath.replace('/complaints/', '');
      return <ComplaintDetailPage complaintId={complaintId} />;
    }

    // Dynamic Route: /workers/:id
    if (routePath.startsWith('/workers/')) {
      const workerId = routePath.replace('/workers/', '');
      return <WorkerDetailPage workerId={workerId} />;
    }

    switch (routePath) {
      case '/dashboard':
        return <DashboardPage />;
      case '/complaints':
        return <ComplaintsPage key={currentPath} />;
      case '/map':
        return <LiveMapPage />;
      case '/workers':
        return <WorkersPage key={currentPath} />;
      case '/red-zones':
        return <RedZonesPage />;
      case '/departments':
        return <DepartmentsPage />;
      case '/analytics':
        return <AnalyticsPage />;
      case '/notifications':
        return <NotificationsPage />;
      case '/settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-100 text-zinc-900 overflow-hidden font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Operational Navbar */}
        <Navbar />

        {/* Scrollable Page Canvas */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 text-zinc-900">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <RouterView />
    </AppProvider>
  );
}

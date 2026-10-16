/**
 * MY CITY CONNECT - Global Application Context
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { OfficerUser, DashboardNotification } from '../types';
import { authService } from '../services/authService';
import { apiClient } from '../services/apiClient';
import { notificationService } from '../services/notificationService';
import { webSocketService } from '../services/websocketService';

interface AppContextType {
  currentPath: string;
  navigate: (path: string) => void;
  backendConnected: boolean;
  backendMessage: string;
  isCheckingBackend: boolean;
  recheckConnection: () => Promise<void>;
  officer: OfficerUser | null;
  setOfficer: (officer: OfficerUser | null) => void;
  logout: () => Promise<void>;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (v: boolean) => void;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  notifications: DashboardNotification[];
  refreshTrigger: number;
  triggerRefresh: () => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sync URL hash or pathname for robust navigation
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash && hash.startsWith('/')) return hash;
      const path = window.location.pathname;
      return path && path !== '/' ? path : '/dashboard';
    }
    return '/dashboard';
  });

  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [backendMessage, setBackendMessage] = useState<string>('Initializing connection...');
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(true);
  const [officer, setOfficer] = useState<OfficerUser | null>(() => authService.getCurrentOfficer());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  const navigate = useCallback((path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.location.hash = path;
    }
    setIsMobileDrawerOpen(false);
  }, []);

  // Listen to popstate / hashchange for back/forward browser button support
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash && hash.startsWith('/')) {
        setCurrentPath(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setOfficer(null);
      navigate('/login');
    };
    window.addEventListener('mcc:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('mcc:auth-expired', handleAuthExpired);
  }, [navigate]);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Connection check function
  const recheckConnection = useCallback(async () => {
    setIsCheckingBackend(true);
    try {
      const status = await apiClient.checkConnection();
      setBackendConnected(status.connected);
      setBackendMessage(status.message || (status.connected ? 'Connected' : 'Offline'));
    } catch {
      setBackendConnected(false);
      setBackendMessage('Backend connection unavailable');
    } finally {
      setIsCheckingBackend(false);
    }
  }, []);

  // Initial connection check & periodic heartbeat
  useEffect(() => {
    recheckConnection();
    const interval = setInterval(recheckConnection, 30000);
    return () => clearInterval(interval);
  }, [recheckConnection]);

  // Connect WebSocket when backend is active
  useEffect(() => {
    webSocketService.connect();

    const unsubNewComplaint = webSocketService.on('NEW_COMPLAINT', () => {
      triggerRefresh();
      setUnreadCount((c) => c + 1);
    });

    const unsubUpdated = webSocketService.on('COMPLAINT_UPDATED', () => {
      triggerRefresh();
    });

    const unsubWorkerLoc = webSocketService.on('WORKER_LOCATION_UPDATED', () => {
      triggerRefresh();
    });

    const unsubWorkerAssigned = webSocketService.on('WORKER_ASSIGNED', () => {
      triggerRefresh();
    });

    const unsubWorkerStatus = webSocketService.on('WORKER_STATUS_CHANGED', () => {
      triggerRefresh();
    });

    const unsubNotification = webSocketService.on('NOTIFICATION_CREATED', () => {
      triggerRefresh();
    });

    return () => {
      unsubNewComplaint();
      unsubUpdated();
      unsubWorkerLoc();
      unsubWorkerAssigned();
      unsubWorkerStatus();
      unsubNotification();
      webSocketService.disconnect();
    };
  }, [triggerRefresh]);

  // Fetch notifications count if backend is reachable
  useEffect(() => {
    if (backendConnected) {
      notificationService
        .getNotifications()
        .then((items) => {
          setNotifications(items);
          setUnreadCount(items.filter((n) => !n.read).length);
        })
        .catch(() => {
          // Keep empty state
        });
    }
  }, [backendConnected, refreshTrigger]);

  const logout = async () => {
    await authService.logout();
    setOfficer(null);
    navigate('/login');
  };

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,
        backendConnected,
        backendMessage,
        isCheckingBackend,
        recheckConnection,
        officer,
        setOfficer,
        logout,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        unreadCount,
        setUnreadCount,
        notifications,
        refreshTrigger,
        triggerRefresh,
        globalSearch,
        setGlobalSearch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

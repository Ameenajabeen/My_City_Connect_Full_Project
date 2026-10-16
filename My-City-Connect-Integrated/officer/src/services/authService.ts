/** MY CITY CONNECT - Common backend authentication service */
import { apiClient, setAuthToken } from './apiClient';
import { OfficerUser } from '../types';

export interface LoginCredentials { email: string; password?: string; }
export interface AuthResult { officer: OfficerUser; token: string; }
const STORAGE_KEY_USER = 'mcc_officer_user';

function hasValidOfficerToken(): boolean {
  const token = localStorage.getItem('mcc_auth_token');
  if (!token) return false;

  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload));
    return claims.role === 'OFFICER' && typeof claims.exp === 'number' && claims.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const res = await apiClient.post<any>('/auth/login', credentials);
    const payload = res?.data ?? res;
    const token = payload.accessToken ?? payload.token;
    const user = payload.officer ?? payload.user?.officer;
    if (!token || !user) throw new Error('Officer login response is missing token or officer profile.');
    setAuthToken(token);
    const officer: OfficerUser = { ...user, role: 'OFFICER' as any };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(officer));
    return { officer, token };
  },
  async logout(): Promise<void> {
    try { await apiClient.post('/auth/logout'); } catch {}
    finally { setAuthToken(null); localStorage.removeItem(STORAGE_KEY_USER); }
  },
  getCurrentOfficer(): OfficerUser | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (!stored) return null;
    if (!hasValidOfficerToken()) {
      setAuthToken(null);
      localStorage.removeItem(STORAGE_KEY_USER);
      return null;
    }
    try { return JSON.parse(stored) as OfficerUser; } catch {
      localStorage.removeItem(STORAGE_KEY_USER);
      return null;
    }
  },
  saveCurrentOfficer(officer: OfficerUser): void { localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(officer)); },
};

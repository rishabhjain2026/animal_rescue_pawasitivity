import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminLogin as loginApi } from '../api/admin.api';

const AdminContext = createContext(null);

// ── Helper: decode JWT payload without a library ──────────────────────────────
// JWTs are base64url-encoded JSON in the middle segment.
// We use this to read expiry so we can auto-logout before the token expires.
const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    // base64url → base64 → JSON
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  // exp is in seconds, Date.now() is in ms — add 10s buffer
  return decoded.exp * 1000 < Date.now() + 10_000;
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const AdminProvider = ({ children }) => {
  // Initialise from sessionStorage so a page refresh keeps the admin logged in
  // within the same browser tab. sessionStorage is cleared when the tab closes
  // which is exactly what we want for an admin session.
  const [admin,   setAdmin]   = useState(() => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const data  = sessionStorage.getItem('adminData');
      if (!token || isTokenExpired(token)) {
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminData');
        return null;
      }
      return data ? JSON.parse(data) : { token, name: 'Admin', email: '', role: 'admin' };
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // ── Auto-logout when token expires ───────────────────────────────────────
  useEffect(() => {
    if (!admin?.token) return;

    const decoded = decodeToken(admin.token);
    if (!decoded?.exp) return;

    const msUntilExpiry = decoded.exp * 1000 - Date.now();
    if (msUntilExpiry <= 0) { logout(); return; }

    // Set a timer to auto-logout exactly when the token expires
    const timer = setTimeout(() => {
      logout();
      // Inform the user their session ended
      window.dispatchEvent(new CustomEvent('adminSessionExpired'));
    }, msUntilExpiry);

    return () => clearTimeout(timer);
  }, [admin?.token]);

  // ── Login ─────────────────────────────────────────────────────────────────
  // Calls POST /api/auth/admin-login (hardcoded credentials checked on server).
  // On success: stores JWT + admin metadata in sessionStorage, updates state.
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      const { token, name, email: adminEmail, role } = res.data;

      const adminData = { token, name, email: adminEmail, role: role || 'admin' };

      sessionStorage.setItem('adminToken', token);
      sessionStorage.setItem('adminData',  JSON.stringify(adminData));

      setAdmin(adminData);
      return adminData;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  // Clears sessionStorage and resets state.
  // Called from Navbar, AdminDashboard sidebar, or auto-expiry timer above.
  const logout = useCallback(() => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminData');
    setAdmin(null);
  }, []);

  // ── isAdmin helper ────────────────────────────────────────────────────────
  // Convenience boolean — same as !!admin but more readable at call sites
  const isAdmin = !!admin;

  // ── Context value ─────────────────────────────────────────────────────────
  return (
    <AdminContext.Provider value={{
      admin,      // full admin object: { token, name, email, role } | null
      isAdmin,    // boolean shortcut
      loading,    // true while login API call is in flight
      login,
      logout,
    }}>
      {children}
    </AdminContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
};

import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../api/auth.api';

const AuthContext = createContext(null);

// ── Hardcoded admin credentials (frontend only, no backend call) ──────────────
const ADMIN_EMAIL    = 'admin@pawrescue.in';
const ADMIN_PASSWORD = 'Admin@123';
// Change these two lines to update admin credentials. No server restart needed.

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Re-validate token on mount
  useEffect(() => {
    const token     = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        // Skip API validation for hardcoded admin —
        // there's no backend user record for admin, so getMe() would 401.
        if (parsedUser.role === 'admin') {
          setUser(parsedUser);
          setLoading(false);
          return;
        }

        // Normal users — re-validate with backend
        getMe()
          .then((res) => setUser(res.data))
          .catch(() => logout())
          .finally(() => setLoading(false));

      } catch {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    // ── Hardcoded admin login (no API call) ──────────────────────────────────
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = {
        _id:   'admin_local',
        name:  'Admin',
        email: ADMIN_EMAIL,
        role:  'admin',
        token: 'admin-local-token',
      };
      localStorage.setItem('token', adminUser.token);
      localStorage.setItem('user',  JSON.stringify(adminUser));
      setUser(adminUser);
      return adminUser;
    }

    // ── Normal API login ─────────────────────────────────────────────────────
    const res = await loginApi({ email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user',  JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  const register = async (data) => {
    const res = await registerApi(data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user',  JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isRole = (...roles) => roles.includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// 2nd ---will be using

// import { createContext, useContext, useState, useEffect } from 'react';
// import { login as loginApi, register as registerApi, getMe } from '../api/auth.api';

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(() => {
//     try {
//       return JSON.parse(localStorage.getItem('user'));
//     } catch {
//       return null;
//     }
//   });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token     = localStorage.getItem('token');
//     const savedUser = localStorage.getItem('user');

//     if (token && savedUser) {
//       const parsedUser = JSON.parse(savedUser);

//       // Skip API validation for hardcoded admin — no DB record exists
//       if (parsedUser.role === 'admin') {
//         setUser(parsedUser);
//         setLoading(false);
//         return;
//       }

//       // Normal users — re-validate with backend
//       getMe()
//         .then((res) => setUser(res.data))
//         .catch(() => logout())
//         .finally(() => setLoading(false));
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   const login = async (email, password) => {
//     // Hardcoded admin — no backend call
//     if (email === 'admin@pawrescue.in' && password === 'Admin@123') {
//       const adminUser = {
//         _id:   'admin_local',
//         name:  'Admin',
//         email: 'admin@pawrescue.in',
//         role:  'admin',
//         token: 'admin-local-token',
//       };
//       localStorage.setItem('token', adminUser.token);
//       localStorage.setItem('user',  JSON.stringify(adminUser));
//       setUser(adminUser);
//       return adminUser;
//     }

//     // Normal API login
//     const res = await loginApi({ email, password });
//     localStorage.setItem('token', res.data.token);
//     localStorage.setItem('user',  JSON.stringify(res.data));
//     setUser(res.data);
//     return res.data;
//   };

//   const register = async (data) => {
//     const res = await registerApi(data);
//     localStorage.setItem('token', res.data.token);
//     localStorage.setItem('user',  JSON.stringify(res.data));
//     setUser(res.data);
//     return res.data;
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     setUser(null);
//   };

//   const isRole = (...roles) => roles.includes(user?.role);

//   return (
//     <AuthContext.Provider value={{ user, loading, login, register, logout, isRole }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

// 1st
// import { createContext, useContext, useState, useEffect } from 'react';
// import { login as loginApi, register as registerApi, getMe } from '../api/auth.api';

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//  const [user,    setUser]    = useState(() => {
//      try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
//   });
//   const [loading, setLoading] = useState(true);

//  // Re-validate token on mount
// useEffect(() => {
//     const token = localStorage.getItem('token');
//    if (token) {
//      getMe()
//        .then((res) => setUser(res.data))
//        .catch(() => logout())
//        .finally(() => setLoading(false));
//    } else {
//      setLoading(false);
//    }
//  }, []);

//   const login = async (email, password) => {
//     const res = await loginApi({ email, password });
//     localStorage.setItem('token', res.data.token);
//     localStorage.setItem('user',  JSON.stringify(res.data));
//     setUser(res.data);
//     return res.data;
//   };

//   const register = async (data) => {
//     const res = await registerApi(data);
//     localStorage.setItem('token', res.data.token);
//     localStorage.setItem('user',  JSON.stringify(res.data));
//     setUser(res.data);
//     return res.data;
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     setUser(null);
//   };

//   const isRole = (...roles) => roles.includes(user?.role);

//   return (
//     <AuthContext.Provider value={{ user, loading, login, register, logout, isRole }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);















// // ----------------------
// // chatgpt Code
// import { createContext, useContext, useState, useEffect } from 'react';
// import {
//   login as loginApi,
//   register as registerApi,
//   getMe,
// } from '../api/auth.api';

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(() => {
//     try {
//       return JSON.parse(localStorage.getItem('user'));
//     } catch {
//       return null;
//     }
//   });

//   const [loading, setLoading] = useState(true);

//   // Validate existing login on refresh
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     const savedUser = localStorage.getItem('user');

//     if (!token || !savedUser) {
//       setLoading(false);
//       return;
//     }

//     getMe()
//       .then((res) => {
//         setUser(res.data);
//       })
//       .catch(() => {
//         logout();
//       })
//       .finally(() => {
//         setLoading(false);
//       });
//   }, []);

//   // Normal user login
//   const login = async (email, password) => {
//     const res = await loginApi({ email, password });

//     localStorage.setItem('token', res.data.token);
//     localStorage.setItem('user', JSON.stringify(res.data));

//     setUser(res.data);

//     return res.data;
//   };

//   // Register
//   const register = async (data) => {
//     const res = await registerApi(data);

//     localStorage.setItem('token', res.data.token);
//     localStorage.setItem('user', JSON.stringify(res.data));

//     setUser(res.data);

//     return res.data;
//   };

//   // Logout
//   const logout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     setUser(null);
//   };

//   // Role helper
//   const isRole = (...roles) => roles.includes(user?.role);

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         login,
//         register,
//         logout,
//         isRole,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT to every request.
// Skip the fake admin-local-token — backend doesn't know about it.
// Admin API calls use a real JWT from the backend's /api/auth/admin-login endpoint
// which the AuthContext skips (hardcoded check), but the axios interceptor
// below sends whatever is in localStorage. Since admin has 'admin-local-token',
// we must exclude it — admin API routes in the backend use a separate guard
// that checks for the hardcoded admin token OR we protect the admin dashboard
// by only making frontend-hardcoded checks (no real backend admin API calls need auth).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'admin-local-token') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401 — but not on admin pages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const user = localStorage.getItem('user');
      const role = user ? JSON.parse(user)?.role : null;
      // Don't auto-redirect admin — their token is fake and they have no backend session
      if (role !== 'admin') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;


// import axios from 'axios';

// const api = axios.create({ baseURL: '/api' });

// // Attach JWT token to every request automatically
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// // Redirect to login on 401
// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err.response?.status === 401) {
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       window.location.href = '/login';
//     }
//     return Promise.reject(err);
//   }
// );

// export default api;
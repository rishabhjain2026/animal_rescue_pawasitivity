
import axios from 'axios';

const adminApi = axios.create({ baseURL: '/api' });

adminApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const adminLogin = (email, password) => adminApi.post('/auth/admin-login', { email, password });

// Stats & map
export const getAdminStats    = ()       => adminApi.get('/admin/stats');
export const getMapPins       = ()       => adminApi.get('/admin/map-pins');
export const getMonthlySummary= ()       => adminApi.get('/admin/cases/monthly-summary');

// Vets
export const getPendingVets   = ()       => adminApi.get('/admin/vets/pending');
export const getApprovedVets  = ()       => adminApi.get('/admin/vets/approved');
export const approveVet       = (id)     => adminApi.patch(`/admin/vets/${id}/approve`);
export const denyVet          = (id, r)  => adminApi.patch(`/admin/vets/${id}/deny`,  { reason: r });
export const revokeVet        = (id)     => adminApi.patch(`/admin/vets/${id}/revoke`);

// Volunteers
export const getPendingVols   = ()       => adminApi.get('/admin/volunteers/pending');
export const getApprovedVols  = ()       => adminApi.get('/admin/volunteers/approved');
export const approveVolunteer = (id)     => adminApi.patch(`/admin/volunteers/${id}/approve`);
export const denyVolunteer    = (id, r)  => adminApi.patch(`/admin/volunteers/${id}/deny`,  { reason: r });
export const revokeVolunteer  = (id)     => adminApi.patch(`/admin/volunteers/${id}/revoke`);

// Cases
export const getStreetCases   = (p)     => adminApi.get('/admin/cases/street',   { params: p });
export const getDomesticCases = (p)     => adminApi.get('/admin/cases/domestic', { params: p });

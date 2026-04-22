import api from './axios';

// ── Street cases ──────────────────────────────────────
export const reportStreetCase  = (formData) => api.post('/street/report', formData);
export const getStreetCase     = (id)       => api.get(`/street/${id}`);
export const getMyStreetCases  = ()         => api.get('/street/my');
export const updateCaseStatus  = (id, data) => api.patch(`/street/${id}/status`, data);
export const logFirstAid       = (id, steps)=> api.patch(`/street/${id}/first-aid`, { steps });

// ── Domestic cases ────────────────────────────────────
export const registerDomestic  = (data) => api.post('/domestic', data);
export const getMyDomestic     = ()     => api.get('/domestic/my');

// ── Appointments ──────────────────────────────────────
export const bookAppointment   = (data)       => api.post('/appointments/book', data);
export const getMyAppointments = ()           => api.get('/appointments/my');
export const getVetSlots       = (vetId, date)=> api.get(`/appointments/slots/${vetId}?date=${date}`);
export const getVetAppointments= ()           => api.get('/appointments/vet');

// ── Vets ──────────────────────────────────────────────
export const registerVet       = (formData)   => api.post('/vets/register', formData);
export const getNearbyVets     = (lat, lng)   => api.get(`/vets/nearby?lat=${lat}&lng=${lng}`);
export const getVetsByCity     = (city)       => api.get(`/vets/city/${city}`);
export const vetRespondCase    = (caseId, data)=> api.patch(`/vets/street-case/${caseId}/respond`, data);
export const getVetDashboard   = ()           => api.get('/vets/dashboard');

// ── Volunteers ────────────────────────────────────────
export const registerVolunteer     = (formData)    => api.post('/volunteers/register', formData);
export const updateVolunteerStatus = (status)      => api.patch('/volunteers/status', { status });
export const volunteerRespondCase  = (caseId, data)=> api.patch(`/volunteers/street-case/${caseId}/respond`, data);
export const getVolunteerDashboard = ()            => api.get('/volunteers/dashboard');

// ── Pets ──────────────────────────────────────────────
export const registerPet    = (formData) => api.post('/pets/register', formData);
export const getMyPets      = ()         => api.get('/pets/my');
export const getPetByPin    = (pin)      => api.get(`/pets/pin/${pin}`);
export const getPetById     = (id)       => api.get(`/pets/${id}`);
export const deletePet      = (id)       => api.delete(`/pets/${id}`);
export const addHealthEntry = (id, data) => api.post(`/pets/${id}/health-entry`, data);

// ── OTP Auth (street form phone verification) ─────────
export const sendOtp   = (phone) => api.post('/auth/send-otp',   { phone });
export const verifyOtp = (phone, otp) => api.post('/auth/verify-otp', { phone, otp });
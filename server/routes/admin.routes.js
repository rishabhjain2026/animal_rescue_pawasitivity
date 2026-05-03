
const router = require('express').Router();
const { protect }     = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  getPendingVets, getApprovedVets, approveVet, denyVet, revokeVet,
  getPendingVolunteers, getApprovedVolunteers, approveVolunteer, denyVolunteer, revokeVolunteer,
  getMapPins, getStreetCases, getDomesticCases, getMonthlySummary, getStats,
} = require('../controllers/admin.controller');

const adminOnly = [protect, requireRole('admin')];

// Stats
router.get('/stats',                        ...adminOnly, getStats);

// Map pins (approved vets + volunteers with GPS)
router.get('/map-pins',                     ...adminOnly, getMapPins);

// Vets
router.get('/vets/pending',                 ...adminOnly, getPendingVets);
router.get('/vets/approved',                ...adminOnly, getApprovedVets);
router.patch('/vets/:vetId/approve',        ...adminOnly, approveVet);
router.patch('/vets/:vetId/deny',           ...adminOnly, denyVet);
router.patch('/vets/:vetId/revoke',         ...adminOnly, revokeVet);

// Volunteers
router.get('/volunteers/pending',           ...adminOnly, getPendingVolunteers);
router.get('/volunteers/approved',          ...adminOnly, getApprovedVolunteers);
router.patch('/volunteers/:volId/approve',  ...adminOnly, approveVolunteer);
router.patch('/volunteers/:volId/deny',     ...adminOnly, denyVolunteer);
router.patch('/volunteers/:volId/revoke',   ...adminOnly, revokeVolunteer);

// Cases
router.get('/cases/street',                 ...adminOnly, getStreetCases);
router.get('/cases/domestic',               ...adminOnly, getDomesticCases);
router.get('/cases/monthly-summary',        ...adminOnly, getMonthlySummary);

module.exports = router;

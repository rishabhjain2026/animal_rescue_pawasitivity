const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  bookAppointment, getMyAppointments, getVetAppointments,
  updateStatus, getAvailableSlots,
} = require('../controllers/appointment.controller');

router.post('/book',              protect, bookAppointment);
router.get('/my',                 protect, getMyAppointments);
router.get('/vet',                protect, requireRole('vet','admin'), getVetAppointments);
router.get('/slots/:vetId',       protect, getAvailableSlots);
router.patch('/:id/status',       protect, updateStatus);

module.exports = router;
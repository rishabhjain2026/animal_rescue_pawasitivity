const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');
const {
  registerVolunteer, updateAvailability,
  respondToStreetCase, getVolunteerDashboard,
} = require('../controllers/volunteer.controller');

router.post('/register', upload.array('documents', 3), registerVolunteer);

router.get('/dashboard',                       protect, requireRole('volunteer','admin'), getVolunteerDashboard);
router.patch('/status',                        protect, requireRole('volunteer'), updateAvailability);
router.patch('/street-case/:caseId/respond',   protect, requireRole('volunteer'), respondToStreetCase);

module.exports = router;
const router  = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');
const {
  registerVet, getNearbyVets, getVetsByCity,
  respondToStreetCase, getVetDashboard,
} = require('../controllers/vet.controller');

// Public
router.post('/register', upload.array('documents', 5), registerVet);
router.get('/nearby',    getNearbyVets);
router.get('/city/:city', getVetsByCity);

// Vet-only
router.get('/dashboard',              protect, requireRole('vet','admin'), getVetDashboard);
router.patch('/street-case/:caseId/respond', protect, requireRole('vet'), respondToStreetCase);

module.exports = router;
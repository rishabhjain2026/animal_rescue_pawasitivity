const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const {
  reportCase, updateCaseStatus, getCaseById,
  getMyCases, logFirstAidSteps,
} = require('../controllers/street.controller');

router.post('/report',        protect, upload.array('images', 5), reportCase);
router.get('/my',             protect, getMyCases);
router.get('/:id',            protect, getCaseById);
router.patch('/:id/status',   protect, updateCaseStatus);
router.patch('/:id/first-aid', protect, logFirstAidSteps);

module.exports = router;
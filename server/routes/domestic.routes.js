const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { registerCase, getMyCases, getCaseById } = require('../controllers/domestic.controller');

router.post('/',     protect, registerCase);
router.get('/my',    protect, getMyCases);
router.get('/:id',   protect, getCaseById);

module.exports = router;
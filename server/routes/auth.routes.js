
// const router = require('express').Router();
// const { register, login, getMe, sendOtp, verifyOtp } = require('../controllers/auth.controller');
// const { protect } = require('../middleware/auth.middleware');

// router.post('/register',   register);
// router.post('/login',      login);
// router.get('/me',          protect, getMe);
// router.post('/send-otp',   sendOtp);
// router.post('/verify-otp', verifyOtp);

// module.exports = router;

const router = require('express').Router();

const {
  register,
  login,
  getMe,
  sendOtp,
  verifyOtp,
  adminLogin
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);

router.get('/me', protect, getMe);

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

module.exports = router;
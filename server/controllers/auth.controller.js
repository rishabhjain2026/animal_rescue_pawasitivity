const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const User     = require('../models/User');
const twilio = require('twilio');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const formatPhoneE164 = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
};

const getTwilioVerifyClient = () => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) return null;
  return {
    client: twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
    serviceSid: TWILIO_VERIFY_SERVICE_SID,
  };
};

const findOrCreatePhoneGuest = async (phoneE164) => {
  let user = await User.findOne({ phone: phoneE164 });
  if (!user) {
    user = await User.create({
      name: `Reporter (${phoneE164.slice(-4)})`,
      email: `phone_${phoneE164.replace(/\D/g, '')}@pawrescue.local`,
      phone: phoneE164,
      password: crypto.randomBytes(16).toString('hex'),
      role: 'user',
      isVerified: true,
    });
  }
  return user;
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, phone, password, city } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, phone, password, city, role: 'user' });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });

    res.json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, city: user.city, token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/admin-login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@pawrescue.in';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        message: 'Invalid admin credentials',
      });
    }

    const token = jwt.sign(
      {
        role: 'admin',
        email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      role: 'admin',
      email,
      name: 'Admin',
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── OTP Auth for street form (phone-only, no registration needed) ─────────────

// POST /api/auth/send-otp
// Sends OTP using Twilio Verify.
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const phoneE164 = formatPhoneE164(phone);
    if (!phoneE164) {
      return res.status(400).json({ message: 'Valid phone number required (use 10-digit India number or E.164).' });
    }

    const verify = getTwilioVerifyClient();
    if (!verify) {
      return res.status(500).json({ message: 'Twilio Verify is not configured on the server.' });
    }

    await verify.client.verify.v2.services(verify.serviceSid)
      .verifications
      .create({ to: phoneE164, channel: 'sms' });

    res.json({ message: 'OTP sent successfully', phone: phoneE164 });
  } catch (err) {
    const status = err?.status || 500;
    const message = err?.message || 'Failed to send OTP';
    res.status(status).json({ message });
  }
};

// POST /api/auth/verify-otp
// Verifies OTP, creates a minimal phone-only user if needed, returns JWT.
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });
    const phoneE164 = formatPhoneE164(phone);
    if (!phoneE164) return res.status(400).json({ message: 'Invalid phone number format.' });

    const verify = getTwilioVerifyClient();
    if (!verify) {
      return res.status(500).json({ message: 'Twilio Verify is not configured on the server.' });
    }

    const check = await verify.client.verify.v2.services(verify.serviceSid)
      .verificationChecks
      .create({ to: phoneE164, code: String(otp) });

    if (check.status !== 'approved') {
      return res.status(400).json({ message: 'Incorrect or expired OTP. Please try again.' });
    }

    const user = await findOrCreatePhoneGuest(phoneE164);

    res.json({
      message:   'Phone verified successfully',
      token:     generateToken(user._id),
      _id:       user._id,
      name:      user.name,
      phone:     user.phone,
      role:      user.role,
      isGuest:   true,
    });
  } catch (err) {
    const status = err?.status || 500;
    const message = err?.message || 'OTP verification failed';
    res.status(status).json({ message });
  }
};

// module.exports = { register, login, getMe, sendOtp, verifyOtp };
module.exports = {
  register,
  login,
  adminLogin,
  getMe,
  sendOtp,
  verifyOtp
};
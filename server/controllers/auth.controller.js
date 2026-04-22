const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const User     = require('../models/User');
const otpStore = require('../utils/otpStore');
const nodemailer = require('nodemailer');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// POST /api/auth/send-otp
// Sends a 6-digit OTP to the phone number via email (or SMS if Twilio configured).
// Also auto-creates a guest user account for the phone if one doesn't exist,
// so the street case has a reporter reference in the DB.
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ message: 'Valid phone number required' });
    }

    // Throttle: block if an OTP was sent in the last 60 seconds
    const existing = otpStore.get(phone);
    if (existing && existing.expiresAt - Date.now() > 4 * 60 * 1000) {
      return res.status(429).json({ message: 'OTP already sent. Please wait 60 seconds before requesting again.' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(phone, otp);

    // ── Send via email (dev fallback — swap for SMS in production) ──
    // In production: use Twilio/Fast2SMS/MSG91 to send a real SMS.
    // For now we log it so you can test without an SMS provider.
    console.log(`[OTP] Phone: ${phone} → OTP: ${otp}`);

    if (process.env.EMAIL_USER) {
      // Optional: email the OTP if EMAIL_USER is set (useful for testing)
      await transporter.sendMail({
        from:    `"PawRescue" <${process.env.EMAIL_USER}>`,
        to:      process.env.OTP_TEST_EMAIL || process.env.EMAIL_USER,
        subject: `PawRescue OTP: ${otp}`,
        text:    `Your PawRescue verification code is: ${otp}\n\nValid for 5 minutes. Do not share this code.`,
      }).catch(() => {});
    }

    // Plug in SMS here when ready:
    // await twilioClient.messages.create({ body: `Your PawRescue OTP: ${otp}`, from: process.env.TWILIO_PHONE, to: phone });

    res.json({ message: 'OTP sent successfully', phone });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/verify-otp
// Verifies OTP, creates a minimal phone-only user if needed, returns JWT.
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });

    const record = otpStore.get(phone);

    if (!record) {
      return res.status(400).json({ message: 'No OTP found for this number. Please request a new one.' });
    }
    if (Date.now() > record.expiresAt) {
      otpStore.clear(phone);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (record.attempts >= 3) {
      otpStore.clear(phone);
      return res.status(400).json({ message: 'Too many incorrect attempts. Please request a new OTP.' });
    }
    if (record.otp !== otp.toString()) {
      otpStore.increment(phone);
      const left = 3 - (record.attempts + 1);
      return res.status(400).json({ message: `Incorrect OTP. ${left} attempt${left !== 1 ? 's' : ''} remaining.` });
    }

    // OTP correct — clear it
    otpStore.clear(phone);

    // Find or create a phone-only guest user
    let user = await User.findOne({ phone });
    if (!user) {
      // Create a minimal user — no email, no password needed for street reporters
      user = await User.create({
        name:     `Reporter (${phone.slice(-4)})`,
        email:    `phone_${phone.replace(/\D/g,'')}@pawrescue.local`,
        phone,
        password: crypto.randomBytes(16).toString('hex'), // random, never used
        role:     'user',
        isVerified: true,
      });
    }

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
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe, sendOtp, verifyOtp };
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const StreetCase = require('../models/StreetCase');

// POST /api/volunteers/register
const registerVolunteer = async (req, res) => {
  try {
    const {
      name, email, phone, password, city, state, pincode,
      skillLevel, hasVehicle, operatingRadius, lng, lat,
      certifications, emergencyContactName, emergencyContactPhone,
    } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name, email, phone, password, city, role: 'volunteer', isVerified: false,
    });

    const documents = req.files?.map((f) => ({ name: f.originalname, url: f.path })) || [];

    const volunteer = await Volunteer.create({
      user: user._id,
      city, state, pincode,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      skillLevel: skillLevel || 'basic',
      hasVehicle:  hasVehicle === 'true',
      operatingRadius: parseFloat(operatingRadius || 10),
      certifications: certifications ? JSON.parse(certifications) : [],
      emergencyContact: { name: emergencyContactName, phone: emergencyContactPhone },
      documents,
    });

    res.status(201).json({
      message: 'Volunteer registration submitted. Admin approval pending.',
      volunteerId: volunteer._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/volunteers/status
const updateAvailability = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ user: req.user._id });
    if (!volunteer) return res.status(404).json({ message: 'Profile not found' });
    volunteer.availabilityStatus = req.body.status;
    await volunteer.save();
    res.json({ status: volunteer.availabilityStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/volunteers/street-case/:caseId/respond
const respondToStreetCase = async (req, res) => {
  try {
    const { response, rejectionReason } = req.body;
    const streetCase = await StreetCase.findById(req.params.caseId);
    if (!streetCase) return res.status(404).json({ message: 'Case not found' });

    const volunteer = await Volunteer.findOne({ user: req.user._id });
    const entry = streetCase.dispatchChain.find(
      (d) => d.responder?.toString() === volunteer._id.toString() && d.response === 'pending'
    );
    if (!entry) return res.status(400).json({ message: 'No pending dispatch for you' });

    entry.respondedAt = new Date();
    entry.response = response;
    if (rejectionReason) entry.rejectionReason = rejectionReason;

    if (response === 'accepted') {
      streetCase.assignedVolunteer = volunteer._id;
      streetCase.status = 'volunteer-enroute';
      volunteer.availabilityStatus = 'busy';
      await volunteer.save();
      streetCase.statusTimeline.push({ status: 'volunteer-enroute', note: 'Volunteer accepted and is on the way', updatedBy: req.user._id });
    }

    await streetCase.save();
    req.io.to(`case_${streetCase._id}`).emit('caseUpdate', { status: streetCase.status });

    res.json({ message: `Response: ${response}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/volunteers/dashboard
const getVolunteerDashboard = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ user: req.user._id });
    if (!volunteer) return res.status(404).json({ message: 'Profile not found' });

    const active   = await StreetCase.find({ assignedVolunteer: volunteer._id, status: { $nin: ['completed','cancelled'] } });
    const completed = await StreetCase.find({ assignedVolunteer: volunteer._id, status: 'completed' }).limit(20);

    res.json({ volunteer, active, completed, totalRescues: volunteer.totalRescues });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerVolunteer, updateAvailability, respondToStreetCase, getVolunteerDashboard };
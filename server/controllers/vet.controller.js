const User = require('../models/User');
const Vet = require('../models/Vet');
const StreetCase = require('../models/StreetCase');
const { upload } = require('../middleware/upload.middleware');

// POST /api/vets/register
// Vet self-registers: creates User(role=vet, isVerified=false) + Vet profile
const registerVet = async (req, res) => {
  try {
    const {
      name, email, phone, password, city, state, pincode,
      licenseNumber, clinicName, clinicAddress,
      specializations, consultationFee, homeVisitFee,
      offersHomeVisit, homeVisitRadius,
      availabilitySlots, lng, lat,
    } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    // Create user account with vet role — needs admin approval before login
    const user = await User.create({
      name, email, phone, password, city, role: 'vet', isVerified: false,
    });

    const documents = req.files?.map((f) => ({ name: f.originalname, url: f.path })) || [];

    const vet = await Vet.create({
      user: user._id,
      licenseNumber, clinicName, clinicAddress, city, state, pincode,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      specializations: specializations ? JSON.parse(specializations) : ['general'],
      consultationFee: parseFloat(consultationFee),
      homeVisitFee:    parseFloat(homeVisitFee || 0),
      offersHomeVisit: offersHomeVisit === 'true',
      homeVisitRadius: parseFloat(homeVisitRadius || 5),
      availabilitySlots: availabilitySlots ? JSON.parse(availabilitySlots) : [],
      documents,
    });

    res.status(201).json({
      message: 'Registration submitted. Admin will review and approve your account within 24-48 hours.',
      vetId: vet._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/vets/nearby?lat=&lng=&radius=10
// Returns vets within radius (km), sorted by distance
const getNearbyVets = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    const vets = await Vet.find({
      approvedByAdmin: true,
      location: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000,  // metres
        },
      },
    }).populate('user', 'name phone email');

    res.json(vets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/vets/city/:city
const getVetsByCity = async (req, res) => {
  try {
    const vets = await Vet.find({
      city: new RegExp(req.params.city, 'i'),
      approvedByAdmin: true,
    }).populate('user', 'name phone email avatar');
    res.json(vets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/vets/street-case/:caseId/respond
// Vet accepts or rejects a street rescue request
const respondToStreetCase = async (req, res) => {
  try {
    const { response, rejectionReason } = req.body;  // 'accepted' or 'rejected'
    const streetCase = await StreetCase.findById(req.params.caseId);
    if (!streetCase) return res.status(404).json({ message: 'Case not found' });

    const vet = await Vet.findOne({ user: req.user._id });
    if (!vet) return res.status(403).json({ message: 'Vet profile not found' });

    // Update the dispatch chain entry for this vet
    const entry = streetCase.dispatchChain.find(
      (d) => d.responder?.toString() === vet._id.toString() && d.response === 'pending'
    );
    if (!entry) return res.status(400).json({ message: 'No pending dispatch found for you' });

    entry.respondedAt = new Date();
    entry.response = response;
    if (rejectionReason) entry.rejectionReason = rejectionReason;

    if (response === 'accepted') {
      streetCase.assignedVet = vet._id;
      streetCase.status = 'vet-dispatched';
      streetCase.statusTimeline.push({ status: 'vet-dispatched', note: `Vet ${vet.clinicName} accepted`, updatedBy: req.user._id });
    } else {
      // Trigger next dispatch from StreetCase controller via socket
      req.io.emit(`escalate_${streetCase._id}`);
    }

    await streetCase.save();

    // Notify reporter via socket
    req.io.to(`case_${streetCase._id}`).emit('caseUpdate', {
      status: streetCase.status, dispatchChain: streetCase.dispatchChain,
    });

    res.json({ message: `Response recorded: ${response}`, case: streetCase });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/vets/dashboard — vet's assigned cases
const getVetDashboard = async (req, res) => {
  try {
    const vet = await Vet.findOne({ user: req.user._id });
    if (!vet) return res.status(404).json({ message: 'Vet profile not found' });

    const pending  = await StreetCase.find({ 'dispatchChain': { $elemMatch: { responder: vet._id, response: 'pending' } } });
    const active   = await StreetCase.find({ assignedVet: vet._id, status: { $nin: ['completed','cancelled'] } });
    const completed = await StreetCase.find({ assignedVet: vet._id, status: 'completed' }).limit(20);

    res.json({ vet, pending, active, completed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerVet, getNearbyVets, getVetsByCity, respondToStreetCase, getVetDashboard };
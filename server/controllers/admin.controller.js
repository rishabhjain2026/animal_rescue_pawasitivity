const User         = require('../models/User');
const Vet          = require('../models/Vet');
const Volunteer    = require('../models/Volunteer');
const StreetCase   = require('../models/StreetCase');
const DomesticCase = require('../models/DomesticCase');
const Pet          = require('../models/Pet');

// ── Vet requests ──────────────────────────────────────────────────────────────

const getPendingVets = async (req, res) => {
  try {
    const vets = await Vet.find({ approvedByAdmin: false })
      .populate('user', 'name email phone city createdAt isActive')
      .sort({ createdAt: -1 });
    res.json(vets);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getApprovedVets = async (req, res) => {
  try {
    const vets = await Vet.find({ approvedByAdmin: true })
      .populate('user', 'name email phone city createdAt isActive')
      .sort({ createdAt: -1 });
    res.json(vets);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const approveVet = async (req, res) => {
  try {
    const vet = await Vet.findById(req.params.vetId).populate('user');
    if (!vet) return res.status(404).json({ message: 'Vet not found' });
    vet.approvedByAdmin = true;
    await vet.save();
    await User.findByIdAndUpdate(vet.user._id, { isVerified: true, isActive: true });
    res.json({ message: `${vet.user.name} approved`, vet });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const denyVet = async (req, res) => {
  try {
    const { reason } = req.body;
    const vet = await Vet.findById(req.params.vetId).populate('user');
    if (!vet) return res.status(404).json({ message: 'Vet not found' });
    await User.findByIdAndUpdate(vet.user._id, { isActive: false, isVerified: false });
    await Vet.findByIdAndDelete(req.params.vetId);
    res.json({ message: `${vet.user.name} denied${reason ? ': ' + reason : ''}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const revokeVet = async (req, res) => {
  try {
    const vet = await Vet.findById(req.params.vetId).populate('user');
    if (!vet) return res.status(404).json({ message: 'Vet not found' });
    vet.approvedByAdmin = false;
    await vet.save();
    await User.findByIdAndUpdate(vet.user._id, { isActive: false });
    res.json({ message: `${vet.user.name} revoked` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Volunteer requests ────────────────────────────────────────────────────────

const getPendingVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find({ approvedByAdmin: false })
      .populate('user', 'name email phone city createdAt')
      .sort({ joinedAt: -1 });
    res.json(volunteers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getApprovedVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find({ approvedByAdmin: true })
      .populate('user', 'name email phone city createdAt isActive')
      .sort({ joinedAt: -1 });
    res.json(volunteers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const approveVolunteer = async (req, res) => {
  try {
    const vol = await Volunteer.findById(req.params.volId).populate('user');
    if (!vol) return res.status(404).json({ message: 'Volunteer not found' });
    vol.approvedByAdmin = true;
    await vol.save();
    await User.findByIdAndUpdate(vol.user._id, { isVerified: true, isActive: true });
    res.json({ message: `${vol.user.name} approved` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const denyVolunteer = async (req, res) => {
  try {
    const { reason } = req.body;
    const vol = await Volunteer.findById(req.params.volId).populate('user');
    if (!vol) return res.status(404).json({ message: 'Volunteer not found' });
    await User.findByIdAndUpdate(vol.user._id, { isActive: false, isVerified: false });
    await Volunteer.findByIdAndDelete(req.params.volId);
    res.json({ message: `${vol.user.name} denied${reason ? ': ' + reason : ''}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const revokeVolunteer = async (req, res) => {
  try {
    const vol = await Volunteer.findById(req.params.volId).populate('user');
    if (!vol) return res.status(404).json({ message: 'Volunteer not found' });
    vol.approvedByAdmin = false;
    await vol.save();
    await User.findByIdAndUpdate(vol.user._id, { isActive: false });
    res.json({ message: `${vol.user.name} revoked` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Map data — approved vets + volunteers with GPS coords ─────────────────────
// GET /api/admin/map-pins
// Returns lightweight array of {type, name, city, lat, lng, extra} for map markers.
// Socket.io emits 'mapPinAdded' on approval so admin map updates in real-time.

const getMapPins = async (req, res) => {
  try {
    const [vets, volunteers] = await Promise.all([
      Vet.find({ approvedByAdmin: true, 'location.coordinates.0': { $ne: 0 } })
        .populate('user', 'name phone')
        .select('location clinicName city specializations consultationFee user'),

      Volunteer.find({ approvedByAdmin: true, 'location.coordinates.0': { $ne: 0 } })
        .populate('user', 'name phone')
        .select('location city skillLevel availabilityStatus user'),
    ]);

    const pins = [
      ...vets.map(v => ({
        id:    v._id,
        type:  'vet',
        name:  v.user?.name,
        clinic: v.clinicName,
        city:  v.city,
        phone: v.user?.phone,
        specializations: v.specializations,
        fee:   v.consultationFee,
        lat:   v.location.coordinates[1],
        lng:   v.location.coordinates[0],
      })),
      ...volunteers.map(v => ({
        id:     v._id,
        type:   'volunteer',
        name:   v.user?.name,
        city:   v.city,
        phone:  v.user?.phone,
        skill:  v.skillLevel,
        status: v.availabilityStatus,
        lat:    v.location.coordinates[1],
        lng:    v.location.coordinates[0],
      })),
    ];

    res.json(pins);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Cases ─────────────────────────────────────────────────────────────────────

// GET /api/admin/cases/street?from=&to=&status=&month=YYYY-MM
const getStreetCases = async (req, res) => {
  try {
    const { from, to, status, month } = req.query;
    const filter = {};

    if (month) {
      // month = "2024-03" → full month range
      const start = new Date(`${month}-01`);
      const end   = new Date(start);
      end.setMonth(end.getMonth() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    } else if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
    if (status) filter.status = status;

    const cases = await StreetCase.find(filter)
      .populate('reporter', 'name phone')
      .populate({ path: 'assignedVet',       populate: { path: 'user', select: 'name phone' } })
      .populate({ path: 'assignedVolunteer', populate: { path: 'user', select: 'name phone' } })
      .sort({ createdAt: -1 })
      .limit(500);

    res.json(cases);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getDomesticCases = async (req, res) => {
  try {
    const { from, to, month, status } = req.query;
    const filter = {};

    if (month) {
      const start = new Date(`${month}-01`);
      const end   = new Date(start);
      end.setMonth(end.getMonth() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    } else if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
    if (status) filter.status = status;

    const cases = await DomesticCase.find(filter)
      .populate('reporter', 'name phone')
      .populate('pet', 'name species breed')
      .populate({ path: 'vet', populate: { path: 'user', select: 'name phone' } })
      .sort({ createdAt: -1 })
      .limit(500);

    res.json(cases);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/admin/cases/monthly-summary
// Groups street cases by month + location.city for the dashboard heatmap table
const getMonthlySummary = async (req, res) => {
  try {
    const summary = await StreetCase.aggregate([
      {
        $group: {
          _id: {
            month:  { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            status: '$status',
          },
          count: { $sum: 1 },
          resolved:  { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.month': -1 } },
      { $limit: 120 },
    ]);

    // Location-based monthly breakdown
    const byLocation = await StreetCase.aggregate([
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            city:  { $ifNull: ['$location.address', 'Unknown'] },
          },
          total:    { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          active:   { $sum: { $cond: [{ $nin: ['$status', ['completed','cancelled']] }, 1, 0] } },
        },
      },
      { $sort: { '_id.month': -1, 'total': -1 } },
      { $limit: 200 },
    ]);

    res.json({ summary, byLocation });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Stats ─────────────────────────────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const [
      totalStreet, resolvedStreet, activeStreet,
      totalDomestic, resolvedDomestic,
      totalVets, pendingVets,
      totalVolunteers, pendingVolunteers,
      totalUsers, totalPets,
    ] = await Promise.all([
      StreetCase.countDocuments({}),
      StreetCase.countDocuments({ status: 'completed' }),
      StreetCase.countDocuments({ status: { $nin: ['completed','cancelled'] } }),
      DomesticCase.countDocuments({}),
      DomesticCase.countDocuments({ status: 'completed' }),
      Vet.countDocuments({ approvedByAdmin: true }),
      Vet.countDocuments({ approvedByAdmin: false }),
      Volunteer.countDocuments({ approvedByAdmin: true }),
      Volunteer.countDocuments({ approvedByAdmin: false }),
      User.countDocuments({ role: 'user' }),
      Pet.countDocuments({}),
    ]);

    const since = new Date(); since.setDate(since.getDate() - 13);
    const daily = await StreetCase.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const severity = await StreetCase.aggregate([
      { $group: { _id: '$severityScore', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const injuries = await StreetCase.aggregate([
      { $group: { _id: '$injuryType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totals: {
        street: totalStreet, domestic: totalDomestic,
        resolved: resolvedStreet + resolvedDomestic, active: activeStreet,
        vets: totalVets, pendingVets,
        volunteers: totalVolunteers, pendingVolunteers,
        users: totalUsers, pets: totalPets,
      },
      daily, severity, injuries,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getPendingVets, getApprovedVets, approveVet, denyVet, revokeVet,
  getPendingVolunteers, getApprovedVolunteers, approveVolunteer, denyVolunteer, revokeVolunteer,
  getMapPins, getStreetCases, getDomesticCases, getMonthlySummary, getStats,
};

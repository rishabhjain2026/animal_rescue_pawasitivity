const StreetCase = require('../models/StreetCase');
const Vet = require('../models/Vet');
const Volunteer = require('../models/Volunteer');
const { getSeverityFromImage } = require('../utils/aiSeverity');
const { generateRescueReport } = require('../utils/reportGenerator');
const { notifyResponder, notifyReporter } = require('../utils/notifier');
const { getFirstAidGuide } = require('../utils/firstAidGuide');

// POST /api/street/report
const reportCase = async (req, res) => {
  try {
    const {
      reporterPhone, description, landmark,
      lng, lat, address,
      humanSeverity, injuryType,
    } = req.body;

    // Process uploaded images + run AI severity scoring
    let images = [];
    let aiScores = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const aiResult = await getSeverityFromImage(file.path);
        images.push({
          url:           file.path,
          aiSeverity:    aiResult.severity,
          bloodDetected: aiResult.bloodDetected,
          postureScore:  aiResult.postureScore,
        });
        aiScores.push(aiResult.severity);
      }
    }

    // Combined severity: 60% AI average + 40% human input
    const avgAi = aiScores.length > 0 ? aiScores.reduce((a, b) => a + b, 0) / aiScores.length : 3;
    const human = parseFloat(humanSeverity) || 3;
    const severityScore = Math.round(avgAi * 0.6 + human * 0.4);

    const streetCase = await StreetCase.create({
      reporter:      req.user._id,
      reporterPhone,
      description,
      landmark,
      location: {
        type:        'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
        address,
      },
      images,
      severityScore,
      humanSeverity: human,
      injuryType:    injuryType || 'unknown',
      statusTimeline: [{ status: 'reported', note: 'Case reported by user', updatedBy: req.user._id }],
    });

    // Send first-aid guide immediately to reporter
    const firstAidGuide = getFirstAidGuide(injuryType, severityScore);

    // Start dispatch chain asynchronously (don't block response)
    dispatchNextResponder(streetCase, req.io);

    res.status(201).json({
      message:      'Case reported successfully. Dispatching nearest responders.',
      caseId:       streetCase._id,
      severityScore,
      firstAidGuide,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Core dispatch engine — volunteers first, then vet
// My design: volunteers are dispatched first as they're faster to reach the spot.
// If no volunteer responds in autoEscalateAfterMins, we go directly to the nearest vet.
const dispatchNextResponder = async (streetCase, io, skipVolunteers = false) => {
  try {
    const [lng, lat] = streetCase.location.coordinates;

    if (!skipVolunteers) {
      // Try nearest available volunteer first
      const volunteers = await Volunteer.find({
        approvedByAdmin:    true,
        availabilityStatus: 'available',
        location: {
          $near: {
            $geometry:    { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: 15000, // 15km
          },
        },
      }).limit(5).populate('user', 'name phone email');

      // Filter out already-asked volunteers
      const askedIds = streetCase.dispatchChain
        .filter((d) => d.responderType === 'volunteer')
        .map((d) => d.responder?.toString());

      const nextVolunteer = volunteers.find((v) => !askedIds.includes(v._id.toString()));

      if (nextVolunteer) {
        streetCase.dispatchChain.push({
          responderType: 'volunteer',
          responder:     nextVolunteer._id,
          sentAt:        new Date(),
          response:      'pending',
        });
        streetCase.status = 'dispatched';
        streetCase.statusTimeline.push({ status: 'dispatched', note: `Volunteer ${nextVolunteer.user.name} notified` });
        await streetCase.save();

        await notifyResponder('volunteer', nextVolunteer, streetCase);
        io.to(`case_${streetCase._id}`).emit('caseUpdate', { status: 'dispatched' });

        // Auto-escalate if volunteer doesn't respond in 5 minutes
        setTimeout(async () => {
          const fresh = await StreetCase.findById(streetCase._id);
          const entry = fresh?.dispatchChain.find(
            (d) => d.responder?.toString() === nextVolunteer._id.toString() && d.response === 'pending'
          );
          if (entry) {
            entry.response = 'timeout';
            entry.respondedAt = new Date();
            fresh.autoEscalatedAt = new Date();
            await fresh.save();
            dispatchNextResponder(fresh, io, false); // try next volunteer
          }
        }, (5 * 60 * 1000));

        return;
      }
    }

    // No volunteer available — dispatch to nearest vet
    const vets = await Vet.find({
      approvedByAdmin: true,
      isAvailableForStreetRescue: true,
      location: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: 20000, // 20km
        },
      },
    }).limit(5).populate('user', 'name phone email');

    const askedVetIds = streetCase.dispatchChain
      .filter((d) => d.responderType === 'vet')
      .map((d) => d.responder?.toString());

    const nextVet = vets.find((v) => !askedVetIds.includes(v._id.toString()));

    if (!nextVet) {
      // No one available — notify reporter and suggest helplines
      streetCase.status = 'cancelled';
      streetCase.statusTimeline.push({ status: 'cancelled', note: 'No responders available in range' });
      await streetCase.save();
      io.to(`case_${streetCase._id}`).emit('caseUpdate', {
        status: 'cancelled',
        message: 'No responders available. Please contact nearest animal shelter.',
      });
      return;
    }

    streetCase.dispatchChain.push({
      responderType: 'vet',
      responder:     nextVet._id,
      sentAt:        new Date(),
      response:      'pending',
    });
    streetCase.status = 'dispatched';
    streetCase.statusTimeline.push({ status: 'dispatched', note: `Vet ${nextVet.clinicName} notified` });
    await streetCase.save();

    await notifyResponder('vet', nextVet, streetCase);
    io.to(`case_${streetCase._id}`).emit('caseUpdate', { status: 'dispatched' });

    // Auto-escalate vet after their set timeout
    setTimeout(async () => {
      const fresh = await StreetCase.findById(streetCase._id);
      const entry = fresh?.dispatchChain.find(
        (d) => d.responder?.toString() === nextVet._id.toString() && d.response === 'pending'
      );
      if (entry) {
        entry.response = 'timeout';
        entry.respondedAt = new Date();
        fresh.autoEscalatedAt = new Date();
        await fresh.save();
        dispatchNextResponder(fresh, io, true); // skip volunteers, go to next vet
      }
    }, (nextVet.autoEscalateAfterMins || 5) * 60 * 1000);

  } catch (err) {
    console.error('Dispatch error:', err.message);
  }
};

// PATCH /api/street/:id/status
const updateCaseStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const streetCase = await StreetCase.findById(req.params.id);
    if (!streetCase) return res.status(404).json({ message: 'Case not found' });

    streetCase.status = status;
    streetCase.statusTimeline.push({ status, note: note || '', updatedBy: req.user._id });

    if (status === 'rescued') streetCase.rescuedAt = new Date();

    // Generate PDF report when case completes
    if (status === 'completed') {
      const reportUrl = await generateRescueReport(streetCase);
      streetCase.reportPdfUrl = reportUrl;
      // Notify original reporter
      await notifyReporter(streetCase);
    }

    await streetCase.save();
    req.io.to(`case_${streetCase._id}`).emit('caseUpdate', {
      status, timeline: streetCase.statusTimeline,
    });

    res.json({ message: 'Status updated', case: streetCase });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/street/:id — full case details with populated chain
const getCaseById = async (req, res) => {
  try {
    const streetCase = await StreetCase.findById(req.params.id)
      .populate('reporter', 'name phone')
      .populate('assignedVolunteer')
      .populate({ path: 'assignedVolunteer', populate: { path: 'user', select: 'name phone' } })
      .populate('assignedVet')
      .populate({ path: 'assignedVet', populate: { path: 'user', select: 'name phone' } });

    if (!streetCase) return res.status(404).json({ message: 'Case not found' });
    res.json(streetCase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/street/my — reporter's own cases
const getMyCases = async (req, res) => {
  try {
    const cases = await StreetCase.find({ reporter: req.user._id })
      .sort({ createdAt: -1 })
      .populate('assignedVet')
      .populate({ path: 'assignedVet', populate: { path: 'user', select: 'name phone' } });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/street/:id/first-aid
const logFirstAidSteps = async (req, res) => {
  try {
    const streetCase = await StreetCase.findById(req.params.id);
    if (!streetCase) return res.status(404).json({ message: 'Case not found' });
    streetCase.firstAidStepsTaken.push(...(req.body.steps || []));
    await streetCase.save();
    res.json({ message: 'First-aid steps logged', steps: streetCase.firstAidStepsTaken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  reportCase, updateCaseStatus, getCaseById,
  getMyCases, logFirstAidSteps, dispatchNextResponder,
};
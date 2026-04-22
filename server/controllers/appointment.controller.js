const Appointment = require('../models/Appointment');
const Vet = require('../models/Vet');
const Pet = require('../models/Pet');
const DomesticCase = require('../models/DomesticCase');
const { scheduleReminder } = require('../utils/notifier');

// POST /api/appointments/book
const bookAppointment = async (req, res) => {
  try {
    const {
      petId, vetId, caseId,
      type, date, timeSlot, homeAddress,
    } = req.body;

    const vet = await Vet.findById(vetId).populate('user', 'name phone email');
    if (!vet) return res.status(404).json({ message: 'Vet not found' });

    // Check home visit eligibility
    if (type === 'home-visit' && !vet.offersHomeVisit) {
      return res.status(400).json({ message: 'This vet does not offer home visits' });
    }

    // Check slot isn't already booked
    const slotTaken = await Appointment.findOne({
      vet: vetId, date: new Date(date), timeSlot,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (slotTaken) return res.status(409).json({ message: 'This time slot is already booked' });

    const fee = type === 'home-visit' ? vet.homeVisitFee : vet.consultationFee;

    const appointment = await Appointment.create({
      pet:    petId,
      owner:  req.user._id,
      vet:    vetId,
      case:   caseId || null,
      type,
      date:   new Date(date),
      timeSlot,
      homeAddress: homeAddress || '',
      consultationFee: fee,
    });

    // Link appointment to domestic case if provided
    if (caseId) {
      await DomesticCase.findByIdAndUpdate(caseId, {
        appointment: appointment._id, status: 'confirmed',
      });
    }

    // Schedule 30-minute pre-appointment reminder
    const appointmentTime = new Date(`${date} ${timeSlot}`);
    const reminderTime    = new Date(appointmentTime.getTime() - 30 * 60 * 1000);
    const msUntilReminder = reminderTime.getTime() - Date.now();

    if (msUntilReminder > 0) {
      setTimeout(async () => {
        await scheduleReminder(req.user, vet, appointment);
        await Appointment.findByIdAndUpdate(appointment._id, { reminderSent30min: true });
      }, msUntilReminder);
    }

    res.status(201).json({
      message:     'Appointment booked successfully',
      appointment: await appointment.populate([
        { path: 'pet' },
        { path: 'vet', populate: { path: 'user', select: 'name phone' } },
      ]),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointments/my
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ owner: req.user._id })
      .populate('pet')
      .populate({ path: 'vet', populate: { path: 'user', select: 'name phone email' } })
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointments/vet — vet sees their schedule
const getVetAppointments = async (req, res) => {
  try {
    const vet = await require('../models/Vet').findOne({ user: req.user._id });
    if (!vet) return res.status(404).json({ message: 'Vet profile not found' });

    const appointments = await Appointment.find({ vet: vet._id })
      .populate('pet')
      .populate('owner', 'name phone email')
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/appointments/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointments/slots/:vetId?date=YYYY-MM-DD
// Returns available slots for a vet on a given date
const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const vet = await Vet.findById(req.params.vetId);
    if (!vet) return res.status(404).json({ message: 'Vet not found' });

    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }); // "Mon"
    const daySchedule = vet.availabilitySlots.find((s) => s.day === dayName);
    if (!daySchedule) return res.json({ slots: [], message: 'Vet not available on this day' });

    // Generate 30-min slots between startTime and endTime
    const allSlots = generateTimeSlots(daySchedule.startTime, daySchedule.endTime, 30);

    // Remove already-booked slots
    const booked = await Appointment.find({
      vet: vet._id, date: new Date(date), status: { $in: ['pending', 'confirmed'] },
    }).select('timeSlot');
    const bookedSlots = booked.map((a) => a.timeSlot);

    const available = allSlots.filter((s) => !bookedSlots.includes(s));
    res.json({ slots: available, daySchedule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const generateTimeSlots = (start, end, intervalMins) => {
  const slots = [];
  let [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  while (sh * 60 + sm < eh * 60 + em) {
    const hour   = sh % 12 || 12;
    const ampm   = sh < 12 ? 'AM' : 'PM';
    const minute = sm.toString().padStart(2, '0');
    slots.push(`${hour}:${minute} ${ampm}`);
    sm += intervalMins;
    if (sm >= 60) { sh++; sm -= 60; }
  }
  return slots;
};

module.exports = { bookAppointment, getMyAppointments, getVetAppointments, updateStatus, getAvailableSlots };
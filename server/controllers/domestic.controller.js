const DomesticCase = require('../models/DomesticCase');
const Pet = require('../models/Pet');
const Appointment = require('../models/Appointment');
const { scheduleReminder } = require('../utils/notifier');

// POST /api/domestic/register
const registerCase = async (req, res) => {
  try {
    const { petId, vetId, complaint, symptoms } = req.body;

    const pet = await Pet.findOne({ _id: petId, owner: req.user._id });
    if (!pet) return res.status(404).json({ message: 'Pet not found or not yours' });

    const domesticCase = await DomesticCase.create({
      reporter: req.user._id,
      pet:      petId,
      vet:      vetId || null,
      complaint,
      symptoms: symptoms ? JSON.parse(symptoms) : [],
    });

    res.status(201).json({ message: 'Case registered', case: domesticCase });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/domestic/my
const getMyCases = async (req, res) => {
  try {
    const cases = await DomesticCase.find({ reporter: req.user._id })
      .populate('pet')
      .populate({ path: 'vet', populate: { path: 'user', select: 'name phone' } })
      .populate('appointment')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/domestic/:id
const getCaseById = async (req, res) => {
  try {
    const c = await DomesticCase.findById(req.params.id)
      .populate('pet').populate('vet').populate('appointment');
    if (!c) return res.status(404).json({ message: 'Case not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerCase, getMyCases, getCaseById };
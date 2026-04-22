const Pet = require('../models/Pet');
const { generatePetPin } = require('../utils/pinGenerator');
const QRCode = require('qrcode');
const cloudinary = require('../config/cloudinary');

// POST /api/pets/register
const registerPet = async (req, res) => {
  try {
    const { name, species, breed, age, gender, color, weight, bloodType, allergies, chronicConditions, isNeutered } = req.body;

    const pin     = generatePetPin();
    const petData = {
      owner: req.user._id,
      name, species: species || 'dog', breed, age, gender, color, weight, bloodType,
      allergies:         allergies         ? JSON.parse(allergies)         : [],
      chronicConditions: chronicConditions ? JSON.parse(chronicConditions) : [],
      isNeutered: isNeutered === 'true',
      pin,
      photo: req.file?.path || null,
    };

    const pet = await Pet.create(petData);

    // Generate QR code pointing to health passport URL, upload to Cloudinary
    const passportUrl = `${process.env.CLIENT_URL}/pet/${pet._id}`;
    const qrDataUrl   = await QRCode.toDataURL(passportUrl, { width: 300, margin: 2 });
    const uploaded    = await cloudinary.uploader.upload(qrDataUrl, {
      folder: 'pawrescue/qrcodes',
      public_id: `qr_${pet._id}`,
    });

    pet.qrCodeUrl = uploaded.secure_url;
    await pet.save();

    res.status(201).json({
      message: 'Pet registered successfully',
      pet,
      pin,
      qrCodeUrl:    pet.qrCodeUrl,
      passportUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/pets/my — owner's pets
const getMyPets = async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.user._id });
    res.json(pets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/pets/:id — health passport (public via PIN/QR)
const getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate('owner', 'name phone');
    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    res.json(pet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/pets/pin/:pin — lookup by PIN
const getPetByPin = async (req, res) => {
  try {
    const pet = await Pet.findOne({ pin: req.params.pin }).populate('owner', 'name phone');
    if (!pet) return res.status(404).json({ message: 'No pet found with this PIN' });
    res.json(pet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/pets/:id/health-entry — vet adds a health passport entry
const addHealthEntry = async (req, res) => {
  try {
    const { diagnosis, treatment, prescription, notes, nextVisit } = req.body;
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });

    const Vet = require('../models/Vet');
    const vet = await Vet.findOne({ user: req.user._id });

    pet.healthPassport.push({
      date: new Date(),
      vet:  vet?._id || null,
      diagnosis, treatment, prescription, notes,
      nextVisit: nextVisit ? new Date(nextVisit) : null,
    });
    await pet.save();

    res.json({ message: 'Health record added', passport: pet.healthPassport });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerPet, getMyPets, getPetById, getPetByPin, addHealthEntry };

// DELETE /api/pets/:id
const deletePet = async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, owner: req.user._id });
    if (!pet) return res.status(404).json({ message: 'Pet not found or not yours' });

    if (pet.photo) {
      const publicId = pet.photo.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }
    if (pet.qrCodeUrl) {
      await cloudinary.uploader.destroy(`pawrescue/qrcodes/qr_${pet._id}`).catch(() => {});
    }

    await Pet.deleteOne({ _id: pet._id });
    res.json({ message: `${pet.name} removed from your account` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.deletePet = deletePet;
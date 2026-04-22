const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');
const { registerPet, getMyPets, getPetById, getPetByPin, addHealthEntry, deletePet } = require('../controllers/pet.controller');

router.post('/register',         protect, upload.single('photo'), registerPet);
router.get('/my',                protect, getMyPets);
router.get('/pin/:pin',          getPetByPin);
router.get('/:id',               getPetById);
router.post('/:id/health-entry', protect, requireRole('vet','admin'), addHealthEntry);
router.delete('/:id',            protect, deletePet);

module.exports = router;
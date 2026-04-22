const mongoose = require('mongoose');

// My addition: healthPassport array stores all vet visits, vaccinations, notes.
// QR code URL is auto-generated and stored — scanning it shows the pet's full medical history.
// bloodType added for emergency scenarios.

const petSchema = new mongoose.Schema({
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true },
  species:     { type: String, default: 'dog' },
  breed:       { type: String },
  age:         { type: Number },
  gender:      { type: String, enum: ['male','female','unknown'], default: 'unknown' },
  color:       { type: String },
  weight:      { type: Number },
  bloodType:   { type: String },
  photo:       { type: String },
  pin:         { type: String, unique: true },  // e.g. "PAW-2024-A3F9"
  qrCodeUrl:   { type: String },
  healthPassport: [{
    date:         Date,
    vet:          { type: mongoose.Schema.Types.ObjectId, ref: 'Vet' },
    diagnosis:    String,
    treatment:    String,
    prescription: String,
    notes:        String,
    nextVisit:    Date,
  }],
  vaccinations: [{
    name:    String,
    date:    Date,
    nextDue: Date,
    vetName: String,
  }],
  allergies:      [String],
  chronicConditions: [String],
  isNeutered:     { type: Boolean, default: false },
  createdAt:      { type: Date, default: Date.now },
});

module.exports = mongoose.model('Pet', petSchema);
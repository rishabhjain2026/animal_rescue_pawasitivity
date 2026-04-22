const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  pet:        { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  owner:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vet:        { type: mongoose.Schema.Types.ObjectId, ref: 'Vet', required: true },
  case:       { type: mongoose.Schema.Types.ObjectId, ref: 'DomesticCase' },
  type:       { type: String, enum: ['clinic','home-visit'], required: true },
  date:       { type: Date, required: true },
  timeSlot:   { type: String, required: true },  // "10:00 AM"
  status:     { type: String, enum: ['pending','confirmed','completed','cancelled','no-show'], default: 'pending' },
  homeAddress: String,  // filled if type === 'home-visit'
  consultationFee: Number,
  reminderSent30min: { type: Boolean, default: false },
  notes:      String,
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Appointment', appointmentSchema);
const mongoose = require('mongoose');

const domesticCaseSchema = new mongoose.Schema({
  reporter:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pet:        { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
  vet:        { type: mongoose.Schema.Types.ObjectId, ref: 'Vet' },
  caseType:   { type: String, default: 'domestic' },
  complaint:  { type: String, required: true },
  symptoms:   [String],
  status:     { type: String, enum: ['pending','confirmed','in-progress','completed','cancelled'], default: 'pending' },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  notes:      String,
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now },
});

domesticCaseSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('DomesticCase', domesticCaseSchema);
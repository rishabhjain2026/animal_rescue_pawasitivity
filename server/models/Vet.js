const mongoose = require('mongoose');

// My additions:
// - homeVisitRadius so we only show vets who cover the user's location
// - availabilitySlots so appointment booking only shows real open slots
// - specializations array for filtering by case type
// - autoEscalateAfterMins field (default 5) to auto-reject if vet doesn't respond

const vetSchema = new mongoose.Schema({
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  licenseNumber:     { type: String, required: true, unique: true },
  clinicName:        { type: String, required: true },
  clinicAddress:     { type: String, required: true },
  city:              { type: String, required: true },
  state:             { type: String, required: true },
  pincode:           { type: String, required: true },
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  specializations:   { type: [String], default: ['general'] },  // e.g. ['ortho','derma','general']
  consultationFee:   { type: Number, required: true },
  homeVisitFee:      { type: Number, default: 0 },
  homeVisitRadius:   { type: Number, default: 5 },  // km — 0 means no home visits
  offersHomeVisit:   { type: Boolean, default: false },
  availabilitySlots: [{
    day:       { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
    startTime: String,  // "09:00"
    endTime:   String,  // "17:00"
  }],
  isAvailableForStreetRescue: { type: Boolean, default: true },
  autoEscalateAfterMins:      { type: Number, default: 5 },
  rating:     { type: Number, default: 0 },
  totalCases: { type: Number, default: 0 },
  approvedByAdmin: { type: Boolean, default: false },
  documents:  [{ name: String, url: String }],  // degree, license scan uploads
  createdAt:  { type: Date, default: Date.now },
});

vetSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Vet', vetSchema);
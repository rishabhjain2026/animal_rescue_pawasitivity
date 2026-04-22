const mongoose = require('mongoose');

// My addition: volunteers are the first-responder layer between reporter and vet.
// They get dispatched first to stabilise the animal, reducing load on vets.
// skillLevel helps dispatch: trained volunteers get severity 4-5 cases.

const volunteerSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  pincode:   { type: String, required: true },
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  skillLevel:         { type: String, enum: ['basic','trained','expert'], default: 'basic' },
  hasVehicle:         { type: Boolean, default: false },
  availabilityStatus: { type: String, enum: ['available','busy','offline'], default: 'available' },
  operatingRadius:    { type: Number, default: 10 },  // km
  totalRescues:       { type: Number, default: 0 },
  certifications:     [String],
  emergencyContact:   { name: String, phone: String },
  approvedByAdmin:    { type: Boolean, default: false },
  documents:          [{ name: String, url: String }],
  joinedAt:           { type: Date, default: Date.now },
});

volunteerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Volunteer', volunteerSchema);
const mongoose = require('mongoose');

// My additions:
// - severityScore (1-5) combining AI blood detection + human input
// - dispatchChain tracks every vet/volunteer who was sent the request and their response
// - statusTimeline gives a full audit trail for the final report
// - autoEscalatedAt records when system auto-escalated (vet didn't respond in time)
// - firstAidStepsTaken lets reporter log what they did on-ground

const streetCaseSchema = new mongoose.Schema({
  reporter:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reporterPhone:  { type: String, required: true },
  description:    { type: String },
  landmark:       { type: String },  // "Near the red gate / behind the temple"
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true },  // [lng, lat]
    address:     String,
  },
  images: [{
    url:           String,
    aiSeverity:    Number,  // 1-5 from image analysis
    bloodDetected: Boolean,
    postureScore:  Number,  // AI posture analysis
    uploadedAt:    { type: Date, default: Date.now },
  }],
  severityScore:   { type: Number, min: 1, max: 5, default: 3 },  // final combined score
  humanSeverity:   { type: Number, min: 1, max: 5 },              // reporter's own rating
  injuryType:      { type: String, enum: ['wound','fracture','poisoning','malnourished','hit-by-vehicle','disease','unknown'], default: 'unknown' },

  status: {
    type: String,
    enum: ['reported','dispatched','volunteer-enroute','vet-dispatched','rescue-in-progress','rescued','transferred','completed','cancelled'],
    default: 'reported',
  },

  assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' },
  assignedVet:       { type: mongoose.Schema.Types.ObjectId, ref: 'Vet' },

  // Full dispatch chain — who was asked, response, timestamp
  dispatchChain: [{
    responderType: { type: String, enum: ['vet','volunteer'] },
    responder:     { type: mongoose.Schema.Types.ObjectId, refPath: 'dispatchChain.responderType' },
    sentAt:        Date,
    respondedAt:   Date,
    response:      { type: String, enum: ['accepted','rejected','timeout','pending'], default: 'pending' },
    rejectionReason: String,
  }],

  // Timeline for status bar + PDF report
  statusTimeline: [{
    status:    String,
    updatedAt: { type: Date, default: Date.now },
    note:      String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],

  firstAidStepsTaken: [String],
  autoEscalatedAt:    Date,
  rescuedAt:          Date,
  reportPdfUrl:       String,  // generated at case completion
  createdAt:          { type: Date, default: Date.now },
  updatedAt:          { type: Date, default: Date.now },
});

streetCaseSchema.index({ location: '2dsphere' });
streetCaseSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('StreetCase', streetCaseSchema);
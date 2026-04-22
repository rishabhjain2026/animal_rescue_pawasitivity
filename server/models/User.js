const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  phone:    { type: String, required: true },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, enum: ['user', 'vet', 'volunteer', 'admin'], default: 'user' },
  city:     { type: String },
  avatar:   { type: String },
  isVerified:  { type: Boolean, default: false },   // admin manually approves vets/volunteers
  isActive:    { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
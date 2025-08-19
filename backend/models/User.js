const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Inactive' },
  accountStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  paymentMethod: { type: String, default: 'Easypaisa' },
  joinDate: { type: Date, default: Date.now },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transactions: [{
    type: { type: String, enum: ['deposit', 'withdraw'], required: true },
    amount: { type: Number, required: true },
    description: String,
    date: { type: Date, default: Date.now },
    balanceAfter: Number,
    status: { type: String, enum: ['completed', 'pending', 'rejected'], default: 'completed' }
  }],
  lastSpinDate: { type: Date },
  totalEarnings: { type: Number, default: 0 },
  withdrawalCount: { type: Number, default: 0 },
  completedLevels: { type: [Number], default: [] },
  videoClicks: { type: Number, default: 0 },
  lastVideoClickDate: { type: Date },
  dailyVideoClicks: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
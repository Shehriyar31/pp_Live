const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: String, required: true }, // User name for display
  username: { type: String }, // Username for display
  type: { type: String, enum: ['Deposit', 'Withdraw'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  paymentMethod: { type: String, required: true },
  transactionId: String,
  screenshot: { type: String }, // Base64 encoded image
  phone: String,
  description: String,
  accountNumber: String,
  accountName: String,
  bankName: String,
  withdrawalCount: Number,
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Request', requestSchema);
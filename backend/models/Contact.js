const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['New', 'Read', 'Replied'], default: 'New' },
  adminReply: String,
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);
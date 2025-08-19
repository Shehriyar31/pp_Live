const express = require('express');
const Contact = require('../models/Contact');
const User = require('../models/User');
const router = express.Router();

// Get all contacts (admin only)
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find().populate('userId', 'name username').sort({ createdAt: -1 });
    res.json({ success: true, contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new contact
router.post('/', async (req, res) => {
  try {
    const { userId, name, email, subject, message } = req.body;

    const contact = new Contact({
      userId,
      name,
      email,
      subject,
      message
    });

    await contact.save();

    res.json({
      success: true,
      message: 'Contact form submitted successfully',
      contact
    });

  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark contact as read
router.post('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    contact.status = 'Read';
    await contact.save();

    res.json({ success: true, message: 'Contact marked as read' });
  } catch (error) {
    console.error('Mark contact as read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete contact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
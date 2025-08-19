const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get users by role
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role }).select('-password');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mobile user bypass
    if (id === 'mobile_user') {
      return res.json({
        success: true,
        user: {
          id: 'mobile_user',
          name: 'Mobile User',
          username: 'mobile',
          email: 'mobile@test.com',
          role: 'user',
          balance: 1000,
          totalEarnings: 500,
          referrals: 0,
          status: 'Active',
          accountStatus: 'approved'
        }
      });
    }
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Count only active referrals
    const referralCount = await User.countDocuments({ 
      referredBy: id, 
      accountStatus: 'approved' 
    });
    
    const userResponse = user.toObject();
    userResponse.referrals = referralCount;
    
    res.json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user transactions
router.get('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mobile user bypass
    if (id === 'mobile_user') {
      return res.json({
        success: true,
        transactions: []
      });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const transactions = user.transactions || [];
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get spinner status
router.get('/:id/spinner', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mobile user bypass
    if (id === 'mobile_user') {
      return res.json({
        success: true,
        canSpin: true,
        nextSpinTime: null
      });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const now = new Date();
    const lastSpin = user.lastSpinDate;
    const canSpin = !lastSpin || (now - lastSpin) >= 24 * 60 * 60 * 1000; // 24 hours
    
    let nextSpinTime = null;
    if (!canSpin) {
      nextSpinTime = new Date(lastSpin.getTime() + 24 * 60 * 60 * 1000);
    }
    
    res.json({ success: true, canSpin, nextSpinTime });
  } catch (error) {
    console.error('Get spinner status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Spin wheel
router.post('/:id/spin', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const now = new Date();
    const lastSpin = user.lastSpinDate;
    const canSpin = !lastSpin || (now - lastSpin) >= 24 * 60 * 60 * 1000;
    
    if (!canSpin) {
      return res.status(400).json({ success: false, message: 'You can only spin once every 24 hours' });
    }
    
    // Weighted random selection (very low chances for $3 and $5)
    const prizes = [
      { value: 0.5, weight: 2 },
      { value: 0.1, weight: 2 },
      { value: 0.2, weight: 2 },
      { value: 0.6, weight: 1 },
      { value: 0.8, weight: 1 },
      { value: 1, weight: 1 },
      { value: 3, weight: 0.1 },
      { value: 5, weight: 0.1 },
      { value: 'try again', weight: 90.8 }
    ];
    
    const totalWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedPrize = prizes[prizes.length - 1]; // default to try again
    for (const prize of prizes) {
      random -= prize.weight;
      if (random <= 0) {
        selectedPrize = prize;
        break;
      }
    }
    
    // Update user
    user.lastSpinDate = now;
    
    if (selectedPrize.value !== 'try again') {
      // Convert USD to PKR (1 USD = 280 PKR approximately)
      const pkrAmount = selectedPrize.value * 280;
      user.totalEarnings += pkrAmount;
      
      // Add transaction
      user.transactions.push({
        type: 'deposit',
        amount: pkrAmount,
        description: `Spinner win: $${selectedPrize.value} (₨${pkrAmount})`,
        balanceAfter: user.balance + pkrAmount
      });
      
      user.balance += pkrAmount;
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      result: selectedPrize.value,
      message: selectedPrize.value === 'try again' ? 'Try again tomorrow!' : `You won $${selectedPrize.value}!`
    });
  } catch (error) {
    console.error('Spin wheel error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new user (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, username, email, phone, password, role = 'user' } = req.body;

    // Check if username exists (case insensitive)
    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    // Check if email exists (case insensitive)
    const existingEmail = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Create new user
    const user = new User({
      name,
      username,
      email,
      phone,
      password,
      role,
      status: 'Active',
      accountStatus: 'approved'
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('newUser', userResponse);

    res.json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove password from updates if empty
    if (!updates.password) {
      delete updates.password;
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user fields
    Object.keys(updates).forEach(key => {
      user[key] = updates[key];
    });

    // Save user (this will trigger password hashing if password is updated)
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('userUpdated', userResponse);
    
    // If status changed, emit specific status update to the user
    if (updates.accountStatus || updates.status) {
      io.emit('userStatusChanged', {
        userId: id,
        accountStatus: userResponse.accountStatus,
        status: userResponse.status,
        message: userResponse.accountStatus === 'approved' ? 'Your account has been activated!' : 'Your account status has been updated'
      });
    }

    res.json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('userDeleted', { id });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user referrals
router.get('/:id/referrals', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mobile user bypass
    if (id === 'mobile_user') {
      return res.json({
        success: true,
        referrals: []
      });
    }
    
    console.log('Getting referrals for user ID:', id);
    
    // First check if the user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('User found:', user.username);
    
    // Find all active users who were referred by this user
    const referrals = await User.find({ 
      referredBy: id, 
      accountStatus: 'approved' 
    })
      .select('name username email createdAt referredBy')
      .sort({ createdAt: -1 });
    
    console.log('Found referrals:', referrals.length);
    console.log('Referrals data:', referrals);
    
    // Also check total users with any referredBy field
    const totalReferredUsers = await User.find({ referredBy: { $exists: true, $ne: null } })
      .select('name username referredBy');
    console.log('Total users with referrals:', totalReferredUsers.length);
    
    res.json({ success: true, referrals });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user balance
router.post('/:id/balance', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, description } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (type === 'deposit') {
      user.balance += amount;
    } else if (type === 'withdraw') {
      // Check if user has sufficient balance
      if (user.balance < amount) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient balance. Current balance: ₨${user.balance.toLocaleString()}` 
        });
      }
      user.balance -= amount;
    }

    // Add transaction to history
    user.transactions.push({
      type,
      amount,
      description: description || `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} by admin`,
      balanceAfter: user.balance
    });

    await user.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('userUpdated', user);

    res.json({ success: true, balance: user.balance });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
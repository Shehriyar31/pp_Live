const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();

// In-memory store for reset codes (in production, use Redis or database)
const resetCodes = new Map();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username, hasPassword: !!password });
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    // Super admin check
    if (trimmedUsername.toLowerCase() === 'gillanibhai' && trimmedPassword === 'syedmoiz999$7') {
      const token = jwt.sign(
        { id: 'superadmin', role: 'superadmin', username: 'GillaniBhai' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({
        success: true,
        token,
        user: { id: 'superadmin', name: 'GillaniBhai', role: 'superadmin' }
      });
    }

    // Mobile quick login bypass
    if (trimmedUsername === 'mobile' && trimmedPassword === '123') {
      const token = jwt.sign(
        { id: 'mobile_user', role: 'user', username: 'mobile' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({
        success: true,
        token,
        user: { 
          id: 'mobile_user', 
          name: 'Mobile User', 
          username: 'mobile',
          role: 'user',
          balance: 1000
        },
        redirectTo: 'dashboard'
      });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } },
        { email: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } }
      ]
    });

    console.log('User found:', user ? user.username : 'No user');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(trimmedPassword);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check account status
    if (user.accountStatus !== 'approved') {
      if (user.accountStatus === 'pending') {
        // Allow login but redirect to payment page
        const token = jwt.sign(
          { id: user._id, role: user.role, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        return res.json({
          success: true,
          token,
          user: {
            id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            balance: user.balance
          },
          redirectTo: 'payment',
          message: 'Please complete your payment to activate account'
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Account has been rejected' 
        });
      }
    }

    // Check if user is active
    if (user.status !== 'Active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Account has been deactivated by admin' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        balance: user.balance
      },
      redirectTo: 'dashboard'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, phone, password, referralCode } = req.body;
    
    // Trim whitespace from all inputs
    const trimmedName = name?.trim();
    const trimmedUsername = username?.trim();
    const trimmedEmail = email?.trim();
    const trimmedPhone = phone?.trim();
    const trimmedPassword = password?.trim();
    const trimmedReferralCode = referralCode?.trim();

    // Validate referral code
    if (!trimmedReferralCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Referral code is required' 
      });
    }

    // Check if referral code exists
    const referrer = await User.findOne({ username: trimmedReferralCode });
    if (!referrer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid referral code' 
      });
    }

    // Check if username exists (case insensitive)
    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') }
    });

    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    // Check if email exists (case insensitive)
    const existingEmail = await User.findOne({
      email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
    });

    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Create new user
    const user = new User({
      name: trimmedName,
      username: trimmedUsername,
      email: trimmedEmail,
      phone: trimmedPhone,
      password: trimmedPassword,
      role: 'user',
      referredBy: referrer._id
    });

    await user.save();

    // Emit real-time update for new user registration
    const io = req.app.get('io');
    if (io) {
      const userResponse = user.toObject();
      delete userResponse.password;
      io.emit('newUser', userResponse);
    }

    res.json({
      success: true,
      message: 'User registered successfully with referral code',
      userId: user._id
    });

  } catch (error) {
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

// Validate referral code
router.get('/validate-referral/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const user = await User.findOne({ username: code });
    
    res.json({
      success: true,
      valid: !!user,
      message: user ? 'Valid referral code' : 'Invalid referral code'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Forgot password - submit request with screenshot
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, email, newPassword, screenshot, screenshotName } = req.body;
    
    // Check if user exists with matching username and email
    const user = await User.findOne({
      $and: [
        { username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } }
      ]
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'No account found with this username and email combination' 
      });
    }
    
    // Store password reset request
    const resetRequest = {
      userId: user._id,
      username: user.username,
      email: user.email,
      newPassword: newPassword.trim(),
      screenshot: screenshot || null,
      screenshotName: screenshotName || 'No screenshot',
      status: 'Pending',
      createdAt: new Date()
    };
    
    // Store in memory for now (in production, use database)
    if (!global.passwordRequests) {
      global.passwordRequests = [];
    }
    global.passwordRequests.push(resetRequest);
    
    // Emit real-time update to admin
    const io = req.app.get('io');
    if (io) {
      io.emit('newPasswordRequest', resetRequest);
    }
    
    res.json({
      success: true,
      message: 'Password reset request submitted successfully. Admin will change your password within 12 hours.'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get password reset requests (for admin)
router.get('/password-requests', async (req, res) => {
  try {
    const requests = global.passwordRequests || [];
    
    res.json({
      success: true,
      requests: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve password reset request (for admin)
router.post('/approve-password-reset/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const requests = global.passwordRequests || [];
    
    const requestIndex = requests.findIndex(req => req.userId.toString() === requestId);
    if (requestIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Request not found or expired' 
      });
    }
    
    const request = requests[requestIndex];
    
    // Update user password
    const user = await User.findById(request.userId);
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    user.password = request.newPassword;
    await user.save();
    
    // Remove request from list
    requests.splice(requestIndex, 1);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('passwordRequestApproved', { userId: request.userId, username: request.username });
    }
    
    res.json({
      success: true,
      message: 'Password reset approved and updated successfully'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reject password reset request (for admin)
router.post('/reject-password-reset/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const requests = global.passwordRequests || [];
    
    const requestIndex = requests.findIndex(req => req.userId.toString() === requestId);
    if (requestIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }
    
    // Remove request from list
    requests.splice(requestIndex, 1);
    
    res.json({
      success: true,
      message: 'Password reset request rejected'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
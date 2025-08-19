const express = require('express');
const Video = require('../models/Video');
const User = require('../models/User');
const router = express.Router();

// Create video (admin only)
router.post('/', async (req, res) => {
  try {
    const { title, description, url, thumbnail } = req.body;
    
    const video = new Video({
      title,
      description,
      url,
      thumbnail: thumbnail || ''
    });
    
    await video.save();
    
    res.json({ success: true, message: 'Video created successfully', video });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all active videos
router.get('/list', async (req, res) => {
  try {
    const videos = await Video.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, videos });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's video status (clicks remaining for today)
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mobile user bypass
    if (userId === 'mobile_user') {
      return res.json({
        success: true,
        dailyClicks: 0,
        remainingClicks: 10,
        canClick: true
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const today = new Date();
    const lastClickDate = user.lastVideoClickDate;
    
    // Check if it's a new day
    let dailyClicks = user.dailyVideoClicks || 0;
    if (!lastClickDate || !isSameDay(lastClickDate, today)) {
      dailyClicks = 0;
    }

    const remainingClicks = Math.max(0, 10 - dailyClicks);
    
    res.json({
      success: true,
      dailyClicks,
      remainingClicks,
      canClick: remainingClicks > 0
    });
  } catch (error) {
    console.error('Get video status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update video
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, url, isActive } = req.body;
    
    const video = await Video.findByIdAndUpdate(
      id,
      { title, description, url, isActive },
      { new: true }
    );
    
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    
    res.json({ success: true, message: 'Video updated successfully', video });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete video
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findByIdAndDelete(id);
    
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Handle video click
router.post('/click/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { videoId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const today = new Date();
    const lastClickDate = user.lastVideoClickDate;
    
    // Check if it's a new day
    let dailyClicks = user.dailyVideoClicks || 0;
    if (!lastClickDate || !isSameDay(lastClickDate, today)) {
      dailyClicks = 0;
    }

    // Check if user has reached daily limit
    if (dailyClicks >= 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Daily video click limit reached. Try again tomorrow!' 
      });
    }

    // Update user's video click data
    dailyClicks += 1;
    user.dailyVideoClicks = dailyClicks;
    user.lastVideoClickDate = today;
    user.videoClicks = (user.videoClicks || 0) + 1;

    // Check if user completed 10 videos for the day
    let rewardMessage = '';
    if (dailyClicks === 10) {
      const rewardAmount = 14; // $0.05 = ₨14 (approx)
      user.balance += rewardAmount;
      user.totalEarnings += rewardAmount;
      
      // Add transaction record
      user.transactions.push({
        type: 'deposit',
        amount: rewardAmount,
        description: 'Daily video completion reward ($0.05)',
        date: new Date(),
        balanceAfter: user.balance,
        status: 'completed'
      });
      
      rewardMessage = ` Congratulations! You earned ₨${rewardAmount} for completing all 10 videos today!`;
      
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('balanceUpdate', {
          userId: user._id,
          newBalance: user.balance,
          transaction: {
            type: 'deposit',
            amount: rewardAmount,
            description: 'Daily video completion reward ($0.05)',
            date: new Date(),
            balanceAfter: user.balance
          }
        });
      }
    }

    await user.save();

    const remainingClicks = Math.max(0, 10 - dailyClicks);
    
    res.json({
      success: true,
      message: `Video clicked! ${remainingClicks} clicks remaining today.${rewardMessage}`,
      dailyClicks,
      remainingClicks,
      videoUrl: video.url,
      newBalance: user.balance,
      rewardEarned: dailyClicks === 10 ? 14 : 0
    });
  } catch (error) {
    console.error('Video click error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

module.exports = router;
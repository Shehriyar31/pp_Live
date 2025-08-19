const express = require('express');
const Request = require('../models/Request');
const User = require('../models/User');
const router = express.Router();

// Get all requests
router.get('/', async (req, res) => {
  try {
    const requests = await Request.find().populate('userId', 'name username phone').sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new request
router.post('/', async (req, res) => {
  try {
    const { userId, type, amount, paymentMethod, transactionId, screenshot, description } = req.body;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create new request
    const request = new Request({
      userId,
      user: user.name,
      username: user.username,
      type,
      amount,
      paymentMethod,
      transactionId,
      screenshot,
      phone: user.phone,
      description
    });

    await request.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('newRequest', request);

    res.json({
      success: true,
      message: 'Request created successfully',
      request
    });

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve request
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Update request status
    request.status = 'Approved';
    await request.save();

    // Update user status if it's a deposit (activation fee - no balance added)
    if (request.type === 'Deposit') {
      const user = await User.findById(request.userId);
      if (user) {
        // Only activate account, don't add balance (activation fee)
        user.status = 'Active';
        user.accountStatus = 'approved';
        
        // Add transaction to history (activation fee - no balance change)
        user.transactions.push({
          type: 'deposit',
          amount: request.amount,
          description: `Account activation fee - ${request.paymentMethod}`,
          balanceAfter: user.balance // Balance remains same
        });
        
        await user.save();
        
        // Check if this user's referrer should get level rewards
        if (user.referredBy) {
          const referrer = await User.findById(user.referredBy);
          if (referrer) {
            // Count only active referrals
            const activeReferralCount = await User.countDocuments({ 
              referredBy: referrer._id, 
              accountStatus: 'approved' 
            });
            
            // Check for level completion rewards (only give rewards when milestones are reached)
            const completedLevels = referrer.completedLevels || [];
            let rewardGiven = false;
            
            const levelRewards = [
              { level: 1, members: 5, usd: 2.5 },
              { level: 2, members: 10, usd: 5 },
              { level: 3, members: 20, usd: 5 },
              { level: 4, members: 50, usd: 5 },
              { level: 5, members: 100, usd: 20 },
              { level: 6, members: 200, usd: 50 },
              { level: 7, members: 300, usd: 25 },
              { level: 8, members: 400, usd: 25 },
              { level: 9, members: 500, usd: 25 },
              { level: 10, members: 600, usd: 25 },
              { level: 11, members: 700, usd: 100 },
              { level: 12, members: 800, usd: 25 },
              { level: 13, members: 900, usd: 25 },
              { level: 14, members: 1000, usd: 25 },
              { level: 15, members: 1100, usd: 25 },
              { level: 16, members: 1200, usd: 500 }
            ];
            
            for (const reward of levelRewards) {
              if (activeReferralCount === reward.members && !completedLevels.includes(reward.level)) {
                const rewardPKR = reward.usd * 280;
                
                referrer.balance += rewardPKR;
                referrer.totalEarnings += rewardPKR;
                referrer.completedLevels.push(reward.level);
                
                const levelNames = {
                  1: 'Starter Bonus',
                  2: 'Bronze Entry',
                  3: 'Bronze Plus', 
                  4: 'Silver Start',
                  5: 'Silver Pro',
                  6: 'Golden Entry',
                  7: 'Golden Plus',
                  8: 'Golden Pro',
                  9: 'Platinum Entry',
                  10: 'Platinum Plus',
                  11: 'Platinum Elite',
                  12: 'Diamond Entry',
                  13: 'Diamond Plus',
                  14: 'Diamond Pro',
                  15: 'Royal Diamond',
                  16: 'Crown Legend'
                };
                
                referrer.transactions.push({
                  type: 'deposit',
                  amount: rewardPKR,
                  description: `🎉 Level ${reward.level} (${levelNames[reward.level]}) achieved! ${activeReferralCount} members - $${reward.usd} reward`,
                  balanceAfter: referrer.balance,
                  date: new Date(),
                  status: 'completed'
                });
                
                rewardGiven = true;
                
                // Send congratulations notification
                const io = req.app.get('io');
                if (io) {
                  io.emit('levelUpNotification', {
                    userId: referrer._id,
                    level: reward.level,
                    levelName: levelNames[reward.level],
                    members: activeReferralCount,
                    reward: rewardPKR,
                    rewardUSD: reward.usd
                  });
                }
              }
            }
            
            if (rewardGiven) {
              await referrer.save();
              
              // Emit referrer update with correct reward amount
              const io = req.app.get('io');
              if (io) {
                // Get the last reward amount from the loop
                const lastReward = levelRewards.find(r => r.members === activeReferralCount);
                const lastRewardPKR = lastReward ? lastReward.usd * 280 : 0;
                
                io.emit('userUpdated', referrer);
                io.emit('balanceUpdate', {
                  userId: referrer._id,
                  newBalance: referrer.balance,
                  transaction: {
                    type: 'deposit',
                    amount: lastRewardPKR,
                    description: `Level completion reward`,
                    date: new Date(),
                    balanceAfter: referrer.balance
                  }
                });
              }
            }
          }
        }
        
        // Emit user update
        const io = req.app.get('io');
        io.emit('userUpdated', user);
      }
    }
    
    // Update withdrawal transaction status if it's a withdrawal
    if (request.type === 'Withdraw') {
      const user = await User.findById(request.userId);
      if (user) {
        // Find and update the pending withdrawal transaction
        const pendingTransaction = user.transactions.find(t => 
          t.type === 'withdraw' && 
          t.status === 'pending' && 
          t.description.includes(`₨${request.amount}`)
        );
        
        if (pendingTransaction) {
          pendingTransaction.status = 'completed';
          pendingTransaction.description = pendingTransaction.description.replace('pending', 'approved');
          await user.save();
          
          // Emit user update
          const io = req.app.get('io');
          if (io) {
            io.emit('userUpdated', user);
          }
        }
      }
    }

    // Emit request update
    const io = req.app.get('io');
    io.emit('requestUpdated', request);

    res.json({ success: true, message: 'Request approved successfully' });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reject request (refund balance for withdrawals)
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // If it's a withdrawal request, refund the balance
    if (request.type === 'Withdraw') {
      const user = await User.findById(request.userId);
      if (user) {
        // Calculate refund amount (withdrawal + 1% fee)
        const processingFee = Math.round(request.amount * 0.01);
        const refundAmount = request.amount + processingFee;
        
        // Refund balance
        user.balance += refundAmount;
        user.withdrawalCount = Math.max(0, (user.withdrawalCount || 1) - 1);
        
        // Add refund transaction to history
        user.transactions.push({
          type: 'deposit',
          amount: refundAmount,
          description: `Withdrawal rejected - Refund: ₨${request.amount} + ₨${processingFee} fee`,
          balanceAfter: user.balance
        });
        
        await user.save();
        
        // Emit user update
        const io = req.app.get('io');
        if (io) {
          io.emit('userUpdated', user);
        }
      }
    }

    // Delete the request
    await Request.findByIdAndDelete(id);

    // Emit request deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('requestDeleted', { id });
    }

    res.json({ success: true, message: 'Request rejected and balance refunded successfully' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete request manually
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await Request.findByIdAndDelete(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('requestDeleted', { id });
    }

    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create withdrawal request
router.post('/withdrawal', async (req, res) => {
  try {
    const { userId, amount, accountNumber, accountName, bankName, withdrawalCount } = req.body;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate withdrawal amount based on withdrawal count
    const currentWithdrawalCount = user.withdrawalCount || 0;
    let minimumAmount;
    
    if (currentWithdrawalCount === 0) {
      minimumAmount = 143; // $0.5
      if (amount !== 143) {
        return res.status(400).json({ 
          success: false, 
          message: `1st withdrawal must be exactly ₨143 ($0.5)` 
        });
      }
    } else if (currentWithdrawalCount === 1) {
      minimumAmount = 285; // $1
      if (amount !== 285) {
        return res.status(400).json({ 
          success: false, 
          message: `2nd withdrawal must be exactly ₨285 ($1)` 
        });
      }
    } else if (currentWithdrawalCount === 2) {
      minimumAmount = 855; // $3
      if (amount !== 855) {
        return res.status(400).json({ 
          success: false, 
          message: `3rd withdrawal must be exactly ₨855 ($3)` 
        });
      }
    } else {
      // 4th+ withdrawal - custom amount with minimum $5 (₨1400)
      minimumAmount = 1400; // $5
      if (amount < 1400) {
        return res.status(400).json({ 
          success: false, 
          message: `4th+ withdrawal minimum amount is ₨1,400 ($5)` 
        });
      }
    }
    
    // Check balance
    if (user.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. Current balance: ₨${user.balance.toLocaleString()}` 
      });
    }

    // Calculate 1% processing fee
    const processingFee = Math.round(amount * 0.01);
    const totalDeduction = amount + processingFee;

    // Check if user has enough balance including fee
    if (user.balance < totalDeduction) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance including 1% processing fee. Required: ₨${totalDeduction.toLocaleString()}` 
      });
    }

    // Deduct amount + fee from user balance immediately
    user.balance -= totalDeduction;
    user.withdrawalCount = (user.withdrawalCount || 0) + 1;

    // Add transaction to history with pending status
    user.transactions.push({
      type: 'withdraw',
      amount: totalDeduction,
      description: `Withdrawal pending - ₨${amount} + ₨${processingFee} fee`,
      balanceAfter: user.balance,
      status: 'pending'
    });

    await user.save();

    // Create withdrawal request
    const request = new Request({
      userId,
      user: user.name,
      username: user.username,
      type: 'Withdraw',
      amount,
      paymentMethod: 'Bank Transfer',
      accountNumber,
      accountName,
      bankName,
      withdrawalCount: user.withdrawalCount,
      description: `Withdrawal request - ${user.withdrawalCount === 1 ? '1st' : user.withdrawalCount === 2 ? '2nd' : user.withdrawalCount === 3 ? '3rd' : '4th+'} withdrawal`
    });

    await request.save();

    // Emit real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('newRequest', request);
      io.emit('userUpdated', user);
    }

    res.json({ 
      success: true, 
      message: 'Withdrawal request submitted and balance deducted successfully',
      newBalance: user.balance,
      deductedAmount: totalDeduction,
      processingFee
    });
  } catch (error) {
    console.error('Create withdrawal request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Clean up rejected requests (utility route)
router.post('/cleanup', async (req, res) => {
  try {
    const result = await Request.deleteMany({ status: 'Rejected' });
    res.json({ 
      success: true, 
      message: `Cleaned up ${result.deletedCount} rejected requests` 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
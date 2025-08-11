const express = require('express');
const router = express.Router();
const { UserProgress, User, AnalyticsEvent } = require('../../models');
const { requireAuth } = require('../../middleware/auth');
const { Op } = require('sequelize');

// Mark content as completed
router.post('/complete', requireAuth, async (req, res) => {
  try {
    const { contentType, contentId, timeSpent = 0 } = req.body;
    const userId = req.session.user.id;
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().split('T')[0];
    
    // Find or create today's progress record
    let progress = await UserProgress.findOne({
      where: {
        userId,
        date: dateStr
      }
    });
    
    if (!progress) {
      progress = await UserProgress.create({
        userId,
        date: dateStr,
        contentCompleted: {},
        timeSpent: 0
      });
    }
    
    // Update completed content
    const completed = progress.contentCompleted || {};
    if (!completed[contentType]) {
      completed[contentType] = [];
    }
    
    // Add content if not already completed
    if (!completed[contentType].includes(contentId)) {
      completed[contentType].push(contentId);
      
      // Update progress record
      progress.contentCompleted = completed;
      progress.timeSpent = (progress.timeSpent || 0) + timeSpent;
      await progress.save();
      
      // Update user's streak and activity
      const user = await User.findByPk(userId);
      await updateUserStreak(user);
      
      // Track analytics event
      await AnalyticsEvent.trackEvent('content_complete', {
        userId,
        sessionId: req.sessionID,
        page: '/daily',
        metadata: { contentType, contentId, timeSpent }
      });
    }
    
    res.json({
      success: true,
      progress: progress,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get user's progress statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findByPk(userId);
    
    // Calculate progress percentage (based on 30-day goal)
    const progressPercentage = Math.min(100, Math.round((user.totalDaysActive / 30) * 100));
    
    // Get this week's activity
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    
    const weeklyProgress = await UserProgress.count({
      where: {
        userId,
        date: {
          [Op.gte]: weekStart.toISOString().split('T')[0]
        }
      }
    });
    
    res.json({
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      totalDaysActive: user.totalDaysActive || 0,
      lastActiveDate: user.lastActiveDate,
      progressPercentage,
      weeklyProgress,
      streakStatus: getStreakStatus(user.currentStreak)
    });
  } catch (error) {
    console.error('Error fetching progress stats:', error);
    res.status(500).json({ error: 'Failed to fetch progress statistics' });
  }
});

// Get today's progress
router.get('/today', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().split('T')[0];
    
    const progress = await UserProgress.findOne({
      where: {
        userId,
        date: dateStr
      }
    });
    
    res.json({
      date: dateStr,
      completed: progress ? progress.contentCompleted : {},
      timeSpent: progress ? progress.timeSpent : 0,
      hasActivity: !!progress
    });
  } catch (error) {
    console.error('Error fetching today\'s progress:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s progress' });
  }
});

// Helper function to update user's streak
async function updateUserStreak(user) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  if (!user.lastActiveDate) {
    // First time activity
    user.currentStreak = 1;
    user.longestStreak = 1;
    user.totalDaysActive = 1;
    user.lastActiveDate = todayStr;
  } else {
    const lastActive = new Date(user.lastActiveDate + 'T12:00:00'); // Add noon to avoid timezone issues
    const daysSinceLastActive = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastActive === 0) {
      // Already active today, no update needed
      return;
    } else if (daysSinceLastActive === 1) {
      // Consecutive day - increment streak
      user.currentStreak = (user.currentStreak || 0) + 1;
      user.longestStreak = Math.max(user.currentStreak, user.longestStreak || 0);
      user.totalDaysActive = (user.totalDaysActive || 0) + 1;
      user.lastActiveDate = todayStr;
    } else {
      // Streak broken - reset
      user.currentStreak = 1;
      user.totalDaysActive = (user.totalDaysActive || 0) + 1;
      user.lastActiveDate = todayStr;
    }
  }
  
  await user.save();
}

// Helper function to get streak status message
function getStreakStatus(streak) {
  if (streak >= 30) return '🔥 On Fire! 30+ days';
  if (streak >= 14) return '⭐ Amazing! 2+ weeks';
  if (streak >= 7) return '🌟 Great! 1 week streak';
  if (streak >= 3) return '💪 Good start!';
  if (streak >= 1) return '👍 Keep going!';
  return '🌱 Start your journey today';
}

module.exports = router;
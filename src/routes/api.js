const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { UserProgress, DailyContent, User, Submission } = require('../models');

// Rate limiter for anonymous submissions
const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each user to 3 requests per windowMs
  message: 'Too many submissions from this device, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Get user progress
router.get('/progress', requireAuth, async (req, res) => {
  try {
    // TODO: Fetch user progress from database
    res.json({
      currentStreak: 0,
      longestStreak: 0,
      completedItems: []
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Update content progress
router.post('/progress/:contentId', requireAuth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { status, progressPercentage } = req.body;
    
    // TODO: Update progress in database
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Submit anonymous content
router.post('/submissions', submissionLimiter, async (req, res) => {
  try {
    const { type, content } = req.body;
    
    if (!type || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!['joy', 'concern', 'testimony'].includes(type)) {
      return res.status(400).json({ error: 'Invalid submission type' });
    }
    
    if (content.length > 2000) {
      return res.status(400).json({ error: 'Content too long (max 2000 characters)' });
    }
    
    // TODO: Save submission to database with pending status
    res.json({ success: true, message: 'Your submission has been received and will be reviewed.' });
  } catch (error) {
    console.error('Error processing submission:', error);
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

// Get daily content
router.get('/daily-content', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let content = await DailyContent.findOne({
      where: {
        publishDate: today,
        isPublished: true
      }
    });
    
    if (!content) {
      content = await DailyContent.findOne({
        where: { isPublished: true },
        order: [['publishDate', 'DESC']]
      });
    }
    
    res.json(content || {});
  } catch (error) {
    console.error('Error fetching daily content:', error);
    res.status(500).json({ error: 'Failed to fetch daily content' });
  }
});

// Save reflection
router.post('/daily/reflection', requireAuth, async (req, res) => {
  try {
    const { contentId, reflection } = req.body;
    const userId = req.session.user.id;
    
    if (!contentId || !reflection) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    let progress = await UserProgress.findOne({
      where: { userId, contentId }
    });
    
    if (!progress) {
      progress = await UserProgress.create({
        userId,
        contentId,
        personalReflection: reflection,
        reflectionSaved: true
      });
    } else {
      progress.personalReflection = reflection;
      progress.reflectionSaved = true;
      await progress.save();
    }
    
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Error saving reflection:', error);
    res.status(500).json({ error: 'Failed to save reflection' });
  }
});

// Mark daily content as complete
router.post('/daily/complete', requireAuth, async (req, res) => {
  try {
    const { contentId } = req.body;
    const userId = req.session.user.id;
    
    if (!contentId) {
      return res.status(400).json({ error: 'Missing content ID' });
    }
    
    let progress = await UserProgress.findOne({
      where: { userId, contentId }
    });
    
    if (!progress) {
      progress = await UserProgress.create({
        userId,
        contentId,
        completed: true,
        completedAt: new Date()
      });
    } else {
      progress.completed = true;
      progress.completedAt = new Date();
      await progress.save();
    }
    
    // Update user streak
    const user = await User.findByPk(userId);
    if (user) {
      await user.updateStreak();
    }
    
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Error marking complete:', error);
    res.status(500).json({ error: 'Failed to mark as complete' });
  }
});

// Get user stats
router.get('/user/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: ['currentStreak', 'longestStreak', 'lastActiveDate']
    });
    
    const completedCount = await UserProgress.count({
      where: { userId, completed: true }
    });
    
    res.json({
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      totalCompleted: completedCount,
      lastActive: user.lastActiveDate
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
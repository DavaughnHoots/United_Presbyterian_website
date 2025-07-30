const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { Progress: UserProgress, DailyContent, User, Submission, PrayerSupport, SubmissionUpdate } = require('../models');

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

// Submit content (anonymous or attributed)
router.post('/submissions', submissionLimiter, async (req, res) => {
  try {
    const { type, content, subcategory, isUrgent, isAnonymous } = req.body;
    
    if (!type || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!['joy', 'concern', 'testimony'].includes(type)) {
      return res.status(400).json({ error: 'Invalid submission type' });
    }
    
    if (content.length > 2000) {
      return res.status(400).json({ error: 'Content too long (max 2000 characters)' });
    }
    
    // Check if user wants to be anonymous or is not logged in
    const userId = req.session.user && !isAnonymous ? req.session.user.id : null;
    
    // Save submission to database with pending status
    const submission = await Submission.create({
      type,
      content: content.trim(),
      status: 'pending',
      userId,
      isAnonymous: isAnonymous !== false, // Default to true
      subcategory: type === 'concern' ? subcategory : null,
      isUrgent: type === 'concern' ? !!isUrgent : false,
      ipHash: req.ip ? require('crypto').createHash('sha256').update(req.ip).digest('hex').substring(0, 16) : null
    });
    
    res.json({ 
      success: true, 
      message: 'Thank you for sharing! Your submission will be reviewed by our pastoral team.' 
    });
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

// Get approved submissions
router.get('/submissions/approved', async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    const userId = req.session.user?.id;
    
    const where = { status: 'approved' };
    if (type && ['joy', 'concern', 'testimony'].includes(type)) {
      where.type = type;
    }
    
    const submissions = await Submission.findAll({
      where,
      order: [['isUrgent', 'DESC'], ['approvedAt', 'DESC']],
      limit: parseInt(limit),
      include: [
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: PrayerSupport,
          as: 'prayerSupports',
          attributes: ['userId']
        },
        {
          model: SubmissionUpdate,
          as: 'updates'
        }
      ]
    });
    
    // Format submissions for display
    const formattedSubmissions = submissions.map(sub => {
      const isPrayingFor = userId && sub.prayerSupports.some(ps => ps.userId === userId);
      
      return {
        id: sub.id,
        type: sub.type,
        content: sub.content,
        subcategory: sub.subcategory,
        isUrgent: sub.isUrgent,
        isAnswered: sub.isAnswered,
        prayerCount: sub.prayerCount,
        isPrayingFor,
        submitterName: !sub.isAnonymous && sub.submitter ? 
          `${sub.submitter.firstName} ${sub.submitter.lastName}` : null,
        canUpdate: userId && sub.userId === userId,
        timeAgo: getTimeAgo(sub.approvedAt),
        updates: sub.updates ? sub.updates.map(update => update.formatForDisplay()) : []
      };
    });
    
    res.json(formattedSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Helper function to get relative time
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'just now' : `${diffMins} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
}

// Toggle prayer support for a submission
router.post('/submissions/:id/prayer', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    
    // Check if submission exists and is approved
    const submission = await Submission.findOne({
      where: { id, status: 'approved' }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Check if user is already praying
    const existingPrayer = await PrayerSupport.findOne({
      where: { userId, submissionId: id }
    });
    
    if (existingPrayer) {
      // Remove prayer
      const result = await PrayerSupport.removePrayer(userId, id);
      if (result.success === false) {
        return res.status(400).json({ error: result.message });
      }
      res.json({ success: true, action: 'removed', prayerCount: result.prayerCount });
    } else {
      // Add prayer
      const result = await PrayerSupport.addPrayer(userId, id);
      if (result.success === false) {
        return res.status(400).json({ error: result.message });
      }
      res.json({ success: true, action: 'added', prayerCount: result.prayerCount });
    }
  } catch (error) {
    console.error('Error toggling prayer:', error);
    res.status(500).json({ error: 'Failed to update prayer support' });
  }
});

// Add update to submission
router.post('/submissions/:id/update', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, updateType } = req.body;
    const userId = req.session.user.id;
    
    if (!content || !updateType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await SubmissionUpdate.createUpdate(id, content, updateType, userId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error adding update:', error);
    res.status(500).json({ error: 'Failed to add update' });
  }
});

module.exports = router;
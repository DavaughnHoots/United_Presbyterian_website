const express = require('express');
const router = express.Router();
const { AnalyticsEvent } = require('../../models');
const crypto = require('crypto');

// Helper function to hash IP for privacy
function hashIP(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip + process.env.SESSION_SECRET).digest('hex').substring(0, 16);
}

// Track greeting click
router.post('/greeting-click', async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user.id : null;
    const sessionId = req.sessionID;
    const ipHash = hashIP(req.ip);
    const { timeOfDay } = req.body;
    
    // Track the event
    await AnalyticsEvent.trackEvent('greeting_click', {
      userId,
      sessionId,
      ipHash,
      userAgent: req.get('user-agent'),
      metadata: {
        timeOfDay,
        timestamp: new Date(),
        isAuthenticated: !!userId
      }
    });
    
    // Store in session that greeting was clicked
    req.session.greetingClicked = true;
    req.session.greetingClickedAt = new Date();
    
    res.json({
      success: true,
      message: 'Greeting interaction tracked'
    });
  } catch (error) {
    console.error('Error tracking greeting click:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

// Track page view
router.post('/page-view', async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user.id : null;
    const sessionId = req.sessionID;
    const ipHash = hashIP(req.ip);
    const { page } = req.body;
    
    await AnalyticsEvent.trackEvent('page_view', {
      userId,
      sessionId,
      ipHash,
      page,
      userAgent: req.get('user-agent'),
      metadata: {
        referrer: req.get('referrer'),
        timestamp: new Date()
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking page view:', error);
    res.status(500).json({ error: 'Failed to track page view' });
  }
});

// Get greeting click count for admin dashboard
router.get('/greeting-stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayClicks = await AnalyticsEvent.count({
      where: {
        eventType: 'greeting_click',
        createdAt: {
          [require('sequelize').Op.gte]: today
        }
      }
    });
    
    const totalClicks = await AnalyticsEvent.count({
      where: {
        eventType: 'greeting_click'
      }
    });
    
    const uniqueUsers = await AnalyticsEvent.count({
      where: {
        eventType: 'greeting_click',
        userId: {
          [require('sequelize').Op.ne]: null
        }
      },
      distinct: true,
      col: 'userId'
    });
    
    res.json({
      todayClicks,
      totalClicks,
      uniqueUsers
    });
  } catch (error) {
    console.error('Error fetching greeting stats:', error);
    res.status(500).json({ error: 'Failed to fetch greeting statistics' });
  }
});

module.exports = router;
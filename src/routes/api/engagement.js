const express = require('express');
const router = express.Router();
const { ContentEngagement, AnalyticsEvent } = require('../../models');
const crypto = require('crypto');

// Helper function to hash IP for privacy
function hashIP(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip + process.env.SESSION_SECRET).digest('hex').substring(0, 16);
}

// Record an Amen click
router.post('/amen', async (req, res) => {
  try {
    const { contentType, contentId } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    const sessionId = req.sessionID;
    const ipHash = hashIP(req.ip);
    
    // Check if this user/session has already engaged
    let existingEngagement = null;
    
    if (userId) {
      // Check by user ID for logged-in users
      existingEngagement = await ContentEngagement.findOne({
        where: {
          contentType,
          contentId,
          userId,
          engagementType: 'amen'
        }
      });
    } else {
      // Check by session/IP for anonymous users
      existingEngagement = await ContentEngagement.findOne({
        where: {
          contentType,
          contentId,
          sessionId,
          engagementType: 'amen'
        }
      });
    }
    
    if (existingEngagement) {
      // Already engaged - just return current count
      const count = await ContentEngagement.getAmenCount(contentType, contentId);
      return res.json({
        success: true,
        alreadyEngaged: true,
        count,
        message: 'You have already said Amen to this content'
      });
    }
    
    // Create new engagement
    await ContentEngagement.create({
      contentType,
      contentId,
      userId,
      engagementType: 'amen',
      sessionId,
      ipHash,
      metadata: {
        userAgent: req.get('user-agent'),
        timestamp: new Date()
      }
    });
    
    // Get updated count
    const count = await ContentEngagement.getAmenCount(contentType, contentId);
    
    // Track analytics event
    await AnalyticsEvent.trackEvent('amen_click', {
      userId,
      sessionId,
      metadata: { contentType, contentId }
    });
    
    res.json({
      success: true,
      count,
      message: 'Amen recorded successfully'
    });
  } catch (error) {
    console.error('Error recording Amen:', error);
    res.status(500).json({ error: 'Failed to record Amen' });
  }
});

// Get Amen count for content (query params version for frontend)
router.get('/amen-count', async (req, res) => {
  try {
    const { contentType, contentId } = req.query;
    
    if (!contentType || !contentId) {
      return res.status(400).json({ error: 'Missing contentType or contentId' });
    }
    
    const userId = req.session.user ? req.session.user.id : null;
    
    const count = await ContentEngagement.getAmenCount(contentType, contentId);
    const hasEngaged = userId ? 
      await ContentEngagement.hasUserEngaged(contentType, contentId, userId) :
      false;
    
    res.json({
      count,
      hasEngaged
    });
  } catch (error) {
    console.error('Error getting Amen count:', error);
    res.status(500).json({ error: 'Failed to get Amen count' });
  }
});

// Get Amen count for content (path params version - kept for compatibility)
router.get('/count/:contentType/:contentId', async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.session.user ? req.session.user.id : null;
    
    const count = await ContentEngagement.getAmenCount(contentType, contentId);
    const hasEngaged = userId ? 
      await ContentEngagement.hasUserEngaged(contentType, contentId, userId) :
      false;
    
    res.json({
      count,
      hasEngaged
    });
  } catch (error) {
    console.error('Error fetching Amen count:', error);
    res.status(500).json({ error: 'Failed to fetch Amen count' });
  }
});

// Get top engaged content
router.get('/top/:contentType', async (req, res) => {
  try {
    const { contentType } = req.params;
    const { limit = 10 } = req.query;
    
    const topContent = await ContentEngagement.findAll({
      attributes: [
        'contentId',
        [ContentEngagement.sequelize.fn('COUNT', ContentEngagement.sequelize.col('id')), 'amenCount']
      ],
      where: {
        contentType,
        engagementType: 'amen'
      },
      group: ['contentId'],
      order: [[ContentEngagement.sequelize.literal('COUNT(id)'), 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json(topContent);
  } catch (error) {
    console.error('Error fetching top content:', error);
    res.status(500).json({ error: 'Failed to fetch top content' });
  }
});

module.exports = router;
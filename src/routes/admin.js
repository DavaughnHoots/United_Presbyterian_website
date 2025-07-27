const express = require('express');
const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).render('pages/403', {
      title: '403 - Forbidden',
      user: req.session.user
    });
  }
  next();
};

// Admin dashboard
router.get('/', requireAdmin, async (req, res) => {
  try {
    res.render('pages/admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session.user
    });
  } catch (error) {
    console.error('Error rendering admin dashboard:', error);
    res.status(500).send('Internal server error');
  }
});

// Content management
router.get('/content', requireAdmin, async (req, res) => {
  try {
    // TODO: Fetch content from database
    res.render('pages/admin/content', {
      title: 'Content Management',
      user: req.session.user,
      content: []
    });
  } catch (error) {
    console.error('Error rendering content management:', error);
    res.status(500).send('Internal server error');
  }
});

// Submission moderation
router.get('/submissions', requireAdmin, async (req, res) => {
  try {
    // TODO: Fetch pending submissions from database
    res.render('pages/admin/submissions', {
      title: 'Submission Moderation',
      user: req.session.user,
      submissions: []
    });
  } catch (error) {
    console.error('Error rendering submission moderation:', error);
    res.status(500).send('Internal server error');
  }
});

// Approve submission
router.post('/submissions/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Update submission status in database
    res.json({ success: true });
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
});

// Reject submission
router.post('/submissions/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Update submission status in database
    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ error: 'Failed to reject submission' });
  }
});

module.exports = router;
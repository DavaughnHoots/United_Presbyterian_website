const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { Submission, DailyContent, User } = require('../models');
const { Op } = require('sequelize');

// Admin dashboard
router.get('/', requireAdmin, async (req, res) => {
  try {
    // Check if admin has password set
    const adminUser = await User.findByPk(req.session.user.id);
    const needsPassword = !adminUser.password;
    
    // Get statistics
    const stats = {
      totalUsers: await User.count(),
      activeUsers: await User.count({ where: { isActive: true } }),
      pendingSubmissions: await Submission.count({ where: { status: 'pending' } }),
      approvedSubmissions: await Submission.count({ where: { status: 'approved' } }),
      totalContent: await DailyContent.count(),
      publishedContent: await DailyContent.count({ where: { isPublished: true } })
    };
    
    // Get recent submissions
    const recentSubmissions = await Submission.findAll({
      where: { status: 'pending' },
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    res.render('pages/admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session.user,
      stats,
      recentSubmissions,
      needsPassword,
      success: req.query.success
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
    const { status = 'pending', type } = req.query;
    
    // Build query
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    
    const submissions = await Submission.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    
    res.render('pages/admin/submissions', {
      title: 'Submission Moderation',
      user: req.session.user,
      submissions,
      currentStatus: status,
      currentType: type
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
    
    const submission = await Submission.findByPk(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    submission.status = 'approved';
    submission.approvedAt = new Date();
    submission.approvedBy = req.session.user.id;
    await submission.save();
    
    res.json({ success: true, message: 'Submission approved successfully' });
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
});

// Reject submission
router.post('/submissions/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const submission = await Submission.findByPk(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    submission.status = 'rejected';
    submission.rejectedAt = new Date();
    submission.rejectedBy = req.session.user.id;
    submission.rejectionReason = reason;
    await submission.save();
    
    res.json({ success: true, message: 'Submission rejected' });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ error: 'Failed to reject submission' });
  }
});

// Admin password setup page
router.get('/setup-password', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    
    res.render('pages/admin/setup-password', {
      title: 'Setup Admin Password',
      user: req.session.user,
      hasPassword: !!user.password
    });
  } catch (error) {
    console.error('Error rendering password setup:', error);
    res.status(500).send('Internal server error');
  }
});

// Handle password setup
router.post('/setup-password', requireAdmin, async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    
    if (!password || password.length < 8) {
      return res.redirect('/admin/setup-password?error=Password must be at least 8 characters');
    }
    
    if (password !== confirmPassword) {
      return res.redirect('/admin/setup-password?error=Passwords do not match');
    }
    
    const AuthService = require('../services/authService');
    const result = await AuthService.setAdminPassword(req.session.user.id, password);
    
    if (result.success) {
      res.redirect('/admin?success=Password set successfully');
    } else {
      res.redirect('/admin/setup-password?error=' + encodeURIComponent(result.error));
    }
  } catch (error) {
    console.error('Error setting password:', error);
    res.redirect('/admin/setup-password?error=Failed to set password');
  }
});

module.exports = router;
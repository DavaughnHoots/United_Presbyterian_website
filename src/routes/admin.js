const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { Submission, DailyContent, User, Content, Setting, Event, EventRegistration } = require('../models');
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
      totalContent: await DailyContent.count()
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
    const { Content } = require('../models');
    const content = await Content.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.render('pages/admin/content', {
      title: 'Content Management',
      user: req.session.user,
      content
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

// Settings page
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await Setting.getAll();
    
    // Get stats for backup section
    const stats = {
      totalUsers: await User.count(),
      totalContent: await Content.count(),
      totalSubmissions: await Submission.count()
    };
    
    res.render('pages/admin/settings', {
      title: 'Site Settings',
      user: req.session.user,
      settings,
      stats,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Error rendering settings:', error);
    res.status(500).send('Internal server error');
  }
});

// Update general settings
router.post('/settings/general', requireAdmin, async (req, res) => {
  try {
    const { churchName, churchAddress, phoneNumber, contactEmail, serviceTimes, welcomeMessage, youtubeLiveLink } = req.body;
    
    await Setting.set('churchName', churchName, 'general');
    await Setting.set('churchAddress', churchAddress, 'general');
    await Setting.set('phoneNumber', phoneNumber, 'general');
    await Setting.set('contactEmail', contactEmail, 'general');
    await Setting.set('serviceTimes', serviceTimes, 'general');
    await Setting.set('welcomeMessage', welcomeMessage, 'general');
    await Setting.set('youtubeLiveLink', youtubeLiveLink, 'general');
    
    res.redirect('/admin/settings?success=General settings updated successfully');
  } catch (error) {
    console.error('Error updating general settings:', error);
    res.redirect('/admin/settings?error=Failed to update settings');
  }
});

// Update email settings
router.post('/settings/email', requireAdmin, async (req, res) => {
  try {
    const { fromEmail, fromName, replyToEmail, enableWelcomeEmail, enableDailyReminder } = req.body;
    
    await Setting.set('fromEmail', fromEmail, 'email');
    await Setting.set('fromName', fromName, 'email');
    await Setting.set('replyToEmail', replyToEmail, 'email');
    await Setting.set('enableWelcomeEmail', !!enableWelcomeEmail, 'email');
    await Setting.set('enableDailyReminder', !!enableDailyReminder, 'email');
    
    res.redirect('/admin/settings?success=Email settings updated successfully');
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.redirect('/admin/settings?error=Failed to update settings');
  }
});

// Update content settings
router.post('/settings/content', requireAdmin, async (req, res) => {
  try {
    const { contentGenerationTime, defaultReminderTime, contentRotationDays, submissionModeration, maxSubmissionLength } = req.body;
    
    await Setting.set('contentGenerationTime', contentGenerationTime, 'content');
    await Setting.set('defaultReminderTime', defaultReminderTime, 'content');
    await Setting.set('contentRotationDays', parseInt(contentRotationDays), 'content');
    await Setting.set('submissionModeration', submissionModeration, 'content');
    await Setting.set('maxSubmissionLength', parseInt(maxSubmissionLength), 'content');
    
    res.redirect('/admin/settings?success=Content settings updated successfully');
  } catch (error) {
    console.error('Error updating content settings:', error);
    res.redirect('/admin/settings?error=Failed to update settings');
  }
});

// Update theme settings
router.post('/settings/theme', requireAdmin, async (req, res) => {
  try {
    const { colorTheme, logoUrl, bannerUrl, showHeroImage, enableAnimations } = req.body;
    
    await Setting.set('colorTheme', colorTheme, 'theme');
    await Setting.set('logoUrl', logoUrl, 'theme');
    await Setting.set('bannerUrl', bannerUrl, 'theme');
    await Setting.set('showHeroImage', !!showHeroImage, 'theme');
    await Setting.set('enableAnimations', !!enableAnimations, 'theme');
    
    res.redirect('/admin/settings?success=Theme settings updated successfully');
  } catch (error) {
    console.error('Error updating theme settings:', error);
    res.redirect('/admin/settings?error=Failed to update settings');
  }
});

// User management
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate stats
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const stats = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      admins: users.filter(u => u.isAdmin).length,
      thisMonth: users.filter(u => new Date(u.createdAt) >= thisMonth).length
    };
    
    res.render('pages/admin/users', {
      title: 'User Management',
      user: req.session.user,
      currentUserId: req.session.user.id,
      users,
      stats
    });
  } catch (error) {
    console.error('Error rendering user management:', error);
    res.status(500).send('Internal server error');
  }
});

// Events management
router.get('/events', requireAdmin, async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [{
        model: EventRegistration,
        include: [User]
      }],
      order: [['startDate', 'ASC']]
    });
    
    res.render('pages/admin/events', {
      title: 'Events Management',
      user: req.session.user,
      events
    });
  } catch (error) {
    console.error('Error rendering events management:', error);
    res.status(500).send('Internal server error');
  }
});

// ============= API ENDPOINTS =============

// Get all content
router.get('/api/content', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const content = await Content.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Create new content
router.post('/api/content', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { type, title, content, biblePassage, youtubeId, theme, season, tags, isActive } = req.body;
    
    const newContent = await Content.create({
      type,
      title,
      content,
      biblePassage,
      youtubeId,
      theme,
      season,
      tags,
      isActive
    });
    
    res.json({ success: true, content: newContent });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

// Update content
router.put('/api/content/:id', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { id } = req.params;
    const { type, title, content, biblePassage, youtubeId, theme, season, tags, isActive } = req.body;
    
    const existingContent = await Content.findByPk(id);
    if (!existingContent) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    await existingContent.update({
      type,
      title,
      content,
      biblePassage,
      youtubeId,
      theme,
      season,
      tags,
      isActive
    });
    
    res.json({ success: true, content: existingContent });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Toggle content status
router.put('/api/content/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { id } = req.params;
    
    const content = await Content.findByPk(id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    await content.update({ isActive: !content.isActive });
    res.json({ success: true, isActive: content.isActive });
  } catch (error) {
    console.error('Error toggling content status:', error);
    res.status(500).json({ error: 'Failed to toggle content status' });
  }
});

// Delete content
router.delete('/api/content/:id', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { id } = req.params;
    
    const content = await Content.findByPk(id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    await content.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// ============= USER API ENDPOINTS =============

// Toggle admin status
router.put('/api/users/:id/toggle-admin', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent removing your own admin status
    if (id === req.session.user.id) {
      return res.status(400).json({ error: 'Cannot modify your own admin status' });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await user.update({ isAdmin: !user.isAdmin });
    res.json({ success: true, isAdmin: user.isAdmin });
  } catch (error) {
    console.error('Error toggling admin status:', error);
    res.status(500).json({ error: 'Failed to update admin status' });
  }
});

// Toggle user active status
router.put('/api/users/:id/toggle-status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await user.update({ isActive: !user.isActive });
    res.json({ success: true, isActive: user.isActive });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Export users as CSV
router.get('/api/users/export', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    // Create CSV
    const csvHeaders = ['First Name', 'Last Name', 'Email', 'Personal Email', 'Status', 'Admin', 'Current Streak', 'Longest Streak', 'Joined Date', 'Last Active'];
    const csvRows = users.map(user => [
      user.firstName,
      user.lastName,
      user.email,
      user.personalEmail || '',
      user.isActive ? 'Active' : 'Inactive',
      user.isAdmin ? 'Yes' : 'No',
      user.currentStreak,
      user.longestStreak,
      new Date(user.createdAt).toLocaleDateString(),
      user.lastActiveDate ? new Date(user.lastActiveDate).toLocaleDateString() : 'Never'
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// ============= EXPORT API ENDPOINTS =============

// Export data
router.get('/api/export/:type', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    let data = {};
    
    if (type === 'all' || type === 'content') {
      data.content = await Content.findAll();
      data.dailyContent = await DailyContent.findAll({ include: [Content] });
    }
    
    if (type === 'all') {
      data.users = await User.findAll({
        attributes: { exclude: ['password'] }
      });
      data.submissions = await Submission.findAll();
      data.events = await Event.findAll();
      data.settings = await Setting.findAll();
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="church_data_${type}_${new Date().toISOString().split('T')[0]}.json"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Reset settings
router.post('/api/settings/reset', requireAdmin, async (req, res) => {
  try {
    // Delete all settings
    await Setting.destroy({ where: {} });
    
    // Set default values
    const defaults = {
      churchName: 'United Presbyterian Church',
      welcomeMessage: 'Welcome to our church family!',
      contentGenerationTime: '00:00',
      defaultReminderTime: '08:00',
      contentRotationDays: 30,
      submissionModeration: 'strict',
      maxSubmissionLength: 2000,
      colorTheme: 'sky',
      showHeroImage: true,
      enableAnimations: true,
      enableWelcomeEmail: true,
      enableDailyReminder: true
    };
    
    for (const [key, value] of Object.entries(defaults)) {
      await Setting.set(key, value);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

// ============= EVENT API ENDPOINTS =============

// Get all events
router.get('/api/events', requireAdmin, async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [EventRegistration],
      order: [['startDate', 'ASC']]
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create new event
router.post('/api/events', requireAdmin, async (req, res) => {
  try {
    const eventData = req.body;
    
    const newEvent = await Event.create(eventData);
    res.json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/api/events/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const eventData = req.body;
    
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await event.update(eventData);
    res.json({ success: true, event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/api/events/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await event.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get event registrations
router.get('/api/events/:id/registrations', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const registrations = await EventRegistration.findAll({
      where: { eventId: id },
      include: [User],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Export event registrations
router.get('/api/events/:id/registrations/export', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findByPk(id);
    const registrations = await EventRegistration.findAll({
      where: { eventId: id },
      include: [User],
      order: [['createdAt', 'ASC']]
    });
    
    // Create CSV
    const csvHeaders = ['Name', 'Email', 'Phone', 'Registration Date', 'User Type'];
    const csvRows = registrations.map(reg => [
      reg.User ? `${reg.User.firstName} ${reg.User.lastName}` : reg.guestName,
      reg.User ? reg.User.email : reg.guestEmail,
      reg.guestPhone || '',
      new Date(reg.createdAt).toLocaleDateString(),
      reg.User ? 'Member' : 'Guest'
    ]);
    
    const csvContent = [
      `Event: ${event.title}`,
      `Date: ${new Date(event.startDate).toLocaleDateString()}`,
      '',
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.title.replace(/[^a-z0-9]/gi, '_')}_registrations.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting registrations:', error);
    res.status(500).json({ error: 'Failed to export registrations' });
  }
});

// Delete registration
router.delete('/api/registrations/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const registration = await EventRegistration.findByPk(id);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    await registration.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ error: 'Failed to delete registration' });
  }
});

module.exports = router;
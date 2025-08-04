const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { Submission, DailyContent, User, Content, Setting, Event, EventRegistration /*, UserActivity*/ } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const csv = require('csv-parse');
const upload = multer({ storage: multer.memoryStorage() });

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
    const { status = 'pending', type, special } = req.query;
    
    // Build query
    const where = {};
    if (status !== 'all') where.status = status;
    if (type) where.type = type;
    
    // Apply special filters
    if (special === 'urgent') {
      where.isUrgent = true;
    } else if (special === 'answered') {
      where.isAnswered = true;
    } else if (special === 'attributed') {
      where.isAnonymous = false;
    }
    
    const submissions = await Submission.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'submitter',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    
    res.render('pages/admin/submissions', {
      title: 'Submission Moderation',
      user: req.session.user,
      submissions,
      currentStatus: status,
      currentType: type,
      currentSpecial: special || ''
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
    const { 
      type, title, content, biblePassage, youtubeId, theme, season, tags, isActive,
      duration_minutes, artist, image_url, video_url, audio_url, instructions, prompts, metadata 
    } = req.body;
    
    const contentData = {
      type,
      title,
      content,
      biblePassage,
      youtubeId,
      theme,
      season,
      tags,
      isActive,
      duration_minutes: duration_minutes || 5,
      artist,
      image_url,
      video_url,
      audio_url,
      instructions,
      prompts,
      metadata: metadata || {}
    };
    
    // Add author to metadata if it's a prayer type
    if (type === 'prayer' && req.body.author) {
      contentData.metadata = { ...contentData.metadata, author: req.body.author };
    }
    
    const newContent = await Content.create(contentData);
    
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
    const { 
      type, title, content, biblePassage, youtubeId, theme, season, tags, isActive,
      duration_minutes, artist, image_url, video_url, audio_url, instructions, prompts, metadata
    } = req.body;
    
    const existingContent = await Content.findByPk(id);
    if (!existingContent) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const updateData = {
      type,
      title,
      content,
      biblePassage,
      youtubeId,
      theme,
      season,
      tags,
      isActive,
      duration_minutes: duration_minutes || existingContent.duration_minutes,
      artist,
      image_url,
      video_url,
      audio_url,
      instructions,
      prompts,
      metadata: metadata || existingContent.metadata
    };
    
    // Add author to metadata if it's a prayer type
    if (type === 'prayer' && req.body.author) {
      updateData.metadata = { ...updateData.metadata, author: req.body.author };
    }
    
    await existingContent.update(updateData);
    
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
    
    // Convert empty strings to null for date/time fields
    const dateTimeFields = ['startDate', 'endDate', 'startTime', 'endTime', 'registrationDeadline', 'recurrenceEnd'];
    dateTimeFields.forEach(field => {
      if (eventData[field] === '') {
        eventData[field] = null;
      }
    });
    
    // Convert empty string to null for link field
    if (eventData.link === '') {
      eventData.link = null;
    }
    
    // If endDate is not provided, use startDate (for single-day events)
    if (!eventData.endDate && eventData.startDate) {
      eventData.endDate = eventData.startDate;
    }
    
    // Handle recurring field duplicates (use the form field names)
    if (eventData.hasOwnProperty('isRecurring')) {
      eventData.recurring = eventData.isRecurring;
    }
    if (eventData.hasOwnProperty('recurrencePattern')) {
      eventData.recurringPattern = eventData.recurrencePattern;
    }
    if (eventData.hasOwnProperty('recurrenceEnd')) {
      eventData.recurringEndDate = eventData.recurrenceEnd === '' ? null : eventData.recurrenceEnd;
    }
    if (eventData.hasOwnProperty('requireRegistration')) {
      eventData.registrationRequired = eventData.requireRegistration;
    }
    
    // Add createdBy field
    eventData.createdBy = req.session.user.id;
    
    const newEvent = await Event.create(eventData);
    res.json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    // Send more detailed error message
    const errorMessage = error.errors && error.errors.length > 0 
      ? error.errors[0].message 
      : error.message || 'Failed to create event';
    res.status(500).json({ error: errorMessage });
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
    
    // Convert empty strings to null for date/time fields
    const dateTimeFields = ['startDate', 'endDate', 'startTime', 'endTime', 'registrationDeadline', 'recurrenceEnd'];
    dateTimeFields.forEach(field => {
      if (eventData[field] === '') {
        eventData[field] = null;
      }
    });
    
    // Convert empty string to null for link field
    if (eventData.link === '') {
      eventData.link = null;
    }
    
    // If endDate is not provided, use startDate (for single-day events)
    if (!eventData.endDate && eventData.startDate) {
      eventData.endDate = eventData.startDate;
    }
    
    // Handle recurring field duplicates (use the form field names)
    if (eventData.hasOwnProperty('isRecurring')) {
      eventData.recurring = eventData.isRecurring;
    }
    if (eventData.hasOwnProperty('recurrencePattern')) {
      eventData.recurringPattern = eventData.recurrencePattern;
    }
    if (eventData.hasOwnProperty('recurrenceEnd')) {
      eventData.recurringEndDate = eventData.recurrenceEnd === '' ? null : eventData.recurrenceEnd;
    }
    if (eventData.hasOwnProperty('requireRegistration')) {
      eventData.registrationRequired = eventData.requireRegistration;
    }
    
    await event.update(eventData);
    res.json({ success: true, event });
  } catch (error) {
    console.error('Error updating event:', error);
    // Send more detailed error message
    const errorMessage = error.errors && error.errors.length > 0 
      ? error.errors[0].message 
      : error.message || 'Failed to update event';
    res.status(500).json({ error: errorMessage });
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

// ============= ENHANCED USER API ENDPOINTS =============

// Create new user
router.post('/api/users', requireAdmin, async (req, res) => {
  try {
    const { email, firstName, lastName, personalEmail, isActive, isAdmin, sendWelcome } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    const newUser = await User.create({
      email,
      firstName,
      lastName,
      personalEmail,
      isActive,
      isAdmin,
      currentStreak: 0,
      longestStreak: 0
    });
    
    // Log activity
    // await UserActivity.create({
    //   userId: newUser.id,
    //   action: 'USER_CREATED',
    //   details: `Created by admin ${req.session.user.email}`
    // });
    
    // Send welcome email if requested
    if (sendWelcome && process.env.SMTP_USER) {
      const EmailService = require('../services/emailService');
      await EmailService.sendWelcomeEmail(newUser);
    }
    
    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get user activity logs
router.get('/api/users/:id/activity', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const logs = []; // await UserActivity.findAll({
    //   where: { userId: id },
    //   order: [['createdAt', 'DESC']],
    //   limit: 50
    // });
    
    // Get total logins
    const totalLogins = 0; // await UserActivity.count({
    //   where: { 
    //     userId: id,
    //     action: 'LOGIN'
    //   }
    // });
    
    res.json({ logs, totalLogins });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Bulk activate users
router.post('/api/users/bulk-activate', requireAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    await User.update(
      { isActive: true },
      { where: { id: userIds } }
    );
    
    // Log activity for each user
    const activities = userIds.map(userId => ({
      userId,
      action: 'ACTIVATED',
      details: `Bulk activated by admin ${req.session.user.email}`
    }));
    // await UserActivity.bulkCreate(activities);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error activating users:', error);
    res.status(500).json({ error: 'Failed to activate users' });
  }
});

// Bulk deactivate users
router.post('/api/users/bulk-deactivate', requireAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    await User.update(
      { isActive: false },
      { where: { id: userIds } }
    );
    
    // Log activity for each user
    const activities = userIds.map(userId => ({
      userId,
      action: 'DEACTIVATED',
      details: `Bulk deactivated by admin ${req.session.user.email}`
    }));
    // await UserActivity.bulkCreate(activities);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deactivating users:', error);
    res.status(500).json({ error: 'Failed to deactivate users' });
  }
});

// Bulk delete users
router.post('/api/users/bulk-delete', requireAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    // Don't allow deleting the current admin
    const filteredIds = userIds.filter(id => id !== req.session.user.id);
    
    await User.destroy({
      where: { id: filteredIds }
    });
    
    res.json({ success: true, deleted: filteredIds.length });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ error: 'Failed to delete users' });
  }
});

// Send email to users
router.post('/api/users/email', requireAdmin, async (req, res) => {
  try {
    const { recipients, subject, message, includePersonalEmail } = req.body;
    
    if (!process.env.SMTP_USER) {
      return res.status(400).json({ error: 'Email service not configured' });
    }
    
    const users = await User.findAll({
      where: { id: recipients }
    });
    
    const EmailService = require('../services/emailService');
    let sent = 0;
    
    for (const user of users) {
      try {
        // Send to church email
        await EmailService.sendEmail(user.email, subject, message);
        sent++;
        
        // Send to personal email if requested and available
        if (includePersonalEmail && user.personalEmail) {
          await EmailService.sendEmail(user.personalEmail, subject, message);
        }
      } catch (error) {
        console.error(`Failed to email ${user.email}:`, error);
      }
    }
    
    res.json({ success: true, sent });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

// Import users from CSV
router.post('/api/users/import', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const sendWelcome = req.body.sendWelcome === 'true';
    const results = [];
    
    // Parse CSV
    const parser = csv.parse({
      columns: true,
      skip_empty_lines: true
    });
    
    parser.on('readable', async function() {
      let record;
      while (record = parser.read()) {
        try {
          const userData = {
            firstName: record.firstName,
            lastName: record.lastName,
            email: record.email,
            personalEmail: record.personalEmail || null,
            isAdmin: record.isAdmin === 'true' || record.isAdmin === '1',
            isActive: record.isActive !== 'false' && record.isActive !== '0',
            currentStreak: 0,
            longestStreak: 0
          };
          
          // Check if user exists
          const existing = await User.findOne({ where: { email: userData.email } });
          if (!existing) {
            const user = await User.create(userData);
            results.push({ success: true, email: userData.email });
            
            // Send welcome email if requested
            if (sendWelcome && process.env.SMTP_USER) {
              const EmailService = require('../services/emailService');
              await EmailService.sendWelcomeEmail(user);
            }
          } else {
            results.push({ success: false, email: userData.email, error: 'Already exists' });
          }
        } catch (error) {
          results.push({ success: false, email: record.email, error: error.message });
        }
      }
    });
    
    parser.on('end', () => {
      const imported = results.filter(r => r.success).length;
      res.json({ success: true, imported, total: results.length, results });
    });
    
    parser.write(req.file.buffer);
    parser.end();
    
  } catch (error) {
    console.error('Error importing users:', error);
    res.status(500).json({ error: 'Failed to import users' });
  }
});

// Journey management
router.get('/journeys', requireAdmin, async (req, res) => {
  try {
    const { Journey } = require('../models');
    const journeys = await Journey.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.render('pages/admin/journeys', {
      title: 'Journey Management',
      user: req.session.user,
      journeys
    });
  } catch (error) {
    console.error('Error rendering journey management:', error);
    res.status(500).send('Internal server error');
  }
});

// Journey editor interface - edit existing journey
router.get('/journeys/edit/:id', requireAdmin, async (req, res) => {
  try {
    const { Journey, JourneyDay, JourneyContent } = require('../models');
    
    console.log('Journey edit route hit for ID:', req.params.id);
    
    const journey = await Journey.findByPk(req.params.id);
    if (!journey) {
      console.error('Journey not found:', req.params.id);
      return res.status(404).send('Journey not found');
    }
    
    const journeyDays = await JourneyDay.findAll({
      where: { journey_id: journey.id },
      include: [{
        model: JourneyContent,
        as: 'content',
        order: [['order_index', 'ASC']]
      }],
      order: [['day_number', 'ASC']]
    });
    
    console.log('Rendering journey-editor for:', journey.title);
    console.log('Journey days count:', journeyDays.length);
    
    // Force no-cache headers to prevent 304 responses
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.render('pages/admin/journey-editor', {
      title: `Edit Journey: ${journey.title}`,
      user: req.session.user,
      journey,
      journeyDays
    });
  } catch (error) {
    console.error('Error rendering journey editor:', error);
    res.status(500).send('Internal server error');
  }
});

// Journey preview interface
router.get('/journeys/preview/:id', requireAdmin, async (req, res) => {
  try {
    const { Journey, JourneyDay, JourneyContent } = require('../models');
    
    const journey = await Journey.findByPk(req.params.id);
    if (!journey) {
      return res.status(404).send('Journey not found');
    }
    
    const journeyDays = await JourneyDay.findAll({
      where: { journey_id: journey.id },
      include: [{
        model: JourneyContent,
        as: 'content',
        order: [['order_index', 'ASC']]
      }],
      order: [['day_number', 'ASC']]
    });
    
    res.render('pages/admin/journey-preview', {
      title: `Preview: ${journey.title}`,
      user: req.session.user,
      journey,
      journeyDays
    });
  } catch (error) {
    console.error('Error rendering journey preview:', error);
    res.status(500).send('Internal server error');
  }
});

// Create/update journey
router.post('/api/journeys', requireAdmin, async (req, res) => {
  try {
    const { Journey } = require('../models');
    const { id, title, description, duration_days, theme, is_published } = req.body;
    
    let journey;
    if (id) {
      journey = await Journey.findByPk(id);
      await journey.update({ title, description, duration_days, theme, is_published });
    } else {
      journey = await Journey.create({
        title,
        description,
        duration_days: duration_days || 3,
        theme: theme || 'general',
        is_published: is_published || false,
        created_by: req.session.user.id
      });
      
      // Create 3 default days for new journey
      const { JourneyDay } = require('../models');
      const defaultDays = [
        { day_number: 1, title: 'Beginning Your Journey', description: 'Welcome to your spiritual journey. Today we start with reflection and preparation.' },
        { day_number: 2, title: 'Going Deeper', description: 'Building on yesterday, we explore deeper truths and practices.' },
        { day_number: 3, title: 'Moving Forward', description: 'Applying what we\'ve learned and looking ahead to continued growth.' }
      ];
      
      for (const day of defaultDays) {
        await JourneyDay.create({
          journey_id: journey.id,
          ...day
        });
      }
    }
    
    res.json({ success: true, journey });
  } catch (error) {
    console.error('Error saving journey:', error);
    res.status(500).json({ error: 'Failed to save journey' });
  }
});

// Add/update journey day
router.post('/api/journeys/:journeyId/days', requireAdmin, async (req, res) => {
  try {
    const { JourneyDay, JourneyContent } = require('../models');
    const { journeyId } = req.params;
    const { dayId, dayNumber, title, description, contents } = req.body;
    
    let journeyDay;
    
    if (dayId) {
      // Update existing day by ID
      journeyDay = await JourneyDay.findByPk(dayId);
      if (journeyDay) {
        await journeyDay.update({ title, description });
      }
    } else {
      // Create or update journey day by number
      journeyDay = await JourneyDay.findOne({
        where: { journey_id: journeyId, day_number: dayNumber }
      });
      
      if (journeyDay) {
        await journeyDay.update({ title, description });
      } else {
        journeyDay = await JourneyDay.create({
          journey_id: journeyId,
          day_number: dayNumber,
          title,
          description
        });
      }
    }
    
    // Handle contents if provided
    if (contents && Array.isArray(contents)) {
      // Remove existing contents
      await JourneyContent.destroy({
        where: { journey_day_id: journeyDay.id }
      });
      
      // Add new contents
      for (let i = 0; i < contents.length; i++) {
        const content = contents[i];
        
        // Handle different content storage formats
        const customTypes = ['reflection', 'scripture_reading', 'artwork', 'video', 'journaling_prompt', 'guided_prayer', 'historical_context', 'interactive_map'];
        
        if (customTypes.includes(content.type) && (content.id === 'custom' || content.id.startsWith('custom_'))) {
          // Store custom content with full metadata
          await JourneyContent.create({
            journey_day_id: journeyDay.id,
            content_type: content.type,
            content_id: content.id.startsWith('custom_') ? content.id : `${content.type}_${Date.now()}_${i}`,
            order_index: i,
            duration_minutes: content.duration_minutes || 5,
            metadata: {
              title: content.title,
              content: content.content,
              ...content.metadata
            }
          });
        } else {
          // Standard content types (bible verses, existing prayers, hymns, creeds)
          await JourneyContent.create({
            journey_day_id: journeyDay.id,
            content_type: content.type || content.content_type,
            content_id: content.id,
            order_index: i,
            duration_minutes: content.duration_minutes || content.duration || 5,
            metadata: {
              title: content.title,
              preview: content.preview
            }
          });
        }
      }
    }
    
    res.json({ success: true, journeyDay });
  } catch (error) {
    console.error('Error saving journey day:', error);
    res.status(500).json({ error: 'Failed to save journey day' });
  }
});

// Delete journey day
router.delete('/api/journeys/:journeyId/days/:dayId', requireAdmin, async (req, res) => {
  try {
    const { JourneyDay } = require('../models');
    const { journeyId, dayId } = req.params;
    
    const day = await JourneyDay.findOne({
      where: { id: dayId, journey_id: journeyId }
    });
    
    if (!day) {
      return res.status(404).json({ error: 'Day not found' });
    }
    
    await day.destroy();
    
    // Renumber remaining days
    const remainingDays = await JourneyDay.findAll({
      where: { journey_id: journeyId },
      order: [['day_number', 'ASC']]
    });
    
    for (let i = 0; i < remainingDays.length; i++) {
      if (remainingDays[i].day_number !== i + 1) {
        await remainingDays[i].update({ day_number: i + 1 });
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting journey day:', error);
    res.status(500).json({ error: 'Failed to delete day' });
  }
});

// Bible API endpoints
router.get('/api/bible/books', requireAdmin, async (req, res) => {
  try {
    const { BibleBook } = require('../models');
    const books = await BibleBook.findAll({
      order: [['id', 'ASC']]
    });
    res.json(books);
  } catch (error) {
    console.error('Error fetching Bible books:', error);
    res.status(500).json({ error: 'Failed to fetch Bible books' });
  }
});

router.get('/api/bible/chapters/:bookId', requireAdmin, async (req, res) => {
  try {
    const { BibleBook, BibleVerse } = require('../models');
    const book = await BibleBook.findByPk(req.params.bookId);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Get the max chapter number for this book
    const maxChapter = await BibleVerse.max('chapter', {
      where: { book_id: req.params.bookId }
    });
    
    res.json({ 
      bookName: book.name,
      chapterCount: maxChapter || 0 
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

router.get('/api/bible/verses/:bookId/:chapter', requireAdmin, async (req, res) => {
  try {
    const { BibleBook, BibleVerse } = require('../models');
    const { bookId, chapter } = req.params;
    const { verses: verseRange } = req.query;
    
    const book = await BibleBook.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    let whereClause = {
      book_id: bookId,
      chapter: parseInt(chapter)
    };
    
    // Handle verse range (e.g., "1-5" or "3")
    if (verseRange) {
      if (verseRange.includes('-')) {
        const [start, end] = verseRange.split('-').map(v => parseInt(v));
        whereClause.verse = {
          [require('sequelize').Op.between]: [start, end]
        };
      } else {
        whereClause.verse = parseInt(verseRange);
      }
    }
    
    const verses = await BibleVerse.findAll({
      where: whereClause,
      order: [['verse', 'ASC']]
    });
    
    res.json({
      bookName: book.name,
      chapter: parseInt(chapter),
      verses: verses.map(v => ({
        verse: v.verse,
        text: v.text
      }))
    });
  } catch (error) {
    console.error('Error fetching verses:', error);
    res.status(500).json({ error: 'Failed to fetch verses' });
  }
});

// Unified content search API - searches all content types
router.get('/api/content/unified/search', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { Op } = require('sequelize');
    const { mapLegacyType } = require('../utils/contentTypeMapping');
    const { type, q } = req.query;
    
    const where = {
      isActive: true
    };
    
    if (type) {
      // Map legacy types to new types
      const mappedType = mapLegacyType(type);
      where.type = mappedType;
    }
    
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { content: { [Op.iLike]: `%${q}%` } },
        { metadata: { [Op.contains]: { author: q } } },
        { tags: { [Op.contains]: [q.toLowerCase()] } }
      ];
    }
    
    const content = await Content.findAll({
      where,
      order: [
        ['createdAt', 'DESC'],  // Newest first
        ['title', 'ASC']
      ],
      limit: 100  // Increased limit for journey building
    });
    
    res.json(content);
  } catch (error) {
    console.error('Error searching unified content:', error);
    res.status(500).json({ error: 'Failed to search content' });
  }
});

// Get content by type
router.get('/api/content/type/:type', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { type } = req.params;
    
    const content = await Content.findAll({
      where: {
        type,
        isActive: true
      },
      order: [['title', 'ASC']]
    });
    
    res.json(content);
  } catch (error) {
    console.error('Error fetching content by type:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Content search API (legacy - for backward compatibility)
router.get('/api/content/search', requireAdmin, async (req, res) => {
  try {
    const { Prayer, Content } = require('../models');
    const { type, q } = req.query;
    
    let items = [];
    
    if (type === 'prayer') {
      // Search actual prayers from database
      const prayers = await Prayer.searchPrayers(q);
      items = prayers.map(prayer => ({
        id: prayer.id,
        title: prayer.title,
        content: prayer.content,
        author: prayer.author,
        category: prayer.category,
        preview: prayer.content.substring(0, 150) + '...'
      }));
    } else if (type === 'hymn') {
      // TODO: Create Hymn model
      items = [
        { id: 'amazing-grace', title: "Amazing Grace", content: "Amazing grace, how sweet the sound..." },
        { id: 'holy-holy', title: "Holy, Holy, Holy", content: "Holy, holy, holy! Lord God Almighty..." },
        { id: 'blessed-assurance', title: "Blessed Assurance", content: "Blessed assurance, Jesus is mine..." }
      ];
      
      // Filter by search query if provided
      if (q) {
        items = items.filter(item => 
          item.title.toLowerCase().includes(q.toLowerCase()) ||
          item.content.toLowerCase().includes(q.toLowerCase())
        );
      }
    }
    
    res.json(items);
  } catch (error) {
    console.error('Error searching content:', error);
    res.status(500).json({ error: 'Failed to search content' });
  }
});

// Prayer CRUD endpoints
router.get('/api/prayers', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { Op } = require('sequelize');
    const { category, search } = req.query;
    
    let where = { type: 'prayer' };
    
    if (category) {
      where['metadata.category'] = category;
    }
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { 'metadata.author': { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const prayers = await Content.findAll({
      where,
      order: [['title', 'ASC']]
    });
    
    // Transform to expected format
    const formattedPrayers = prayers.map(prayer => ({
      id: prayer.id,
      title: prayer.title,
      content: prayer.content,
      category: prayer.metadata?.category || 'other',
      author: prayer.metadata?.author || '',
      audio_url: prayer.audio_url || '',
      tags: prayer.tags || [],
      is_active: prayer.isActive,
      usage_count: prayer.metadata?.usage_count || 0,
      lastUsedDate: prayer.metadata?.lastUsedDate || null
    }));
    
    res.json(formattedPrayers);
  } catch (error) {
    console.error('Error fetching prayers:', error);
    res.status(500).json({ error: 'Failed to fetch prayers' });
  }
});

router.post('/api/prayers', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { title, content, author, category, audio_url, tags, is_active } = req.body;
    
    const prayer = await Content.create({
      type: 'prayer',
      title,
      content,
      audio_url,
      tags: tags || [],
      isActive: is_active !== false,
      metadata: {
        category: category || 'other',
        author: author || '',
        usage_count: 0
      }
    });
    
    res.json({ success: true, prayer: {
      id: prayer.id,
      title: prayer.title,
      content: prayer.content,
      category: prayer.metadata.category,
      author: prayer.metadata.author,
      audio_url: prayer.audio_url,
      tags: prayer.tags,
      is_active: prayer.isActive
    }});
  } catch (error) {
    console.error('Error creating prayer:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'A prayer with this title already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create prayer' });
    }
  }
});

router.put('/api/prayers/:id', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { title, content, author, category, audio_url, tags, is_active } = req.body;
    
    const prayer = await Content.findOne({
      where: { 
        id: req.params.id,
        type: 'prayer'
      }
    });
    
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }
    
    // Update metadata
    const updatedMetadata = {
      ...prayer.metadata,
      category: category || prayer.metadata?.category || 'other',
      author: author !== undefined ? author : prayer.metadata?.author || ''
    };
    
    await prayer.update({
      title,
      content,
      audio_url,
      tags: tags || [],
      isActive: is_active !== undefined ? is_active : prayer.isActive,
      metadata: updatedMetadata
    });
    
    res.json({ success: true, prayer: {
      id: prayer.id,
      title: prayer.title,
      content: prayer.content,
      category: updatedMetadata.category,
      author: updatedMetadata.author,
      audio_url: prayer.audio_url,
      tags: prayer.tags,
      is_active: prayer.isActive
    }});
  } catch (error) {
    console.error('Error updating prayer:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'A prayer with this title already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update prayer' });
    }
  }
});

router.delete('/api/prayers/:id', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    
    const prayer = await Content.findOne({
      where: { 
        id: req.params.id,
        type: 'prayer'
      }
    });
    
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }
    
    // Soft delete by setting isActive to false
    await prayer.update({ isActive: false });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prayer:', error);
    res.status(500).json({ error: 'Failed to delete prayer' });
  }
});

// Delete journey
router.delete('/api/journeys/:id', requireAdmin, async (req, res) => {
  try {
    const { Journey } = require('../models');
    const journey = await Journey.findByPk(req.params.id);
    
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    
    await journey.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting journey:', error);
    res.status(500).json({ error: 'Failed to delete journey' });
  }
});

// Prayers management
router.get('/prayers', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const prayers = await Content.findAll({
      where: { type: 'prayer' },
      order: [['title', 'ASC']]
    });
    
    // Transform prayers to match expected format
    const formattedPrayers = prayers.map(prayer => ({
      id: prayer.id,
      title: prayer.title,
      content: prayer.content,
      category: prayer.metadata?.category || 'other',
      author: prayer.metadata?.author || '',
      audio_url: prayer.audio_url || '',
      tags: prayer.tags || [],
      is_active: prayer.isActive,
      usage_count: prayer.metadata?.usage_count || 0,
      lastUsedDate: prayer.metadata?.lastUsedDate || null,
      createdAt: prayer.createdAt,
      updatedAt: prayer.updatedAt
    }));
    
    res.render('pages/admin/prayers', {
      title: 'Prayer Management',
      user: req.session.user,
      prayers: formattedPrayers
    });
  } catch (error) {
    console.error('Error rendering prayer management:', error);
    res.status(500).send('Internal server error');
  }
});


// Daily Content Scheduler
router.get('/daily-scheduler', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const currentMonth = req.query.month || new Date().getMonth() + 1;
    const currentYear = req.query.year || new Date().getFullYear();
    
    // Get scheduled content for the current month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    
    const scheduledContent = await DailyContent.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: Content,
        as: 'content'
      }],
      order: [['date', 'ASC'], ['contentType', 'ASC']]
    });
    
    // Group content by date
    const contentByDate = {};
    scheduledContent.forEach(item => {
      const dateStr = item.date;
      if (!contentByDate[dateStr]) {
        contentByDate[dateStr] = [];
      }
      contentByDate[dateStr].push(item);
    });
    
    res.render('pages/admin/daily-scheduler', {
      title: 'Daily Content Scheduler',
      user: req.session.user,
      currentMonth,
      currentYear,
      contentByDate,
      contentTypes: contentTypes
    });
  } catch (error) {
    console.error('Error rendering daily scheduler:', error);
    res.status(500).send('Internal server error');
  }
});

// Content Type Management Routes
const { contentTypes, getContentTypeBySlug } = require('../config/contentTypes');

// Generic content type route handler
const contentTypeRoutes = ['scripture-readings', 'hymns', 'journaling-prompts', 'guided-prayers', 'reflections', 'artwork', 'videos', 'creeds', 'historical-contexts', 'interactive-maps'];

contentTypeRoutes.forEach(urlSlug => {
  router.get(`/${urlSlug}`, requireAdmin, async (req, res) => {
    try {
      const contentType = getContentTypeBySlug(urlSlug);
      if (!contentType) {
        return res.status(404).send('Content type not found');
      }

      const { Content } = require('../models');
      const items = await Content.findAll({
        where: { type: contentType.dbType },
        order: [['title', 'ASC']]
      });
      
      // Transform items to match expected format
      const formattedItems = items.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.metadata?.category || contentType.categories[contentType.categories.length - 1].toLowerCase(),
        author: item.metadata?.author || '',
        artist: item.artist || '', // Separate artist field for hymns/artwork
        theme: item.theme,
        season: item.season,
        tags: item.tags || [],
        is_active: item.isActive,
        usage_count: item.metadata?.usage_count || item.usageCount || 0,
        lastUsedDate: item.lastUsedDate,
        createdAt: item.createdAt,
        // Type-specific fields
        biblePassage: item.biblePassage,
        youtubeId: item.youtubeId,
        audio_url: item.audio_url,
        video_url: item.video_url,
        image_url: item.image_url,
        duration_minutes: item.duration_minutes,
        instructions: item.instructions,
        prompts: item.prompts,
        // Additional metadata
        metadata: item.metadata || {}
      }));
      
      res.render(`pages/admin/content-type`, {
        title: `${contentType.pluralName} Management`,
        user: req.session.user,
        items: formattedItems,
        contentType: contentType
      });
    } catch (error) {
      console.error(`Error rendering ${urlSlug} management:`, error);
      res.status(500).send('Internal server error');
    }
  });
});

// Import journey
router.post('/api/journeys/import', requireAdmin, async (req, res) => {
  const { Journey, JourneyDay, JourneyContent, Content } = require('../models');
  const { journey, days, createNewContent } = req.body;
  
  const transaction = await sequelize.transaction();
  
  try {
    // Validate input
    if (!journey || !journey.title) {
      throw new Error('Journey title is required');
    }
    
    if (!days || !Array.isArray(days) || days.length === 0) {
      throw new Error('At least one day is required');
    }
    
    // Create the journey
    const newJourney = await Journey.create({
      title: journey.title,
      description: journey.description || '',
      duration_days: journey.duration_days || days.length,
      theme: journey.theme || 'general',
      is_published: journey.is_published || false,
      created_by: req.session.user.id
    }, { transaction });
    
    // Process each day
    for (const day of days) {
      // Validate day
      if (!day.day_number) {
        throw new Error('Day number is required for each day');
      }
      
      // Create journey day
      const journeyDay = await JourneyDay.create({
        journey_id: newJourney.id,
        day_number: day.day_number,
        title: day.title || `Day ${day.day_number}`,
        description: day.description || ''
      }, { transaction });
      
      // Process content for this day
      if (day.content && Array.isArray(day.content)) {
        for (const contentItem of day.content) {
          let contentId;
          
          if (createNewContent) {
            // Create new content item
            const contentData = {
              type: contentItem.type,
              title: contentItem.title,
              content: contentItem.content || '',
              biblePassage: contentItem.biblePassage,
              youtubeId: contentItem.youtubeId,
              artist: contentItem.artist,
              image_url: contentItem.image_url,
              video_url: contentItem.video_url,
              audio_url: contentItem.audio_url,
              instructions: contentItem.instructions,
              prompts: contentItem.prompts,
              theme: contentItem.theme || journey.theme,
              tags: contentItem.tags || [],
              duration_minutes: contentItem.duration_minutes || 5,
              metadata: contentItem.metadata || {},
              isActive: true
            };
            
            const newContent = await Content.create(contentData, { transaction });
            contentId = newContent.id;
          } else {
            // Try to find existing content by title
            const existingContent = await Content.findOne({
              where: { 
                title: contentItem.title,
                type: contentItem.type
              },
              transaction
            });
            
            if (existingContent) {
              contentId = existingContent.id;
            } else {
              // Create new if not found
              const newContent = await Content.create({
                type: contentItem.type,
                title: contentItem.title,
                content: contentItem.content || '',
                duration_minutes: contentItem.duration_minutes || 5,
                metadata: contentItem.metadata || {},
                isActive: true
              }, { transaction });
              contentId = newContent.id;
            }
          }
          
          // Create journey content link
          await JourneyContent.create({
            journey_day_id: journeyDay.id,
            content_type: contentItem.type,
            content_id: contentId,
            order_index: contentItem.order_index || 0,
            duration_minutes: contentItem.duration_minutes || 5,
            metadata: contentItem.journey_metadata || {}
          }, { transaction });
        }
      }
    }
    
    await transaction.commit();
    
    res.json({ 
      success: true, 
      journeyId: newJourney.id,
      message: `Journey "${newJourney.title}" imported successfully with ${days.length} days`
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error importing journey:', error);
    res.status(400).json({ error: error.message || 'Failed to import journey' });
  }
});

// Log user activity (helper function)
async function logActivity(userId, action, details = null, req = null) {
  try {
    // await UserActivity.create({
    //   userId,
    //   action,
    //   details,
    //   ipAddress: req ? req.ip : null,
    //   userAgent: req ? req.headers['user-agent'] : null
    // });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// ============= CONTENT TYPE API ENDPOINTS =============

// Generic content API endpoints
router.get('/api/content/:type', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { type } = req.params;
    
    const items = await Content.findAll({
      where: { type },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Create content item
router.post('/api/content/:type', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { type } = req.params;
    const itemData = req.body;
    
    // Transform client data to match Content model
    const contentData = {
      type: type,
      title: itemData.title,
      content: itemData.content,
      isActive: itemData.is_active !== undefined ? itemData.is_active : true,
      metadata: itemData.metadata || {},
      tags: Array.isArray(itemData.tags) ? itemData.tags : 
            (itemData.tags ? itemData.tags.split(',').map(t => t.trim()).filter(t => t) : []),
      // Type-specific fields
      biblePassage: itemData.biblePassage,
      youtubeId: itemData.youtubeId,
      theme: itemData.theme,
      season: itemData.season,
      artist: itemData.artist,
      image_url: itemData.image_url,
      video_url: itemData.video_url,
      audio_url: itemData.audio_url,
      duration_minutes: itemData.duration_minutes ? parseInt(itemData.duration_minutes) : null,
      instructions: itemData.instructions,
      prompts: itemData.prompts
    };
    
    // Store category in metadata if provided
    if (itemData.metadata?.category) {
      contentData.metadata.category = itemData.metadata.category;
    }
    
    // Remove undefined and null fields for optional fields
    Object.keys(contentData).forEach(key => {
      if (contentData[key] === undefined || (contentData[key] === null && key !== 'type' && key !== 'title')) {
        delete contentData[key];
      }
    });
    
    // Log the final data being saved
    console.log('Creating content with data:', JSON.stringify(contentData, null, 2));
    
    const newItem = await Content.create(contentData);
    
    // Transform response to match client expectations
    const response = {
      id: newItem.id,
      title: newItem.title,
      content: newItem.content,
      category: newItem.metadata?.category || 'other',
      is_active: newItem.isActive,
      usage_count: newItem.usageCount || 0,
      ...newItem.toJSON()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error creating content:', error);
    console.error('Request body:', req.body);
    console.error('Transformed data:', contentData);
    
    // Check for validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.message,
        validationErrors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create content', 
      details: error.message,
      type: error.name 
    });
  }
});

// Update content item
router.put('/api/content/:type/:id', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { type, id } = req.params;
    const itemData = req.body;
    
    const item = await Content.findOne({
      where: { id, type }
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Transform client data to match Content model
    const updateData = {
      title: itemData.title,
      content: itemData.content,
      isActive: itemData.is_active !== undefined ? itemData.is_active : item.isActive,
      metadata: { ...item.metadata, ...itemData.metadata },
      tags: itemData.tags !== undefined ? 
            (Array.isArray(itemData.tags) ? itemData.tags : 
             itemData.tags ? itemData.tags.split(',').map(t => t.trim()).filter(t => t) : []) 
            : item.tags,
      // Type-specific fields
      biblePassage: itemData.biblePassage,
      youtubeId: itemData.youtubeId,
      theme: itemData.theme,
      season: itemData.season,
      artist: itemData.artist,
      image_url: itemData.image_url,
      video_url: itemData.video_url,
      audio_url: itemData.audio_url,
      duration_minutes: itemData.duration_minutes ? parseInt(itemData.duration_minutes) : item.duration_minutes,
      instructions: itemData.instructions,
      prompts: itemData.prompts
    };
    
    // Store category in metadata if provided
    if (itemData.metadata?.category) {
      updateData.metadata.category = itemData.metadata.category;
    }
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    await item.update(updateData);
    
    // Transform response to match client expectations
    const response = {
      id: item.id,
      title: item.title,
      content: item.content,
      category: item.metadata?.category || 'other',
      is_active: item.isActive,
      usage_count: item.usageCount || 0,
      ...item.toJSON()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content', details: error.message });
  }
});

// Toggle content active status
router.patch('/api/content/:type/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { type, id } = req.params;
    const { is_active } = req.body;
    
    const item = await Content.findOne({
      where: { id, type }
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    await item.update({ isActive: is_active });
    res.json({ id: item.id, is_active: item.isActive });
  } catch (error) {
    console.error('Error toggling content status:', error);
    res.status(500).json({ error: 'Failed to toggle status' });
  }
});

// Delete content item
router.delete('/api/content/:type/:id', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { type, id } = req.params;
    
    const result = await Content.destroy({
      where: { id, type }
    });
    
    if (result === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// Import content items
router.post('/api/content/:type/import', requireAdmin, async (req, res) => {
  try {
    const { Content } = require('../models');
    const { type } = req.params;
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid import data' });
    }
    
    // Transform each item to match database schema
    const transformedItems = items.map(item => {
      const transformed = {
        type: type,
        title: item.title,
        content: item.content,
        isActive: item.is_active !== undefined ? item.is_active : true,
        metadata: item.metadata || {},
        tags: Array.isArray(item.tags) ? item.tags : 
              (item.tags ? item.tags.split(',').map(t => t.trim()).filter(t => t) : []),
        // Standard fields
        biblePassage: item.biblePassage,
        youtubeId: item.youtubeId,
        theme: item.theme,
        season: item.season,
        artist: item.artist,
        image_url: item.image_url,
        video_url: item.video_url,
        audio_url: item.audio_url,
        duration_minutes: item.duration_minutes ? parseInt(item.duration_minutes) : null,
        instructions: item.instructions,
        prompts: item.prompts,
        usageCount: item.usage_count || item.usageCount || 0,
        lastUsedDate: item.lastUsedDate
      };
      
      // Handle category
      if (item.category) {
        transformed.metadata.category = item.category;
      }
      
      // Handle type-specific metadata fields
      if (type === 'hymn') {
        // Map hymn-specific fields to metadata
        if (item.composer) transformed.metadata.composer = item.composer;
        if (item.tune) transformed.metadata.tune = item.tune;
        if (item.meter) transformed.metadata.meter = item.meter;
        if (item.hymnalNumber) transformed.metadata.hymnalNumber = item.hymnalNumber;
        
        // Handle artist field - it could come from author, artist, or composer
        if (!transformed.artist) {
          if (item.author) {
            transformed.artist = item.author;
          } else if (item.composer) {
            transformed.artist = item.composer;
          }
          // If still no artist and we have tags, try to extract composer from tags
          if (!transformed.artist && item.tags && Array.isArray(item.tags)) {
            // Look for common composer names in tags
            const composerTag = item.tags.find(tag => 
              tag && !['Praise & Worship', 'Trinity', 'Traditional', 'Contemporary', 'Gospel', 'Holy, Holy, Holy', 'GTG'].some(exclude => tag.includes(exclude))
            );
            if (composerTag) {
              transformed.artist = composerTag;
            }
          }
        }
      } else if (type === 'prayer') {
        if (item.author) transformed.metadata.author = item.author;
      } else if (type === 'artwork') {
        if (item.medium) transformed.metadata.medium = item.medium;
        if (item.year) transformed.metadata.year = item.year;
        if (item.scripture_reference) transformed.metadata.scripture_reference = item.scripture_reference;
      } else if (type === 'video') {
        if (item.speaker) transformed.metadata.speaker = item.speaker;
        if (item.transcript) transformed.metadata.transcript = item.transcript;
      } else if (type === 'creed') {
        if (item.origin) transformed.metadata.origin = item.origin;
        if (item.usage) transformed.metadata.usage = item.usage;
        if (item.denomination) transformed.metadata.denomination = item.denomination;
      } else if (type === 'reflection') {
        if (item.author) transformed.metadata.author = item.author;
        if (item.scripture_reference) transformed.metadata.scripture_reference = item.scripture_reference;
        if (item.discussion_questions) transformed.metadata.discussion_questions = item.discussion_questions;
      }
      
      // Remove undefined and null fields
      Object.keys(transformed).forEach(key => {
        if (transformed[key] === undefined || (transformed[key] === null && key !== 'type' && key !== 'title')) {
          delete transformed[key];
        }
      });
      
      return transformed;
    });
    
    const created = await Content.bulkCreate(transformedItems);
    
    res.json({ count: created.length });
  } catch (error) {
    console.error('Error importing content:', error);
    res.status(500).json({ error: 'Failed to import content', details: error.message });
  }
});

// Daily Scheduler API Endpoints

// Get scheduled content for a specific month
router.get('/api/admin/daily-schedule/:year/:month', requireAdmin, async (req, res) => {
  try {
    const { year, month } = req.params;
    const { Content } = require('../models');
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const scheduledContent = await DailyContent.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: Content,
        as: 'content'
      }],
      order: [['date', 'ASC'], ['contentType', 'ASC']]
    });
    
    // Group by date
    const contentByDate = {};
    scheduledContent.forEach(item => {
      const dateStr = item.date;
      if (!contentByDate[dateStr]) {
        contentByDate[dateStr] = [];
      }
      contentByDate[dateStr].push(item);
    });
    
    res.json(contentByDate);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Schedule content for a specific date
router.post('/api/admin/daily-schedule', requireAdmin, async (req, res) => {
  try {
    const { date, items } = req.body;
    const { Content } = require('../models');
    
    if (!date || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    const createdItems = [];
    
    for (const item of items) {
      // Check if content already scheduled for this date and type
      const existing = await DailyContent.findOne({
        where: {
          date,
          contentType: item.contentType
        }
      });
      
      let dailyContent;
      
      if (existing) {
        // Update existing record
        existing.contentId = item.contentId;
        await existing.save();
        dailyContent = existing;
      } else {
        // Create new record
        dailyContent = await DailyContent.create({
          date,
          contentId: item.contentId,
          contentType: item.contentType
        });
      }
      
      // Fetch the full content
      const fullItem = await DailyContent.findByPk(dailyContent.id, {
        include: [{
          model: Content,
          as: 'content'
        }]
      });
      
      createdItems.push(fullItem);
    }
    
    res.json(createdItems);
  } catch (error) {
    console.error('Error scheduling content:', error);
    res.status(500).json({ error: 'Failed to schedule content' });
  }
});

// Remove scheduled content
router.delete('/api/admin/daily-schedule/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await DailyContent.destroy({
      where: { id }
    });
    
    if (result === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing scheduled content:', error);
    res.status(500).json({ error: 'Failed to remove content' });
  }
});

// Generate content for date range
router.post('/api/admin/daily-schedule/generate', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, overwrite, avoidRepeats } = req.body;
    const { Content } = require('../models');
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Date range required' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    let daysGenerated = 0;
    
    // Get content types to generate
    const contentTypesToGenerate = [
      'scripture_reading',
      'hymn', 
      'prayer',
      'journaling_prompt'
    ];
    
    // Process each day in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Check existing content for this date
      if (!overwrite) {
        const existingCount = await DailyContent.count({
          where: { date: dateStr }
        });
        
        if (existingCount > 0) {
          continue; // Skip this date
        }
      } else {
        // Remove existing content if overwriting
        await DailyContent.destroy({
          where: { date: dateStr }
        });
      }
      
      // Get recently used content if avoiding repeats
      let recentIds = [];
      if (avoidRepeats) {
        const recentDays = 7;
        const recentDate = new Date(date);
        recentDate.setDate(recentDate.getDate() - recentDays);
        
        const recentContent = await DailyContent.findAll({
          where: {
            date: {
              [Op.between]: [recentDate, date]
            }
          },
          attributes: ['contentId']
        });
        
        recentIds = recentContent.map(c => c.contentId);
      }
      
      // Generate content for each type
      for (const contentType of contentTypesToGenerate) {
        const whereClause = {
          type: contentType,
          isActive: true
        };
        
        if (recentIds.length > 0) {
          whereClause.id = {
            [Op.notIn]: recentIds
          };
        }
        
        // Get available content
        const availableContent = await Content.findAll({
          where: whereClause,
          order: [
            ['usageCount', 'ASC'],
            ['lastUsedDate', 'ASC NULLS FIRST']
          ],
          limit: 10
        });
        
        if (availableContent.length > 0) {
          // Select random content from the least used
          const content = availableContent[Math.floor(Math.random() * Math.min(5, availableContent.length))];
          
          await DailyContent.create({
            date: dateStr,
            contentId: content.id,
            contentType: contentType
          });
          
          // Update usage
          content.usageCount = (content.usageCount || 0) + 1;
          content.lastUsedDate = dateStr;
          await content.save();
        }
      }
      
      daysGenerated++;
    }
    
    res.json({ daysGenerated });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Preview content for a specific date
router.get('/api/admin/daily-schedule/preview/:date', requireAdmin, async (req, res) => {
  try {
    const { date } = req.params;
    const { Content } = require('../models');
    
    const scheduledContent = await DailyContent.findAll({
      where: { date },
      include: [{
        model: Content,
        as: 'content'
      }],
      order: [['contentType', 'ASC']]
    });
    
    res.json(scheduledContent);
  } catch (error) {
    console.error('Error fetching preview:', error);
    res.status(500).json({ error: 'Failed to fetch preview' });
  }
});

module.exports = router;
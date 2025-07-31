const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { 
  Journey, 
  JourneyDay, 
  JourneyContent, 
  UserJourney, 
  UserJourneyProgress,
  BibleBook,
  BibleVerse 
} = require('../../models');
const { Op } = require('sequelize');

// Get all journeys (public)
router.get('/', async (req, res) => {
  try {
    const journeys = await Journey.findAll({
      where: { is_active: true },
      order: [['created_at', 'DESC']]
    });
    
    res.json(journeys);
  } catch (error) {
    console.error('Error fetching journeys:', error);
    res.status(500).json({ error: 'Failed to fetch journeys' });
  }
});

// Get journey details with days (public)
router.get('/:journeyId', async (req, res) => {
  try {
    const journey = await Journey.findByPk(req.params.journeyId, {
      include: [{
        model: JourneyDay,
        as: 'days',
        order: [['day_number', 'ASC']]
      }]
    });
    
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    
    res.json(journey);
  } catch (error) {
    console.error('Error fetching journey:', error);
    res.status(500).json({ error: 'Failed to fetch journey' });
  }
});

// Start a journey for the logged-in user
router.post('/:journeyId/start', requireAuth, async (req, res) => {
  try {
    const journey = await Journey.findByPk(req.params.journeyId);
    
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    
    // Deactivate any existing active journey
    await UserJourney.update(
      { is_active: false },
      { 
        where: { 
          user_id: req.session.user.id,
          is_active: true 
        } 
      }
    );
    
    // Create new user journey
    const userJourney = await UserJourney.create({
      user_id: req.session.user.id,
      journey_id: journey.id,
      start_date: new Date(),
      current_day: 1,
      is_active: true
    });
    
    res.json({ 
      success: true, 
      message: 'Journey started successfully',
      userJourney 
    });
  } catch (error) {
    console.error('Error starting journey:', error);
    res.status(500).json({ error: 'Failed to start journey' });
  }
});

// Get user's active journey
router.get('/user/active', requireAuth, async (req, res) => {
  try {
    const userJourney = await UserJourney.findOne({
      where: {
        user_id: req.session.user.id,
        is_active: true
      },
      include: [{
        model: Journey,
        as: 'journey'
      }]
    });
    
    res.json(userJourney);
  } catch (error) {
    console.error('Error fetching user journey:', error);
    res.status(500).json({ error: 'Failed to fetch user journey' });
  }
});

// Mark content as completed
router.post('/content/:contentId/complete', requireAuth, async (req, res) => {
  try {
    const { contentId } = req.params;
    
    // Find the content
    const content = await JourneyContent.findByPk(contentId, {
      include: [{
        model: JourneyDay,
        as: 'day'
      }]
    });
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Find user's active journey
    const userJourney = await UserJourney.findOne({
      where: {
        user_id: req.session.user.id,
        journey_id: content.day.journey_id,
        is_active: true
      }
    });
    
    if (!userJourney) {
      return res.status(400).json({ error: 'No active journey found' });
    }
    
    // Create or update progress
    const [progress, created] = await UserJourneyProgress.findOrCreate({
      where: {
        user_journey_id: userJourney.id,
        journey_content_id: contentId
      },
      defaults: {
        completed_at: new Date()
      }
    });
    
    // Check if all content for the day is completed
    const dayContent = await JourneyContent.findAll({
      where: { journey_day_id: content.journey_day_id }
    });
    
    const completedContent = await UserJourneyProgress.findAll({
      where: {
        user_journey_id: userJourney.id,
        journey_content_id: {
          [Op.in]: dayContent.map(c => c.id)
        }
      }
    });
    
    const allCompleted = dayContent.length === completedContent.length;
    
    res.json({ 
      success: true, 
      created,
      allCompleted,
      message: created ? 'Content marked as completed' : 'Content already completed'
    });
  } catch (error) {
    console.error('Error marking content as completed:', error);
    res.status(500).json({ error: 'Failed to mark content as completed' });
  }
});

// Admin routes
// Create a new journey
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, description, duration_days, is_active = true } = req.body;
    
    if (!title || !duration_days) {
      return res.status(400).json({ error: 'Title and duration are required' });
    }
    
    const journey = await Journey.create({
      title,
      description,
      duration_days,
      is_active,
      created_by: req.session.user.id
    });
    
    res.json({ success: true, journey });
  } catch (error) {
    console.error('Error creating journey:', error);
    res.status(500).json({ error: 'Failed to create journey' });
  }
});

// Update journey
router.put('/:journeyId', requireAdmin, async (req, res) => {
  try {
    const journey = await Journey.findByPk(req.params.journeyId);
    
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    
    await journey.update(req.body);
    res.json({ success: true, journey });
  } catch (error) {
    console.error('Error updating journey:', error);
    res.status(500).json({ error: 'Failed to update journey' });
  }
});

// Create or update journey day
router.post('/:journeyId/days', requireAdmin, async (req, res) => {
  try {
    const { day_number, title, description, theme } = req.body;
    const journey_id = req.params.journeyId;
    
    if (!day_number) {
      return res.status(400).json({ error: 'Day number is required' });
    }
    
    const [day, created] = await JourneyDay.findOrCreate({
      where: { journey_id, day_number },
      defaults: { title, description, theme }
    });
    
    if (!created) {
      await day.update({ title, description, theme });
    }
    
    res.json({ success: true, day, created });
  } catch (error) {
    console.error('Error creating/updating journey day:', error);
    res.status(500).json({ error: 'Failed to create/update journey day' });
  }
});

// Add content to a journey day
router.post('/days/:dayId/content', requireAdmin, async (req, res) => {
  try {
    const { type, reference_id, reference_data, order_index = 0 } = req.body;
    const journey_day_id = req.params.dayId;
    
    if (!type) {
      return res.status(400).json({ error: 'Content type is required' });
    }
    
    const content = await JourneyContent.create({
      journey_day_id,
      type,
      reference_id,
      reference_data,
      order_index
    });
    
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error adding content:', error);
    res.status(500).json({ error: 'Failed to add content' });
  }
});

// Bible search endpoint for admin interface
router.get('/bible/search', requireAdmin, async (req, res) => {
  try {
    const { q, book, chapter } = req.query;
    
    if (!q && !book) {
      return res.status(400).json({ error: 'Search query or book filter required' });
    }
    
    let whereClause = {};
    
    if (book) {
      const bookRecord = await BibleBook.findOne({ 
        where: { 
          [Op.or]: [
            { name: { [Op.iLike]: book } },
            { abbreviation: { [Op.iLike]: book } }
          ]
        } 
      });
      
      if (bookRecord) {
        whereClause.book_id = bookRecord.id;
        
        if (chapter) {
          whereClause.chapter = parseInt(chapter);
        }
      }
    }
    
    if (q) {
      whereClause.text = { [Op.iLike]: `%${q}%` };
    }
    
    const verses = await BibleVerse.findAll({
      where: whereClause,
      include: [{
        model: BibleBook,
        as: 'book'
      }],
      limit: 50,
      order: [['id', 'ASC']]
    });
    
    res.json(verses);
  } catch (error) {
    console.error('Error searching Bible:', error);
    res.status(500).json({ error: 'Failed to search Bible' });
  }
});

// Delete journey (soft delete by setting inactive)
router.delete('/:journeyId', requireAdmin, async (req, res) => {
  try {
    const journey = await Journey.findByPk(req.params.journeyId);
    
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    
    await journey.update({ is_active: false });
    res.json({ success: true, message: 'Journey deactivated' });
  } catch (error) {
    console.error('Error deleting journey:', error);
    res.status(500).json({ error: 'Failed to delete journey' });
  }
});

module.exports = router;
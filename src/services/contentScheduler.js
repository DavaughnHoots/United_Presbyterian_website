const Agenda = require('agenda');
const { DailyContent } = require('../models');

class ContentScheduler {
  constructor() {
    this.agenda = new Agenda({
      db: {
        address: process.env.DATABASE_URL,
        collection: 'scheduled_jobs',
        options: {
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        }
      },
      processEvery: '1 minute',
      maxConcurrency: 10
    });

    this.defineJobs();
  }

  defineJobs() {
    // Daily content rotation job
    this.agenda.define('rotate daily content', async (job) => {
      console.log('Running daily content rotation...');
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if content for today already exists
        const existingContent = await DailyContent.findOne({
          where: {
            publishDate: today
          }
        });
        
        if (!existingContent) {
          // Get the next unpublished content or recycle old content
          const nextContent = await this.getNextContent();
          
          if (nextContent) {
            nextContent.publishDate = today;
            nextContent.isPublished = true;
            await nextContent.save();
            console.log('Daily content updated:', nextContent.id);
          } else {
            console.log('No content available for rotation');
          }
        } else {
          console.log('Content already exists for today');
        }
      } catch (error) {
        console.error('Error rotating daily content:', error);
      }
    });

    // Email reminder job
    this.agenda.define('send daily reminders', async (job) => {
      console.log('Sending daily reminder emails...');
      
      try {
        const { User } = require('../models');
        const emailService = require('./emailService');
        
        // Get all users with email notifications enabled
        const users = await User.findAll({
          where: {
            isActive: true,
            personalEmail: { [require('sequelize').Op.ne]: null }
          }
        });
        
        // Get today's content
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayContent = await DailyContent.findOne({
          where: {
            publishDate: today,
            isPublished: true
          }
        });
        
        if (todayContent && users.length > 0) {
          // Send reminder emails
          for (const user of users) {
            if (user.preferences?.emailNotifications) {
              await emailService.sendDailyReminder(user, todayContent);
            }
          }
          console.log(`Sent reminders to ${users.length} users`);
        }
      } catch (error) {
        console.error('Error sending daily reminders:', error);
      }
    });
  }

  async getNextContent() {
    // First try to get unpublished content
    let content = await DailyContent.findOne({
      where: {
        isPublished: false
      },
      order: [['createdAt', 'ASC']]
    });
    
    if (!content) {
      // If no unpublished content, recycle the oldest published content
      content = await DailyContent.findOne({
        where: {
          isPublished: true
        },
        order: [['publishDate', 'ASC']]
      });
      
      if (content) {
        // Reset it for republishing
        content.isPublished = false;
      }
    }
    
    return content;
  }

  async start() {
    await this.agenda.start();
    
    // Schedule daily content rotation at 12:01 AM every day
    await this.agenda.every('0 1 0 * * *', 'rotate daily content');
    
    // Schedule daily reminders at 8:00 AM every day
    await this.agenda.every('0 0 8 * * *', 'send daily reminders');
    
    console.log('Content scheduler started');
  }

  async stop() {
    await this.agenda.stop();
    console.log('Content scheduler stopped');
  }

  // Manual trigger for testing
  async triggerDailyRotation() {
    await this.agenda.now('rotate daily content');
  }

  async triggerDailyReminders() {
    await this.agenda.now('send daily reminders');
  }
}

module.exports = new ContentScheduler();
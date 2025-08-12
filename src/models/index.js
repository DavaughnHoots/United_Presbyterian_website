const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import model definitions
const User = require('./User')(sequelize, DataTypes);
const Content = require('./Content')(sequelize, DataTypes);
const Submission = require('./Submission')(sequelize, DataTypes);
const Progress = require('./Progress')(sequelize, DataTypes);
const DailyContent = require('./DailyContent')(sequelize, DataTypes);
const Event = require('./Event')(sequelize, DataTypes);
const EventRegistration = require('./EventRegistration')(sequelize, DataTypes);
const Setting = require('./Setting')(sequelize, DataTypes);
const UserActivity = require('./UserActivity')(sequelize, DataTypes);
const PrayerSupport = require('./PrayerSupport')(sequelize, DataTypes);
const SubmissionUpdate = require('./SubmissionUpdate')(sequelize, DataTypes);
const BibleBook = require('./BibleBook')(sequelize, DataTypes);
const BibleVerse = require('./BibleVerse')(sequelize, DataTypes);
const Journey = require('./Journey')(sequelize, DataTypes);
const JourneyDay = require('./JourneyDay')(sequelize, DataTypes);
const JourneyContent = require('./JourneyContent')(sequelize, DataTypes);
const UserJourney = require('./UserJourney')(sequelize, DataTypes);
const UserJourneyProgress = require('./UserJourneyProgress')(sequelize, DataTypes);
const SentimentAnnotation = require('./SentimentAnnotation')(sequelize, DataTypes);
const UserProgress = require('./UserProgress')(sequelize, DataTypes);
const ContentEngagement = require('./ContentEngagement')(sequelize, DataTypes);
const AnalyticsEvent = require('./AnalyticsEvent')(sequelize, DataTypes);
const UserBadge = require('./UserBadge')(sequelize, DataTypes);
const Announcement = require('./Announcement')(sequelize, DataTypes);
const UserAnnouncement = require('./UserAnnouncement')(sequelize, DataTypes);

// Define associations
User.hasMany(Progress, { foreignKey: 'userId' });
Progress.belongsTo(User, { foreignKey: 'userId' });

Content.hasMany(Progress, { foreignKey: 'contentId' });
Progress.belongsTo(Content, { foreignKey: 'contentId' });

Content.hasMany(DailyContent, { foreignKey: 'contentId' });
DailyContent.belongsTo(Content, { foreignKey: 'contentId' });

// Event associations
User.hasMany(Event, { foreignKey: 'createdBy' });
Event.belongsTo(User, { foreignKey: 'createdBy' });

Event.hasMany(EventRegistration, { foreignKey: 'eventId' });
EventRegistration.belongsTo(Event, { foreignKey: 'eventId' });

User.hasMany(EventRegistration, { foreignKey: 'userId' });
EventRegistration.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(UserActivity, { foreignKey: 'userId' });
UserActivity.belongsTo(User, { foreignKey: 'userId' });

// Badge associations
User.hasMany(UserBadge, { foreignKey: 'userId', as: 'badges' });
UserBadge.belongsTo(User, { foreignKey: 'userId' });

// Announcement associations
User.hasMany(Announcement, { foreignKey: 'createdBy', as: 'createdAnnouncements' });
Announcement.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// User-Announcement many-to-many
User.belongsToMany(Announcement, { 
  through: UserAnnouncement, 
  foreignKey: 'userId',
  otherKey: 'announcementId',
  as: 'announcements' 
});
Announcement.belongsToMany(User, { 
  through: UserAnnouncement, 
  foreignKey: 'announcementId',
  otherKey: 'userId',
  as: 'readers' 
});

// Call associate methods if they exist
const models = {
  User,
  Content,
  Submission,
  Progress,
  DailyContent,
  Event,
  EventRegistration,
  Setting,
  UserActivity,
  PrayerSupport,
  SubmissionUpdate,
  BibleBook,
  BibleVerse,
  Journey,
  JourneyDay,
  JourneyContent,
  UserJourney,
  UserJourneyProgress,
  SentimentAnnotation,
  UserProgress,
  ContentEngagement,
  AnalyticsEvent,
  UserBadge,
  Announcement,
  UserAnnouncement
};

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};
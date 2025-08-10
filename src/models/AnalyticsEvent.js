const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const AnalyticsEvent = sequelize.define('AnalyticsEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of event: page_view, content_complete, greeting_click, etc.'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    page: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Page URL or route'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional event data'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ipHash: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'analytics_events',
    timestamps: false, // We only need createdAt
    createdAt: true,
    updatedAt: false
  });

  // Associations
  AnalyticsEvent.associate = function(models) {
    AnalyticsEvent.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  // Class methods for analytics
  AnalyticsEvent.trackEvent = async function(eventType, data = {}) {
    try {
      await this.create({
        eventType,
        userId: data.userId || null,
        sessionId: data.sessionId || null,
        page: data.page || null,
        metadata: data.metadata || {},
        userAgent: data.userAgent || null,
        ipHash: data.ipHash || null
      });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  };

  AnalyticsEvent.getDailyActiveUsers = async function(days = 7) {
    const results = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const count = await this.count({
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay]
          },
          userId: {
            [Op.ne]: null
          }
        },
        distinct: true,
        col: 'userId'
      });
      
      results.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }
    
    return results;
  };

  return AnalyticsEvent;
};
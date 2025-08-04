module.exports = (sequelize, DataTypes) => {
  const DailyContent = sequelize.define('DailyContent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'content',
        key: 'id'
      }
    },
    contentType: {
      type: DataTypes.ENUM(
        'scripture_reading',
        'hymn',
        'prayer',
        'guided_prayer',
        'journaling_prompt',
        'reflection',
        'artwork',
        'video',
        'creed',
        'reading',
        'music',
        'question',
        'historical_context',
        'interactive_map'
      ),
      allowNull: false
    },
    theme: {
      type: DataTypes.STRING,
      allowNull: true
    },
    season: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'daily_content',
    timestamps: true,
    indexes: [
      {
        fields: ['date', 'contentType'],
        unique: true
      },
      {
        fields: ['date']
      },
      {
        fields: ['contentType']
      }
    ]
  });

  // Class methods
  DailyContent.getTodaysContent = async function() {
    const today = new Date().toISOString().split('T')[0];
    
    const content = await this.findAll({
      where: { date: today },
      include: [{
        model: sequelize.models.Content,
        as: 'Content'
      }]
    });
    
    const result = {};
    content.forEach(item => {
      result[item.contentType] = item.Content;
    });
    
    return result;
  };

  DailyContent.generateDailyContent = async function(date = new Date()) {
    const dateString = date.toISOString().split('T')[0];
    const Content = sequelize.models.Content;
    
    // Check if content already exists for this date
    const existing = await this.count({ where: { date: dateString } });
    if (existing > 0) {
      console.log(`Daily content already exists for ${dateString}`);
      return;
    }
    
    // Get recently used content IDs to avoid repetition
    const recentDays = 7;
    const recentContent = await this.findAll({
      where: {
        date: {
          [sequelize.Sequelize.Op.gte]: new Date(date - recentDays * 24 * 60 * 60 * 1000)
        }
      },
      attributes: ['contentId']
    });
    const recentIds = recentContent.map(c => c.contentId);
    
    // Generate content for each type
    const contentTypes = ['reading', 'prayer', 'music', 'question'];
    const dailyContent = [];
    
    for (const type of contentTypes) {
      const content = await Content.getRandomByType(type, recentIds);
      if (content) {
        dailyContent.push({
          date: dateString,
          contentId: content.id,
          contentType: type,
          theme: content.theme,
          season: content.season
        });
        
        // Update content usage
        content.usageCount += 1;
        content.lastUsedDate = dateString;
        await content.save();
      }
    }
    
    // Bulk create daily content
    if (dailyContent.length > 0) {
      await this.bulkCreate(dailyContent);
      console.log(`Generated daily content for ${dateString}`);
    }
  };

  // Define associations
  DailyContent.associate = function(models) {
    DailyContent.belongsTo(models.Content, {
      foreignKey: 'contentId',
      as: 'content'
    });
  };

  return DailyContent;
};
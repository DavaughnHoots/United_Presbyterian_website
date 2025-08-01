module.exports = (sequelize, DataTypes) => {
  const JourneyContent = sequelize.define('JourneyContent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    journey_day_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'journey_days',
        key: 'id'
      }
    },
    content_type: {
      type: DataTypes.ENUM(
        'bible_verse', 
        'prayer', 
        'hymn', 
        'creed', 
        'reflection',
        'scripture_reading',
        'artwork',
        'video',
        'journaling_prompt',
        'guided_prayer',
        'breathing_exercise'
      ),
      allowNull: false
    },
    content_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'journey_content',
    timestamps: true,
    indexes: [
      {
        fields: ['journey_day_id', 'order_index']
      }
    ]
  });

  JourneyContent.associate = function(models) {
    JourneyContent.belongsTo(models.JourneyDay, {
      foreignKey: 'journey_day_id',
      as: 'journeyDay'
    });
    
    JourneyContent.hasMany(models.UserJourneyProgress, {
      foreignKey: 'journey_content_id',
      as: 'progress'
    });
  };

  // Helper method to get the actual content
  JourneyContent.prototype.getContent = async function() {
    // Check if this is custom content stored inline
    if (this.content_id && (this.content_id === 'custom' || this.content_id.startsWith('custom_'))) {
      // Return metadata as the content for custom items
      return this.metadata || {};
    }
    
    if (this.content_type === 'bible_verse') {
      // Parse verse reference (e.g., "1001001" or "1001001-1001005")
      const verses = this.content_id.split('-');
      const startId = parseInt(verses[0]);
      const endId = verses[1] ? parseInt(verses[1]) : startId;
      
      // Check if the parsed IDs are valid numbers
      if (isNaN(startId) || isNaN(endId)) {
        console.error(`Invalid Bible verse IDs: ${this.content_id}`);
        // Check if it's a UUID (Content table reference)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(this.content_id)) {
          return await sequelize.models.Content.findByPk(this.content_id);
        }
        return null;
      }
      
      return await sequelize.models.BibleVerse.findAll({
        where: {
          id: {
            [sequelize.Sequelize.Op.between]: [startId, endId]
          }
        },
        include: [{
          model: sequelize.models.BibleBook,
          as: 'book'
        }],
        order: [['id', 'ASC']]
      });
    } else {
      // For all other content types, check if it's a valid UUID first
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(this.content_id)) {
        return await sequelize.models.Content.findByPk(this.content_id);
      }
      // Otherwise return null or metadata
      return this.metadata || null;
    }
  };

  return JourneyContent;
};
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
      type: DataTypes.ENUM('bible_verse', 'prayer', 'hymn', 'creed', 'reflection'),
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
    if (this.content_type === 'bible_verse') {
      // Parse verse reference (e.g., "1001001" or "1001001-1001005")
      const verses = this.content_id.split('-');
      const startId = parseInt(verses[0]);
      const endId = verses[1] ? parseInt(verses[1]) : startId;
      
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
      // For other content types, fetch from the Content table
      return await sequelize.models.Content.findByPk(this.content_id);
    }
  };

  return JourneyContent;
};
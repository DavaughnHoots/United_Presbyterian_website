module.exports = (sequelize, DataTypes) => {
  const Content = sequelize.define('Content', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('reading', 'prayer', 'music', 'question'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true // Music might not have text content
    },
    biblePassage: {
      type: DataTypes.STRING,
      allowNull: true // Only for readings
    },
    youtubeId: {
      type: DataTypes.STRING,
      allowNull: true // Only for music
    },
    theme: {
      type: DataTypes.STRING,
      allowNull: true
    },
    season: {
      type: DataTypes.STRING,
      allowNull: true // liturgical season
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastUsedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'content',
    timestamps: true,
    indexes: [
      {
        fields: ['type']
      },
      {
        fields: ['theme']
      },
      {
        fields: ['season']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  // Class methods
  Content.getRandomByType = async function(type, excludeIds = []) {
    const content = await this.findAll({
      where: {
        type,
        isActive: true,
        id: {
          [sequelize.Sequelize.Op.notIn]: excludeIds
        }
      },
      order: [
        ['usageCount', 'ASC'],
        ['lastUsedDate', 'ASC NULLS FIRST']
      ],
      limit: 10
    });

    if (content.length === 0) return null;
    
    // Weighted random selection favoring less used content
    const weights = content.map((item, index) => content.length - index);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < content.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return content[i];
      }
    }
    
    return content[0];
  };

  return Content;
};
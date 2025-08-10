module.exports = (sequelize, DataTypes) => {
  const ContentEngagement = sequelize.define('ContentEngagement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    contentType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of content: scripture, prayer, hymn, etc.'
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to specific content item'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    engagementType: {
      type: DataTypes.ENUM('amen', 'share', 'save', 'like'),
      allowNull: false,
      defaultValue: 'amen'
    },
    ipHash: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Hashed IP for anonymous deduplication'
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'content_engagements',
    timestamps: true
  });

  // Associations
  ContentEngagement.associate = function(models) {
    ContentEngagement.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  // Class methods
  ContentEngagement.getAmenCount = async function(contentType, contentId) {
    const count = await this.count({
      where: {
        contentType,
        contentId,
        engagementType: 'amen'
      }
    });
    return count;
  };

  ContentEngagement.hasUserEngaged = async function(contentType, contentId, userId, engagementType = 'amen') {
    if (!userId) return false;
    
    const engagement = await this.findOne({
      where: {
        contentType,
        contentId,
        userId,
        engagementType
      }
    });
    
    return !!engagement;
  };

  return ContentEngagement;
};
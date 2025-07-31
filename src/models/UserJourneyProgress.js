module.exports = (sequelize, DataTypes) => {
  const UserJourneyProgress = sequelize.define('UserJourneyProgress', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_journey_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'user_journeys',
        key: 'id'
      }
    },
    journey_content_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'journey_content',
        key: 'id'
      }
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_journey_progress',
    timestamps: true,
    indexes: [
      {
        fields: ['user_journey_id', 'journey_content_id'],
        unique: true
      }
    ]
  });

  UserJourneyProgress.associate = function(models) {
    UserJourneyProgress.belongsTo(models.UserJourney, {
      foreignKey: 'user_journey_id',
      as: 'userJourney'
    });
    
    UserJourneyProgress.belongsTo(models.JourneyContent, {
      foreignKey: 'journey_content_id',
      as: 'content'
    });
  };

  return UserJourneyProgress;
};
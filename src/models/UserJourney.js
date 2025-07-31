module.exports = (sequelize, DataTypes) => {
  const UserJourney = sequelize.define('UserJourney', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    journey_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'journeys',
        key: 'id'
      }
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    current_day: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'user_journeys',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id', 'is_active']
      }
    ]
  });

  UserJourney.associate = function(models) {
    UserJourney.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    UserJourney.belongsTo(models.Journey, {
      foreignKey: 'journey_id',
      as: 'journey'
    });
    
    UserJourney.hasMany(models.UserJourneyProgress, {
      foreignKey: 'user_journey_id',
      as: 'progress',
      onDelete: 'CASCADE'
    });
  };

  // Ensure only one active journey per user
  UserJourney.beforeCreate(async (userJourney) => {
    if (userJourney.is_active) {
      await UserJourney.update(
        { is_active: false },
        { 
          where: { 
            user_id: userJourney.user_id,
            is_active: true 
          } 
        }
      );
    }
  });

  // Calculate the day user should be on based on start date
  UserJourney.prototype.calculateCurrentDay = function() {
    const daysSinceStart = Math.floor((new Date() - this.start_date) / (1000 * 60 * 60 * 24));
    return Math.min(daysSinceStart + 1, this.journey.duration_days);
  };

  // Get today's content for the user
  UserJourney.prototype.getTodayContent = async function() {
    const currentDay = this.calculateCurrentDay();
    
    const journeyDay = await sequelize.models.JourneyDay.findOne({
      where: {
        journey_id: this.journey_id,
        day_number: currentDay
      },
      include: [{
        model: sequelize.models.JourneyContent,
        as: 'content',
        order: [['order_index', 'ASC']]
      }]
    });
    
    return journeyDay;
  };

  return UserJourney;
};
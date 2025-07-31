module.exports = (sequelize, DataTypes) => {
  const Journey = sequelize.define('Journey', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duration_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 365
      }
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'journeys',
    timestamps: true
  });

  Journey.associate = function(models) {
    Journey.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    
    Journey.hasMany(models.JourneyDay, {
      foreignKey: 'journey_id',
      as: 'days',
      onDelete: 'CASCADE'
    });
    
    Journey.hasMany(models.UserJourney, {
      foreignKey: 'journey_id',
      as: 'userJourneys'
    });
  };

  // Set only one journey as default
  Journey.beforeSave(async (journey) => {
    if (journey.is_default) {
      await Journey.update(
        { is_default: false },
        { where: { is_default: true } }
      );
    }
  });

  return Journey;
};
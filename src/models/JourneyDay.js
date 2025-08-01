module.exports = (sequelize, DataTypes) => {
  const JourneyDay = sequelize.define('JourneyDay', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    journey_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'journeys',
        key: 'id'
      }
    },
    day_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    theme: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'journey_days',
    timestamps: true,
    indexes: [
      {
        fields: ['journey_id', 'day_number'],
        unique: true
      }
    ]
  });

  JourneyDay.associate = function(models) {
    JourneyDay.belongsTo(models.Journey, {
      foreignKey: 'journey_id',
      as: 'journey'
    });
    
    JourneyDay.hasMany(models.JourneyContent, {
      foreignKey: 'journey_day_id',
      as: 'content',
      onDelete: 'CASCADE'
    });
  };

  return JourneyDay;
};
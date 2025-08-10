module.exports = (sequelize, DataTypes) => {
  const UserProgress = sequelize.define('UserProgress', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    contentCompleted: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Tracks which content items were completed'
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Time spent in minutes'
    }
  }, {
    tableName: 'user_progress',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'date']
      }
    ]
  });

  // Associations
  UserProgress.associate = function(models) {
    UserProgress.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return UserProgress;
};
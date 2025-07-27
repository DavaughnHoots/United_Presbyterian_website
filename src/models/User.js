module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    personalEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    currentStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    longestStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastActiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        emailNotifications: true,
        dailyReminder: true,
        reminderTime: '08:00'
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  });

  // Instance methods
  User.prototype.updateStreak = async function() {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = this.lastActiveDate;
    
    if (!lastActive) {
      this.currentStreak = 1;
      this.longestStreak = Math.max(1, this.longestStreak);
    } else {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Already active today
        return;
      } else if (diffDays === 1) {
        // Consecutive day
        this.currentStreak += 1;
        this.longestStreak = Math.max(this.currentStreak, this.longestStreak);
      } else {
        // Streak broken
        this.currentStreak = 1;
      }
    }
    
    this.lastActiveDate = today;
    await this.save();
  };

  return User;
};
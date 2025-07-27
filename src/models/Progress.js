module.exports = (sequelize, DataTypes) => {
  const Progress = sequelize.define('Progress', {
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
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'content',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
      defaultValue: 'not_started'
    },
    progressPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    timeSpent: {
      type: DataTypes.INTEGER, // in seconds
      defaultValue: 0
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reflection: {
      type: DataTypes.TEXT,
      allowNull: true // User's personal reflection/notes
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'progress',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'contentId'],
        unique: true
      },
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['date']
      }
    ]
  });

  // Instance methods
  Progress.prototype.markComplete = async function() {
    this.status = 'completed';
    this.progressPercentage = 100;
    this.completedAt = new Date();
    await this.save();
    
    // Update user streak
    const User = this.sequelize.models.User;
    const user = await User.findByPk(this.userId);
    if (user) {
      await user.updateStreak();
    }
  };

  Progress.prototype.updateProgress = async function(percentage, timeToAdd = 0) {
    this.progressPercentage = Math.min(100, Math.max(0, percentage));
    this.timeSpent += timeToAdd;
    
    if (this.status === 'not_started' && percentage > 0) {
      this.status = 'in_progress';
      this.startedAt = new Date();
    }
    
    if (percentage >= 100) {
      await this.markComplete();
    } else {
      await this.save();
    }
  };

  // Class methods
  Progress.getUserDailyProgress = async function(userId, date = new Date()) {
    const dateString = date.toISOString().split('T')[0];
    
    const progress = await this.findAll({
      where: {
        userId,
        date: dateString
      },
      include: [{
        model: sequelize.models.Content,
        attributes: ['type', 'title']
      }]
    });
    
    const summary = {
      date: dateString,
      totalItems: progress.length,
      completedItems: progress.filter(p => p.status === 'completed').length,
      inProgressItems: progress.filter(p => p.status === 'in_progress').length,
      totalTimeSpent: progress.reduce((sum, p) => sum + p.timeSpent, 0),
      byType: {}
    };
    
    // Group by content type
    ['reading', 'prayer', 'music', 'question'].forEach(type => {
      const typeProgress = progress.filter(p => p.Content && p.Content.type === type);
      summary.byType[type] = {
        total: typeProgress.length,
        completed: typeProgress.filter(p => p.status === 'completed').length
      };
    });
    
    return summary;
  };

  return Progress;
};
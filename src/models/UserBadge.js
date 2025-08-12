module.exports = (sequelize, DataTypes) => {
  const UserBadge = sequelize.define('UserBadge', {
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
    badgeType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of badge earned (streak_7, scripture_50, prayer_10, etc.)'
    },
    badgeName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Display name of the badge'
    },
    badgeIcon: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '⭐',
      comment: 'Emoji or icon for the badge'
    },
    tier: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Badge tier/level (1=bronze, 2=silver, 3=gold)'
    },
    earnedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional data about how badge was earned'
    }
  }, {
    tableName: 'user_badges',
    timestamps: true
  });

  // Badge definitions
  UserBadge.BADGE_TYPES = {
    // Streak badges
    STREAK_7: { type: 'streak_7', name: '7 Day Streak', icon: '🔥', tier: 1 },
    STREAK_30: { type: 'streak_30', name: '30 Day Streak', icon: '🔥', tier: 2 },
    STREAK_100: { type: 'streak_100', name: '100 Day Streak', icon: '🔥', tier: 3 },
    
    // Scripture badges
    SCRIPTURE_50: { type: 'scripture_50', name: 'Scripture Scholar', icon: '📖', tier: 1 },
    SCRIPTURE_100: { type: 'scripture_100', name: 'Scripture Master', icon: '📖', tier: 2 },
    SCRIPTURE_500: { type: 'scripture_500', name: 'Scripture Legend', icon: '📖', tier: 3 },
    
    // Prayer badges
    PRAYER_10: { type: 'prayer_10', name: 'Prayer Initiate', icon: '🙏', tier: 1 },
    PRAYER_25: { type: 'prayer_25', name: 'Prayer Warrior', icon: '🙏', tier: 2 },
    PRAYER_50: { type: 'prayer_50', name: 'Prayer Champion', icon: '🙏', tier: 3 },
    
    // Engagement badges
    AMEN_50: { type: 'amen_50', name: 'Encourager', icon: '💝', tier: 1 },
    AMEN_100: { type: 'amen_100', name: 'Great Encourager', icon: '💝', tier: 2 },
    AMEN_500: { type: 'amen_500', name: 'Master Encourager', icon: '💝', tier: 3 },
    
    // Special badges
    EARLY_ADOPTER: { type: 'early_adopter', name: 'Early Adopter', icon: '⭐', tier: 1 },
    MORNING_DEVOTION: { type: 'morning_devotion', name: 'Morning Glory', icon: '🌅', tier: 1 },
    JOURNEY_COMPLETE: { type: 'journey_complete', name: 'Journey Complete', icon: '📚', tier: 1 }
  };

  // Associations
  UserBadge.associate = function(models) {
    UserBadge.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  // Class methods
  UserBadge.awardBadge = async function(userId, badgeType) {
    const badgeInfo = this.BADGE_TYPES[badgeType.toUpperCase()];
    if (!badgeInfo) {
      throw new Error(`Unknown badge type: ${badgeType}`);
    }

    // Check if user already has this badge
    const existing = await this.findOne({
      where: { userId, badgeType: badgeInfo.type, tier: badgeInfo.tier }
    });

    if (existing) {
      return existing;
    }

    // Award the badge
    return await this.create({
      userId,
      badgeType: badgeInfo.type,
      badgeName: badgeInfo.name,
      badgeIcon: badgeInfo.icon,
      tier: badgeInfo.tier,
      earnedAt: new Date()
    });
  };

  UserBadge.checkAndAwardBadges = async function(userId, models) {
    const user = await models.User.findByPk(userId, {
      include: [
        { model: models.UserProgress, as: 'progress' },
        { model: models.Submission, as: 'submissions' }
      ]
    });

    if (!user) return;

    const awardedbadges = [];

    // Check streak badges
    if (user.currentStreak >= 7 && !(await this.findOne({ where: { userId, badgeType: 'streak_7' } }))) {
      awardedbadges.push(await this.awardBadge(userId, 'STREAK_7'));
    }
    if (user.currentStreak >= 30 && !(await this.findOne({ where: { userId, badgeType: 'streak_30' } }))) {
      awardedbadges.push(await this.awardBadge(userId, 'STREAK_30'));
    }
    if (user.currentStreak >= 100 && !(await this.findOne({ where: { userId, badgeType: 'streak_100' } }))) {
      awardedbadges.push(await this.awardBadge(userId, 'STREAK_100'));
    }

    return awardedbadges;
  };

  return UserBadge;
};
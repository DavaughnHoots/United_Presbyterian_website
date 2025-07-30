module.exports = (sequelize, DataTypes) => {
  const PrayerSupport = sequelize.define('PrayerSupport', {
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
    submissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'submissions',
        key: 'id'
      }
    }
  }, {
    tableName: 'prayer_supports',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'submissionId'],
        name: 'prayer_supports_user_submission_unique'
      },
      {
        fields: ['submissionId']
      }
    ]
  });

  // Class methods
  PrayerSupport.addPrayer = async function(userId, submissionId) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if prayer already exists
      const existing = await this.findOne({
        where: { userId, submissionId }
      });
      
      if (existing) {
        await transaction.rollback();
        return { success: false, message: 'You are already praying for this' };
      }
      
      // Create prayer support
      const prayerSupport = await this.create({
        userId,
        submissionId
      }, { transaction });
      
      // Increment prayer count on submission
      await sequelize.models.Submission.increment('prayerCount', {
        where: { id: submissionId },
        transaction
      });
      
      await transaction.commit();
      return { success: true, prayerSupport };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  PrayerSupport.removePrayer = async function(userId, submissionId) {
    const transaction = await sequelize.transaction();
    
    try {
      const prayerSupport = await this.findOne({
        where: { userId, submissionId }
      });
      
      if (!prayerSupport) {
        await transaction.rollback();
        return { success: false, message: 'Prayer support not found' };
      }
      
      await prayerSupport.destroy({ transaction });
      
      // Decrement prayer count on submission
      await sequelize.models.Submission.decrement('prayerCount', {
        where: { id: submissionId },
        transaction
      });
      
      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  // Associations
  PrayerSupport.associate = function(models) {
    PrayerSupport.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    
    PrayerSupport.belongsTo(models.Submission, {
      foreignKey: 'submissionId'
    });
  };

  return PrayerSupport;
};
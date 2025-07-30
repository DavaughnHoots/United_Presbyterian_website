module.exports = (sequelize, DataTypes) => {
  const SubmissionUpdate = sequelize.define('SubmissionUpdate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    submissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'submissions',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 1000]
      }
    },
    updateType: {
      type: DataTypes.ENUM('update', 'answered', 'need_continued_prayer'),
      defaultValue: 'update',
      allowNull: false
    }
  }, {
    tableName: 'submission_updates',
    timestamps: true,
    indexes: [
      {
        fields: ['submissionId']
      }
    ]
  });

  // Instance methods
  SubmissionUpdate.prototype.formatForDisplay = function() {
    const typeLabels = {
      'update': 'Update',
      'answered': 'Prayer Answered!',
      'need_continued_prayer': 'Continued Prayer Needed'
    };
    
    return {
      id: this.id,
      content: this.content,
      updateType: this.updateType,
      typeLabel: typeLabels[this.updateType] || 'Update',
      createdAt: this.createdAt,
      timeAgo: this.getTimeAgo()
    };
  };

  SubmissionUpdate.prototype.getTimeAgo = function() {
    const now = new Date();
    const diffMs = now - new Date(this.createdAt);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'just now' : `${diffMins} minutes ago`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
  };

  // Class methods
  SubmissionUpdate.createUpdate = async function(submissionId, content, updateType, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify the submission exists and user has permission
      const submission = await sequelize.models.Submission.findByPk(submissionId);
      
      if (!submission) {
        await transaction.rollback();
        return { success: false, error: 'Submission not found' };
      }
      
      // Check if user is the original submitter (if not anonymous)
      if (submission.userId && submission.userId !== userId) {
        await transaction.rollback();
        return { success: false, error: 'You can only update your own submissions' };
      }
      
      // Create the update
      const update = await this.create({
        submissionId,
        content,
        updateType
      }, { transaction });
      
      // If marked as answered, update the submission
      if (updateType === 'answered') {
        await submission.update({
          isAnswered: true,
          answeredAt: new Date()
        }, { transaction });
      }
      
      await transaction.commit();
      return { success: true, update };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  // Associations
  SubmissionUpdate.associate = function(models) {
    SubmissionUpdate.belongsTo(models.Submission, {
      foreignKey: 'submissionId'
    });
  };

  return SubmissionUpdate;
};
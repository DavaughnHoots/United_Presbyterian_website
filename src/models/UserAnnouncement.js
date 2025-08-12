module.exports = (sequelize, DataTypes) => {
  const UserAnnouncement = sequelize.define('UserAnnouncement', {
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
    announcementId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'announcements',
        key: 'id'
      }
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When user read the announcement'
    },
    dismissedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When user dismissed the announcement'
    }
  }, {
    tableName: 'user_announcements',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'announcementId']
      }
    ]
  });

  // Class methods
  UserAnnouncement.markAsRead = async function(userId, announcementId) {
    const [record, created] = await this.findOrCreate({
      where: { userId, announcementId },
      defaults: { readAt: new Date() }
    });

    if (!created && !record.readAt) {
      record.readAt = new Date();
      await record.save();
    }

    return record;
  };

  UserAnnouncement.markAsDismissed = async function(userId, announcementId) {
    const [record, created] = await this.findOrCreate({
      where: { userId, announcementId },
      defaults: { 
        readAt: new Date(),
        dismissedAt: new Date() 
      }
    });

    if (!created) {
      if (!record.readAt) record.readAt = new Date();
      record.dismissedAt = new Date();
      await record.save();
    }

    return record;
  };

  return UserAnnouncement;
};
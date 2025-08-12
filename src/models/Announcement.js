module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define('Announcement', {
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
        len: [1, 200]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    priority: {
      type: DataTypes.ENUM('info', 'important', 'urgent'),
      defaultValue: 'info',
      allowNull: false
    },
    targetAudience: {
      type: DataTypes.ENUM('all', 'members', 'admins'),
      defaultValue: 'all',
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    publishAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to start showing the announcement'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to stop showing the announcement'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'announcements',
    timestamps: true
  });

  // Associations are defined in index.js to avoid duplicate aliases

  // Class methods
  Announcement.getActiveAnnouncements = async function(userId = null, isAdmin = false) {
    const { Op } = require('sequelize');
    const now = new Date();
    
    const where = {
      isActive: true,
      [Op.or]: [
        { publishAt: null },
        { publishAt: { [Op.lte]: now } }
      ],
      [Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Op.gte]: now } }
      ]
    };

    // Filter by target audience
    if (!isAdmin) {
      where.targetAudience = { [Op.in]: ['all', 'members'] };
    }

    const announcements = await this.findAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    // If userId provided, include read status
    if (userId) {
      const UserAnnouncement = sequelize.models.UserAnnouncement;
      const userReadStatus = await UserAnnouncement.findAll({
        where: { userId },
        attributes: ['announcementId', 'readAt', 'dismissedAt']
      });

      const readMap = {};
      userReadStatus.forEach(status => {
        readMap[status.announcementId] = {
          readAt: status.readAt,
          dismissedAt: status.dismissedAt
        };
      });

      return announcements.map(ann => {
        const annData = ann.toJSON();
        annData.userStatus = readMap[ann.id] || { readAt: null, dismissedAt: null };
        return annData;
      });
    }

    return announcements;
  };

  Announcement.getUnreadCount = async function(userId) {
    const { Op } = require('sequelize');
    const now = new Date();
    
    const activeAnnouncements = await this.findAll({
      where: {
        isActive: true,
        targetAudience: { [Op.in]: ['all', 'members'] },
        [Op.or]: [
          { publishAt: null },
          { publishAt: { [Op.lte]: now } }
        ],
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gte]: now } }
        ]
      },
      attributes: ['id']
    });

    const activeIds = activeAnnouncements.map(a => a.id);
    
    if (activeIds.length === 0) return 0;

    const UserAnnouncement = sequelize.models.UserAnnouncement;
    const readCount = await UserAnnouncement.count({
      where: {
        userId,
        announcementId: { [Op.in]: activeIds },
        readAt: { [Op.ne]: null }
      }
    });

    return activeIds.length - readCount;
  };

  return Announcement;
};
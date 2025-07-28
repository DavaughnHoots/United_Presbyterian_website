const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventRegistration = sequelize.define('EventRegistration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  guestName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guestEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  numberOfAttendees: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('registered', 'waitlisted', 'cancelled'),
    defaultValue: 'registered'
  },
  registeredAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'event_registrations',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['eventId', 'userId'],
      where: {
        userId: {
          [sequelize.Op.ne]: null
        }
      }
    },
    {
      unique: true,
      fields: ['eventId', 'guestEmail'],
      where: {
        guestEmail: {
          [sequelize.Op.ne]: null
        }
      }
    }
  ]
});

module.exports = EventRegistration;
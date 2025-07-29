module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
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
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterStart(value) {
        if (value < this.startDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  allDay: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPattern: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    allowNull: true
  },
  recurrencePattern: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recurringEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  recurrenceEnd: {
    type: DataTypes.DATE,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('worship', 'bible-study', 'fellowship', 'service', 'meeting', 'special'),
    defaultValue: 'worship'
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#87CEEB'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  maxAttendees: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  registrationRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  requireRegistration: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  registrationDeadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'events',
  timestamps: true
});

  // Model associations will be defined in associations.js
  
  return Event;
};
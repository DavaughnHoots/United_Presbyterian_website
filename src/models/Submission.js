const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const Submission = sequelize.define('Submission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('joy', 'concern', 'testimony'),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 2000]
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    contentHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    moderatorNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    moderatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    moderatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ipHash: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Hashed IP address for rate limiting'
    },
    flags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'submissions',
    timestamps: true,
    indexes: [
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['contentHash']
      }
    ],
    hooks: {
      beforeValidate: (submission) => {
        // Generate content hash for duplicate detection
        if (submission.content) {
          submission.contentHash = crypto
            .createHash('sha256')
            .update(submission.content.toLowerCase().trim())
            .digest('hex');
        }
      }
    }
  });

  // Instance methods
  Submission.prototype.checkForFlags = function() {
    const flags = [];
    const content = this.content.toLowerCase();
    
    // Check for potential spam patterns
    const urlPattern = /https?:\/\/\S+/g;
    const urls = content.match(urlPattern);
    if (urls && urls.length > 2) {
      flags.push('excessive_urls');
    }
    
    // Check for repeated characters
    if (/(.)\1{9,}/.test(content)) {
      flags.push('repeated_characters');
    }
    
    // Check for all caps (more than 50% of alphabetic characters)
    const letters = content.match(/[a-zA-Z]/g) || [];
    const uppercase = content.match(/[A-Z]/g) || [];
    if (letters.length > 10 && uppercase.length / letters.length > 0.5) {
      flags.push('excessive_caps');
    }
    
    // Check for profanity (basic list - should be expanded)
    const profanityList = ['damn', 'hell']; // Minimal list for church context
    for (const word of profanityList) {
      if (content.includes(word)) {
        flags.push('potential_profanity');
        break;
      }
    }
    
    this.flags = flags;
    return flags;
  };

  // Class methods
  Submission.checkDuplicate = async function(content) {
    const hash = crypto
      .createHash('sha256')
      .update(content.toLowerCase().trim())
      .digest('hex');
    
    const existing = await this.findOne({
      where: {
        contentHash: hash,
        createdAt: {
          [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    
    return existing !== null;
  };

  return Submission;
};
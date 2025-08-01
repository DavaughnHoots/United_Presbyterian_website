module.exports = (sequelize, DataTypes) => {
  const Prayer = sequelize.define('Prayer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM(
        'morning',
        'evening',
        'meal',
        'healing',
        'thanksgiving',
        'confession',
        'intercession',
        'traditional',
        'seasonal',
        'other'
      ),
      allowNull: false,
      defaultValue: 'other'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'prayers',
    timestamps: true,
    indexes: [
      {
        fields: ['title']
      },
      {
        fields: ['category']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  Prayer.associate = function(models) {
    Prayer.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
  };

  // Instance methods
  Prayer.prototype.incrementUsage = async function() {
    this.usage_count += 1;
    await this.save();
  };

  // Class methods
  Prayer.searchPrayers = async function(query, category = null) {
    const { Op } = require('sequelize');
    const where = {
      is_active: true
    };

    if (query) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${query}%` } },
        { content: { [Op.iLike]: `%${query}%` } },
        { author: { [Op.iLike]: `%${query}%` } },
        { tags: { [Op.contains]: [query.toLowerCase()] } }
      ];
    }

    if (category) {
      where.category = category;
    }

    return await this.findAll({
      where,
      order: [
        ['usage_count', 'DESC'],
        ['title', 'ASC']
      ]
    });
  };

  Prayer.getByCategory = async function(category) {
    return await this.findAll({
      where: {
        category,
        is_active: true
      },
      order: [['title', 'ASC']]
    });
  };

  Prayer.getMostUsed = async function(limit = 10) {
    return await this.findAll({
      where: { is_active: true },
      order: [['usage_count', 'DESC']],
      limit
    });
  };

  return Prayer;
};
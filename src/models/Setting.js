module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define('Setting', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'general'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'settings',
    timestamps: true
  });

  // Class methods
  Setting.get = async function(key, defaultValue = null) {
    const setting = await this.findOne({ where: { key } });
    return setting ? setting.value : defaultValue;
  };

  Setting.set = async function(key, value, category = 'general') {
    const [setting, created] = await this.findOrCreate({
      where: { key },
      defaults: { value, category }
    });
    
    if (!created) {
      setting.value = value;
      await setting.save();
    }
    
    return setting;
  };

  Setting.getByCategory = async function(category) {
    const settings = await this.findAll({ where: { category } });
    const result = {};
    settings.forEach(setting => {
      result[setting.key] = setting.value;
    });
    return result;
  };

  Setting.getAll = async function() {
    const settings = await this.findAll();
    const result = {};
    settings.forEach(setting => {
      result[setting.key] = setting.value;
    });
    return result;
  };

  return Setting;
};
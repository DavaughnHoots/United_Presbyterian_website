const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SentimentAnnotation = sequelize.define('SentimentAnnotation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sampleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sample_id'
  },
  bookName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'book_name'
  },
  chapter: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  verse: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  genreName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'genre_name'
  },
  sentiment: {
    type: DataTypes.ENUM('positive', 'negative', 'neutral', 'skip'),
    allowNull: true
  },
  annotatorId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'annotator_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  annotatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'annotated_at'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'sentiment_annotations',
  timestamps: true,
  underscored: true
});

// Add associations
SentimentAnnotation.associate = function(models) {
  SentimentAnnotation.belongsTo(models.User, {
    foreignKey: 'annotator_id',
    as: 'annotator'
  });
};

module.exports = SentimentAnnotation;
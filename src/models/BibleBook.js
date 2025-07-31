module.exports = (sequelize, DataTypes) => {
  const BibleBook = sequelize.define('BibleBook', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    testament: {
      type: DataTypes.STRING(2),
      allowNull: false
    },
    genre: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'bible_books',
    timestamps: true
  });

  BibleBook.associate = function(models) {
    BibleBook.hasMany(models.BibleVerse, {
      foreignKey: 'book_id',
      as: 'verses'
    });
  };

  return BibleBook;
};
module.exports = (sequelize, DataTypes) => {
  const BibleVerse = sequelize.define('BibleVerse', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bible_books',
        key: 'id'
      }
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
    translation: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'KJV'
    }
  }, {
    tableName: 'bible_verses',
    timestamps: true,
    indexes: [
      {
        fields: ['book_id', 'chapter', 'verse']
      },
      {
        fields: ['translation']
      }
    ]
  });

  BibleVerse.associate = function(models) {
    BibleVerse.belongsTo(models.BibleBook, {
      foreignKey: 'book_id',
      as: 'book'
    });
  };

  // Helper method to get verse reference
  BibleVerse.prototype.getReference = async function() {
    const book = await this.getBook();
    return `${book.name} ${this.chapter}:${this.verse}`;
  };

  // Static method to find verses by reference
  BibleVerse.findByReference = async function(bookName, chapter, verseStart, verseEnd = null) {
    const book = await sequelize.models.BibleBook.findOne({
      where: { name: bookName }
    });
    
    if (!book) return null;
    
    const where = {
      book_id: book.id,
      chapter: chapter
    };
    
    if (verseEnd) {
      where.verse = {
        [sequelize.Sequelize.Op.between]: [verseStart, verseEnd]
      };
    } else {
      where.verse = verseStart;
    }
    
    return this.findAll({
      where,
      include: [{
        model: sequelize.models.BibleBook,
        as: 'book'
      }],
      order: [['verse', 'ASC']]
    });
  };

  return BibleVerse;
};
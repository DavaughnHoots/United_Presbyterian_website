'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('prayers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      author: {
        type: Sequelize.STRING,
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM(
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
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for searching
    await queryInterface.addIndex('prayers', ['title']);
    await queryInterface.addIndex('prayers', ['category']);
    await queryInterface.addIndex('prayers', ['is_active']);
    await queryInterface.addIndex('prayers', ['tags'], {
      using: 'GIN' // PostgreSQL GIN index for array searching
    });

    // Insert some default prayers
    const defaultPrayers = [
      {
        id: queryInterface.sequelize.literal('gen_random_uuid()'),
        title: "The Lord's Prayer",
        content: "Our Father, who art in heaven,\nhallowed be thy name;\nthy kingdom come;\nthy will be done;\non earth as it is in heaven.\nGive us this day our daily bread.\nAnd forgive us our trespasses,\nas we forgive those who trespass against us.\nAnd lead us not into temptation;\nbut deliver us from evil.\nFor thine is the kingdom,\nthe power and the glory,\nfor ever and ever.\nAmen.",
        author: "Jesus Christ",
        category: "traditional",
        tags: ["lord's prayer", "our father", "traditional", "daily"],
        is_active: true,
        usage_count: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: queryInterface.sequelize.literal('gen_random_uuid()'),
        title: "Serenity Prayer",
        content: "God, grant me the serenity to accept the things I cannot change,\ncourage to change the things I can,\nand wisdom to know the difference.",
        author: "Reinhold Niebuhr",
        category: "healing",
        tags: ["serenity", "wisdom", "courage", "acceptance"],
        is_active: true,
        usage_count: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: queryInterface.sequelize.literal('gen_random_uuid()'),
        title: "Morning Prayer",
        content: "Dear Lord, thank you for this new day.\nMay your light guide my steps,\nyour love fill my heart,\nand your peace guard my mind.\nHelp me to be a blessing to others\nand to see your presence in all I meet.\nIn Jesus' name, Amen.",
        author: "Traditional",
        category: "morning",
        tags: ["morning", "daily", "guidance"],
        is_active: true,
        usage_count: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: queryInterface.sequelize.literal('gen_random_uuid()'),
        title: "Evening Prayer",
        content: "Lord, as this day comes to an end,\nI thank you for your presence throughout.\nForgive me for any wrongs I have done,\nand help me to forgive others.\nGrant me peaceful rest tonight,\nand wake me renewed for tomorrow's service.\nIn your holy name, Amen.",
        author: "Traditional",
        category: "evening",
        tags: ["evening", "daily", "rest", "forgiveness"],
        is_active: true,
        usage_count: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: queryInterface.sequelize.literal('gen_random_uuid()'),
        title: "Grace Before Meals",
        content: "Bless us, O Lord, and these thy gifts,\nwhich we are about to receive from thy bounty,\nthrough Christ our Lord. Amen.",
        author: "Traditional",
        category: "meal",
        tags: ["meal", "grace", "thanksgiving", "food"],
        is_active: true,
        usage_count: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('prayers', defaultPrayers);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('prayers');
  }
};
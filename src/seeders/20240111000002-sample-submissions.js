'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const submissions = [
      {
        id: 'd1e2f3a4-b5c6-7890-defg-123456789012',
        type: 'joy',
        content: 'Thank you Lord for the beautiful weather and the opportunity to spend time with family this weekend! We had a wonderful picnic in the park and it reminded me of Your abundant blessings.',
        status: 'approved',
        approvedAt: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        ipHash: 'anonymous001',
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'e2f3a4b5-c6d7-8901-efgh-234567890123',
        type: 'concern',
        content: 'Please pray for healing and comfort for those in our community facing health challenges. Several families are going through difficult medical situations and need our prayers.',
        status: 'approved',
        approvedAt: new Date(now - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        ipHash: 'anonymous002',
        createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'f3a4b5c6-d7e8-9012-fghi-345678901234',
        type: 'testimony',
        content: 'God has been so faithful! After months of uncertainty about my job, He provided a new opportunity that exceeded all my expectations. His timing is perfect!',
        status: 'approved',
        approvedAt: new Date(now - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        ipHash: 'anonymous003',
        createdAt: new Date(now - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'a4b5c6d7-e8f9-0123-ghij-456789012345',
        type: 'joy',
        content: 'Praise God for our church family! The support and love shown during our recent move was overwhelming. Thank you all for being the hands and feet of Jesus.',
        status: 'approved',
        approvedAt: new Date(now - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        ipHash: 'anonymous004',
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'b5c6d7e8-f9a0-1234-hijk-567890123456',
        type: 'concern',
        content: 'My family is facing some difficult decisions regarding elderly care for my parents. Please pray for wisdom, patience, and clarity as we navigate this challenging season.',
        status: 'approved',
        approvedAt: new Date(now - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        ipHash: 'anonymous005',
        createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'c6d7e8f9-a0b1-2345-ijkl-678901234567',
        type: 'testimony',
        content: 'I want to share how God answered prayers for my daughter\'s health. After many doctor visits and uncertainty, we finally received good news. God is our healer!',
        status: 'approved',
        approvedAt: new Date(now - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        ipHash: 'anonymous006',
        createdAt: new Date(now - 11 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 10 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'd7e8f9a0-b1c2-3456-jklm-789012345678',
        type: 'joy',
        content: 'Celebrating 25 years of marriage this week! God has blessed us through ups and downs, and we\'re grateful for His faithfulness in our journey together.',
        status: 'approved',
        approvedAt: new Date(now - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        ipHash: 'anonymous007',
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 4 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'e8f9a0b1-c2d3-4567-klmn-890123456789',
        type: 'concern',
        content: 'Please lift up our youth group as they prepare for their mission trip. Pray for safety, open hearts, and that they would be a blessing to those they serve.',
        status: 'approved',
        approvedAt: new Date(now - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        ipHash: 'anonymous008',
        createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 6 * 24 * 60 * 60 * 1000)
      },
      // Add some pending submissions for admin testing
      {
        id: 'f9a0b1c2-d3e4-5678-lmno-901234567890',
        type: 'joy',
        content: 'Just wanted to share that our small group Bible study has been such a blessing! The fellowship and growth we\'re experiencing is amazing.',
        status: 'pending',
        approvedAt: null,
        ipHash: 'anonymous009',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'a0b1c2d3-e4f5-6789-mnop-012345678901',
        type: 'concern',
        content: 'Struggling with anxiety and depression. Please pray for peace and healing. It\'s been a difficult season.',
        status: 'pending',
        approvedAt: null,
        ipHash: 'anonymous010',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('submissions', submissions, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('submissions', null, {});
  }
};
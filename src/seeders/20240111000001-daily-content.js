'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const contentData = [
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        bibleReading: `John 3:16-17

"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. For God did not send his Son into the world to condemn the world, but to save the world through him."

This beloved passage reminds us of God's incredible love for humanity. It's not just about avoiding punishment, but about receiving the gift of eternal life through faith in Jesus Christ.`,
        
        prayer: `Heavenly Father,

Thank you for Your amazing love that sent Jesus to save us. Help us to truly understand the depth of Your love today. May we share this love with others we meet, showing them the same grace and compassion You have shown us.

Guide our steps today and help us to be a light in this world. Give us strength when we are weak, wisdom when we are confused, and peace when we are troubled.

In Jesus' name we pray,
Amen.`,
        
        hymn: `Amazing Grace

Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.

Through many dangers, toils, and snares,
I have already come;
'Tis grace hath brought me safe thus far,
And grace will lead me home.`,
        
        question: 'How has God\'s grace been evident in your life recently? Take a moment to reflect on the ways, both big and small, that God has shown His love to you.',
        
        hymnVideoUrl: 'https://www.youtube.com/watch?v=CDdvReNKKuk',
        publishDate: new Date(),
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        bibleReading: `Psalm 23:1-6

"The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul. He guides me along the right paths for his name's sake. Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me. You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows. Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the Lord forever."

This psalm of David beautifully illustrates God's care and provision for His people, comparing Him to a loving shepherd who guides, protects, and provides.`,
        
        prayer: `Lord, our Good Shepherd,

Thank you for Your constant care and guidance. When we feel lost or afraid, remind us that You are always with us. Help us to trust in Your leading, even when the path seems unclear.

Give us peace in the midst of life's storms and confidence in Your protection. May we rest in the assurance that Your goodness and love follow us each day.

Lead us beside still waters today and restore our souls.
Amen.`,
        
        hymn: `The Lord's My Shepherd

The Lord's my Shepherd, I'll not want;
He makes me down to lie
In pastures green; He leadeth me
The quiet waters by.

My soul He doth restore again,
And me to walk doth make
Within the paths of righteousness,
E'en for His own name's sake.

Yea, though I walk in death's dark vale,
Yet will I fear no ill;
For Thou art with me, and Thy rod
And staff me comfort still.`,
        
        question: 'In what areas of your life do you need to trust God as your shepherd today? Where do you need His guidance and protection?',
        
        publishDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
        bibleReading: `Philippians 4:6-7

"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."

Paul encourages us to bring our worries to God in prayer. When we do this with thankful hearts, God promises to give us a peace that goes beyond human understanding.`,
        
        prayer: `Father God,

We come before You with all our worries and anxieties. You know the burdens we carry and the fears that keep us awake at night. Help us to release these concerns to You, trusting in Your perfect will and timing.

Fill our hearts with Your peace that surpasses all understanding. Replace our anxiety with faith, our fear with courage, and our doubt with trust.

Thank You for hearing our prayers and for Your faithfulness in all circumstances.
In Jesus' name,
Amen.`,
        
        hymn: `Great Is Thy Faithfulness

Great is Thy faithfulness, O God my Father;
There is no shadow of turning with Thee;
Thou changest not, Thy compassions, they fail not;
As Thou hast been, Thou forever wilt be.

Great is Thy faithfulness! Great is Thy faithfulness!
Morning by morning new mercies I see;
All I have needed Thy hand hath provided;
Great is Thy faithfulness, Lord, unto me!`,
        
        question: 'What anxieties or worries can you surrender to God today? How can you practice gratitude even in the midst of challenges?',
        
        publishDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('daily_contents', contentData, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('daily_contents', null, {});
  }
};
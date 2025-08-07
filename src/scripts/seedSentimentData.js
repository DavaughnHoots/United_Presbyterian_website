#!/usr/bin/env node

// Standalone script to seed sentiment annotation data on Heroku
// Run with: heroku run node src/scripts/seedSentimentData.js

const { sequelize } = require('../config/database');
const { SentimentAnnotation } = require('../models');

async function seedData() {
  try {
    console.log('Starting Bible verse seed for sentiment annotation...');
    
    // Sample of 50 diverse verses for immediate testing
    // Full dataset can be loaded later
    const sampleVerses = [
      { sampleId: 1, bookName: "Genesis", chapter: 1, verse: 1, text: "In the beginning God created the heaven and the earth.", genreName: "Law" },
      { sampleId: 2, bookName: "Genesis", chapter: 3, verse: 15, text: "And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his heel.", genreName: "Law" },
      { sampleId: 3, bookName: "Exodus", chapter: 20, verse: 3, text: "Thou shalt have no other gods before me.", genreName: "Law" },
      { sampleId: 4, bookName: "Leviticus", chapter: 19, verse: 18, text: "Thou shalt not avenge, nor bear any grudge against the children of thy people, but thou shalt love thy neighbour as thyself: I am the LORD.", genreName: "Law" },
      { sampleId: 5, bookName: "Numbers", chapter: 6, verse: 24, text: "The LORD bless thee, and keep thee:", genreName: "Law" },
      { sampleId: 6, bookName: "Deuteronomy", chapter: 6, verse: 5, text: "And thou shalt love the LORD thy God with all thine heart, and with all thy soul, and with all thy might.", genreName: "Law" },
      { sampleId: 7, bookName: "Joshua", chapter: 1, verse: 9, text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.", genreName: "History" },
      { sampleId: 8, bookName: "Judges", chapter: 16, verse: 30, text: "And Samson said, Let me die with the Philistines. And he bowed himself with all his might; and the house fell upon the lords, and upon all the people that were therein. So the dead which he slew at his death were more than they which he slew in his life.", genreName: "History" },
      { sampleId: 9, bookName: "Ruth", chapter: 1, verse: 16, text: "And Ruth said, Intreat me not to leave thee, or to return from following after thee: for whither thou goest, I will go; and where thou lodgest, I will lodge: thy people shall be my people, and thy God my God:", genreName: "History" },
      { sampleId: 10, bookName: "1 Samuel", chapter: 17, verse: 45, text: "Then said David to the Philistine, Thou comest to me with a sword, and with a spear, and with a shield: but I come to thee in the name of the LORD of hosts, the God of the armies of Israel, whom thou hast defied.", genreName: "History" },
      { sampleId: 11, bookName: "2 Samuel", chapter: 7, verse: 22, text: "Wherefore thou art great, O LORD God: for there is none like thee, neither is there any God beside thee, according to all that we have heard with our ears.", genreName: "History" },
      { sampleId: 12, bookName: "1 Kings", chapter: 18, verse: 21, text: "And Elijah came unto all the people, and said, How long halt ye between two opinions? if the LORD be God, follow him: but if Baal, then follow him. And the people answered him not a word.", genreName: "History" },
      { sampleId: 13, bookName: "2 Kings", chapter: 6, verse: 17, text: "And Elisha prayed, and said, LORD, I pray thee, open his eyes, that he may see. And the LORD opened the eyes of the young man; and he saw: and, behold, the mountain was full of horses and chariots of fire round about Elisha.", genreName: "History" },
      { sampleId: 14, bookName: "1 Chronicles", chapter: 16, verse: 11, text: "Seek the LORD and his strength, seek his face continually.", genreName: "History" },
      { sampleId: 15, bookName: "2 Chronicles", chapter: 7, verse: 14, text: "If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from heaven, and will forgive their sin, and will heal their land.", genreName: "History" },
      { sampleId: 16, bookName: "Ezra", chapter: 3, verse: 11, text: "And they sang together by course in praising and giving thanks unto the LORD; because he is good, for his mercy endureth for ever toward Israel. And all the people shouted with a great shout, when they praised the LORD, because the foundation of the house of the LORD was laid.", genreName: "History" },
      { sampleId: 17, bookName: "Nehemiah", chapter: 8, verse: 10, text: "Then he said unto them, Go your way, eat the fat, and drink the sweet, and send portions unto them for whom nothing is prepared: for this day is holy unto our LORD: neither be ye sorry; for the joy of the LORD is your strength.", genreName: "History" },
      { sampleId: 18, bookName: "Esther", chapter: 4, verse: 14, text: "For if thou altogether holdest thy peace at this time, then shall there enlargement and deliverance arise to the Jews from another place; but thou and thy father's house shall be destroyed: and who knoweth whether thou art come to the kingdom for such a time as this?", genreName: "History" },
      { sampleId: 19, bookName: "Job", chapter: 19, verse: 25, text: "For I know that my redeemer liveth, and that he shall stand at the latter day upon the earth:", genreName: "Wisdom" },
      { sampleId: 20, bookName: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want.", genreName: "Wisdom" },
      { sampleId: 21, bookName: "Psalms", chapter: 51, verse: 10, text: "Create in me a clean heart, O God; and renew a right spirit within me.", genreName: "Wisdom" },
      { sampleId: 22, bookName: "Psalms", chapter: 119, verse: 105, text: "Thy word is a lamp unto my feet, and a light unto my path.", genreName: "Wisdom" },
      { sampleId: 23, bookName: "Proverbs", chapter: 3, verse: 5, text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", genreName: "Wisdom" },
      { sampleId: 24, bookName: "Proverbs", chapter: 31, verse: 30, text: "Favour is deceitful, and beauty is vain: but a woman that feareth the LORD, she shall be praised.", genreName: "Wisdom" },
      { sampleId: 25, bookName: "Ecclesiastes", chapter: 3, verse: 1, text: "To every thing there is a season, and a time to every purpose under the heaven:", genreName: "Wisdom" },
      { sampleId: 26, bookName: "Song of Solomon", chapter: 8, verse: 7, text: "Many waters cannot quench love, neither can the floods drown it: if a man would give all the substance of his house for love, it would utterly be contemned.", genreName: "Wisdom" },
      { sampleId: 27, bookName: "Isaiah", chapter: 40, verse: 31, text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", genreName: "Prophets" },
      { sampleId: 28, bookName: "Isaiah", chapter: 53, verse: 5, text: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.", genreName: "Prophets" },
      { sampleId: 29, bookName: "Jeremiah", chapter: 29, verse: 11, text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.", genreName: "Prophets" },
      { sampleId: 30, bookName: "Lamentations", chapter: 3, verse: 22, text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not.", genreName: "Prophets" },
      { sampleId: 31, bookName: "Ezekiel", chapter: 36, verse: 26, text: "A new heart also will I give you, and a new spirit will I put within you: and I will take away the stony heart out of your flesh, and I will give you an heart of flesh.", genreName: "Prophets" },
      { sampleId: 32, bookName: "Daniel", chapter: 3, verse: 17, text: "If it be so, our God whom we serve is able to deliver us from the burning fiery furnace, and he will deliver us out of thine hand, O king.", genreName: "Prophets" },
      { sampleId: 33, bookName: "Hosea", chapter: 6, verse: 6, text: "For I desired mercy, and not sacrifice; and the knowledge of God more than burnt offerings.", genreName: "Prophets" },
      { sampleId: 34, bookName: "Joel", chapter: 2, verse: 28, text: "And it shall come to pass afterward, that I will pour out my spirit upon all flesh; and your sons and your daughters shall prophesy, your old men shall dream dreams, your young men shall see visions:", genreName: "Prophets" },
      { sampleId: 35, bookName: "Micah", chapter: 6, verse: 8, text: "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?", genreName: "Prophets" },
      { sampleId: 36, bookName: "Habakkuk", chapter: 3, verse: 19, text: "The LORD God is my strength, and he will make my feet like hinds' feet, and he will make me to walk upon mine high places. To the chief singer on my stringed instruments.", genreName: "Prophets" },
      { sampleId: 37, bookName: "Malachi", chapter: 3, verse: 10, text: "Bring ye all the tithes into the storehouse, that there may be meat in mine house, and prove me now herewith, saith the LORD of hosts, if I will not open you the windows of heaven, and pour you out a blessing, that there shall not be room enough to receive it.", genreName: "Prophets" },
      { sampleId: 38, bookName: "Matthew", chapter: 5, verse: 16, text: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.", genreName: "Gospels" },
      { sampleId: 39, bookName: "Matthew", chapter: 28, verse: 19, text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost:", genreName: "Gospels" },
      { sampleId: 40, bookName: "Mark", chapter: 16, verse: 15, text: "And he said unto them, Go ye into all the world, and preach the gospel to every creature.", genreName: "Gospels" },
      { sampleId: 41, bookName: "Luke", chapter: 6, verse: 38, text: "Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over, shall men give into your bosom. For with the same measure that ye mete withal it shall be measured to you again.", genreName: "Gospels" },
      { sampleId: 42, bookName: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", genreName: "Gospels" },
      { sampleId: 43, bookName: "Acts", chapter: 1, verse: 8, text: "But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth.", genreName: "Acts" },
      { sampleId: 44, bookName: "Romans", chapter: 8, verse: 28, text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.", genreName: "Epistles" },
      { sampleId: 45, bookName: "1 Corinthians", chapter: 13, verse: 13, text: "And now abideth faith, hope, charity, these three; but the greatest of these is charity.", genreName: "Epistles" },
      { sampleId: 46, bookName: "Galatians", chapter: 5, verse: 22, text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,", genreName: "Epistles" },
      { sampleId: 47, bookName: "Ephesians", chapter: 2, verse: 8, text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:", genreName: "Epistles" },
      { sampleId: 48, bookName: "Philippians", chapter: 4, verse: 13, text: "I can do all things through Christ which strengtheneth me.", genreName: "Epistles" },
      { sampleId: 49, bookName: "2 Timothy", chapter: 3, verse: 16, text: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness:", genreName: "Epistles" },
      { sampleId: 50, bookName: "Revelation", chapter: 21, verse: 4, text: "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.", genreName: "Apocalyptic" }
    ];

    // Add common fields to all verses
    const versesWithDefaults = sampleVerses.map(verse => ({
      ...verse,
      sentiment: null,
      annotatorId: null,
      annotatedAt: null,
      notes: null
    }));

    // Clear existing data
    console.log('Clearing existing sentiment annotations...');
    await SentimentAnnotation.destroy({ where: {} });

    // Bulk insert
    console.log(`Inserting ${versesWithDefaults.length} verses into database...`);
    await SentimentAnnotation.bulkCreate(versesWithDefaults, {
      logging: false
    });

    console.log(`Successfully seeded ${versesWithDefaults.length} verses!`);
    
    // Show distribution
    const genreCount = {};
    versesWithDefaults.forEach(verse => {
      genreCount[verse.genreName] = (genreCount[verse.genreName] || 0) + 1;
    });
    
    console.log('\nDistribution by genre:');
    Object.entries(genreCount).forEach(([genre, count]) => {
      console.log(`  ${genre}: ${count} verses`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding verses:', error);
    process.exit(1);
  }
}

// Run seed
seedData();
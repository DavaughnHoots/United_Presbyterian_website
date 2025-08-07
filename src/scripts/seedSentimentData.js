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
      { sample_id: 1, book_name: "Genesis", chapter: 1, verse: 1, text: "In the beginning God created the heaven and the earth.", genre_name: "Law" },
      { sample_id: 2, book_name: "Genesis", chapter: 3, verse: 15, text: "And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his heel.", genre_name: "Law" },
      { sample_id: 3, book_name: "Exodus", chapter: 20, verse: 3, text: "Thou shalt have no other gods before me.", genre_name: "Law" },
      { sample_id: 4, book_name: "Leviticus", chapter: 19, verse: 18, text: "Thou shalt not avenge, nor bear any grudge against the children of thy people, but thou shalt love thy neighbour as thyself: I am the LORD.", genre_name: "Law" },
      { sample_id: 5, book_name: "Numbers", chapter: 6, verse: 24, text: "The LORD bless thee, and keep thee:", genre_name: "Law" },
      { sample_id: 6, book_name: "Deuteronomy", chapter: 6, verse: 5, text: "And thou shalt love the LORD thy God with all thine heart, and with all thy soul, and with all thy might.", genre_name: "Law" },
      { sample_id: 7, book_name: "Joshua", chapter: 1, verse: 9, text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.", genre_name: "History" },
      { sample_id: 8, book_name: "Judges", chapter: 16, verse: 30, text: "And Samson said, Let me die with the Philistines. And he bowed himself with all his might; and the house fell upon the lords, and upon all the people that were therein. So the dead which he slew at his death were more than they which he slew in his life.", genre_name: "History" },
      { sample_id: 9, book_name: "Ruth", chapter: 1, verse: 16, text: "And Ruth said, Intreat me not to leave thee, or to return from following after thee: for whither thou goest, I will go; and where thou lodgest, I will lodge: thy people shall be my people, and thy God my God:", genre_name: "History" },
      { sample_id: 10, book_name: "1 Samuel", chapter: 17, verse: 45, text: "Then said David to the Philistine, Thou comest to me with a sword, and with a spear, and with a shield: but I come to thee in the name of the LORD of hosts, the God of the armies of Israel, whom thou hast defied.", genre_name: "History" },
      { sample_id: 11, book_name: "2 Samuel", chapter: 7, verse: 22, text: "Wherefore thou art great, O LORD God: for there is none like thee, neither is there any God beside thee, according to all that we have heard with our ears.", genre_name: "History" },
      { sample_id: 12, book_name: "1 Kings", chapter: 18, verse: 21, text: "And Elijah came unto all the people, and said, How long halt ye between two opinions? if the LORD be God, follow him: but if Baal, then follow him. And the people answered him not a word.", genre_name: "History" },
      { sample_id: 13, book_name: "2 Kings", chapter: 6, verse: 17, text: "And Elisha prayed, and said, LORD, I pray thee, open his eyes, that he may see. And the LORD opened the eyes of the young man; and he saw: and, behold, the mountain was full of horses and chariots of fire round about Elisha.", genre_name: "History" },
      { sample_id: 14, book_name: "1 Chronicles", chapter: 16, verse: 11, text: "Seek the LORD and his strength, seek his face continually.", genre_name: "History" },
      { sample_id: 15, book_name: "2 Chronicles", chapter: 7, verse: 14, text: "If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from heaven, and will forgive their sin, and will heal their land.", genre_name: "History" },
      { sample_id: 16, book_name: "Ezra", chapter: 3, verse: 11, text: "And they sang together by course in praising and giving thanks unto the LORD; because he is good, for his mercy endureth for ever toward Israel. And all the people shouted with a great shout, when they praised the LORD, because the foundation of the house of the LORD was laid.", genre_name: "History" },
      { sample_id: 17, book_name: "Nehemiah", chapter: 8, verse: 10, text: "Then he said unto them, Go your way, eat the fat, and drink the sweet, and send portions unto them for whom nothing is prepared: for this day is holy unto our LORD: neither be ye sorry; for the joy of the LORD is your strength.", genre_name: "History" },
      { sample_id: 18, book_name: "Esther", chapter: 4, verse: 14, text: "For if thou altogether holdest thy peace at this time, then shall there enlargement and deliverance arise to the Jews from another place; but thou and thy father's house shall be destroyed: and who knoweth whether thou art come to the kingdom for such a time as this?", genre_name: "History" },
      { sample_id: 19, book_name: "Job", chapter: 19, verse: 25, text: "For I know that my redeemer liveth, and that he shall stand at the latter day upon the earth:", genre_name: "Wisdom" },
      { sample_id: 20, book_name: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want.", genre_name: "Wisdom" },
      { sample_id: 21, book_name: "Psalms", chapter: 51, verse: 10, text: "Create in me a clean heart, O God; and renew a right spirit within me.", genre_name: "Wisdom" },
      { sample_id: 22, book_name: "Psalms", chapter: 119, verse: 105, text: "Thy word is a lamp unto my feet, and a light unto my path.", genre_name: "Wisdom" },
      { sample_id: 23, book_name: "Proverbs", chapter: 3, verse: 5, text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", genre_name: "Wisdom" },
      { sample_id: 24, book_name: "Proverbs", chapter: 31, verse: 30, text: "Favour is deceitful, and beauty is vain: but a woman that feareth the LORD, she shall be praised.", genre_name: "Wisdom" },
      { sample_id: 25, book_name: "Ecclesiastes", chapter: 3, verse: 1, text: "To every thing there is a season, and a time to every purpose under the heaven:", genre_name: "Wisdom" },
      { sample_id: 26, book_name: "Song of Solomon", chapter: 8, verse: 7, text: "Many waters cannot quench love, neither can the floods drown it: if a man would give all the substance of his house for love, it would utterly be contemned.", genre_name: "Wisdom" },
      { sample_id: 27, book_name: "Isaiah", chapter: 40, verse: 31, text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", genre_name: "Prophets" },
      { sample_id: 28, book_name: "Isaiah", chapter: 53, verse: 5, text: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.", genre_name: "Prophets" },
      { sample_id: 29, book_name: "Jeremiah", chapter: 29, verse: 11, text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.", genre_name: "Prophets" },
      { sample_id: 30, book_name: "Lamentations", chapter: 3, verse: 22, text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not.", genre_name: "Prophets" },
      { sample_id: 31, book_name: "Ezekiel", chapter: 36, verse: 26, text: "A new heart also will I give you, and a new spirit will I put within you: and I will take away the stony heart out of your flesh, and I will give you an heart of flesh.", genre_name: "Prophets" },
      { sample_id: 32, book_name: "Daniel", chapter: 3, verse: 17, text: "If it be so, our God whom we serve is able to deliver us from the burning fiery furnace, and he will deliver us out of thine hand, O king.", genre_name: "Prophets" },
      { sample_id: 33, book_name: "Hosea", chapter: 6, verse: 6, text: "For I desired mercy, and not sacrifice; and the knowledge of God more than burnt offerings.", genre_name: "Prophets" },
      { sample_id: 34, book_name: "Joel", chapter: 2, verse: 28, text: "And it shall come to pass afterward, that I will pour out my spirit upon all flesh; and your sons and your daughters shall prophesy, your old men shall dream dreams, your young men shall see visions:", genre_name: "Prophets" },
      { sample_id: 35, book_name: "Micah", chapter: 6, verse: 8, text: "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?", genre_name: "Prophets" },
      { sample_id: 36, book_name: "Habakkuk", chapter: 3, verse: 19, text: "The LORD God is my strength, and he will make my feet like hinds' feet, and he will make me to walk upon mine high places. To the chief singer on my stringed instruments.", genre_name: "Prophets" },
      { sample_id: 37, book_name: "Malachi", chapter: 3, verse: 10, text: "Bring ye all the tithes into the storehouse, that there may be meat in mine house, and prove me now herewith, saith the LORD of hosts, if I will not open you the windows of heaven, and pour you out a blessing, that there shall not be room enough to receive it.", genre_name: "Prophets" },
      { sample_id: 38, book_name: "Matthew", chapter: 5, verse: 16, text: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.", genre_name: "Gospels" },
      { sample_id: 39, book_name: "Matthew", chapter: 28, verse: 19, text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost:", genre_name: "Gospels" },
      { sample_id: 40, book_name: "Mark", chapter: 16, verse: 15, text: "And he said unto them, Go ye into all the world, and preach the gospel to every creature.", genre_name: "Gospels" },
      { sample_id: 41, book_name: "Luke", chapter: 6, verse: 38, text: "Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over, shall men give into your bosom. For with the same measure that ye mete withal it shall be measured to you again.", genre_name: "Gospels" },
      { sample_id: 42, book_name: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", genre_name: "Gospels" },
      { sample_id: 43, book_name: "Acts", chapter: 1, verse: 8, text: "But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth.", genre_name: "Acts" },
      { sample_id: 44, book_name: "Romans", chapter: 8, verse: 28, text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.", genre_name: "Epistles" },
      { sample_id: 45, book_name: "1 Corinthians", chapter: 13, verse: 13, text: "And now abideth faith, hope, charity, these three; but the greatest of these is charity.", genre_name: "Epistles" },
      { sample_id: 46, book_name: "Galatians", chapter: 5, verse: 22, text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,", genre_name: "Epistles" },
      { sample_id: 47, book_name: "Ephesians", chapter: 2, verse: 8, text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:", genre_name: "Epistles" },
      { sample_id: 48, book_name: "Philippians", chapter: 4, verse: 13, text: "I can do all things through Christ which strengtheneth me.", genre_name: "Epistles" },
      { sample_id: 49, book_name: "2 Timothy", chapter: 3, verse: 16, text: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness:", genre_name: "Epistles" },
      { sample_id: 50, book_name: "Revelation", chapter: 21, verse: 4, text: "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.", genre_name: "Apocalyptic" }
    ];

    // Add common fields to all verses
    const versesWithDefaults = sampleVerses.map(verse => ({
      ...verse,
      sentiment: null,
      annotator_id: null,
      annotated_at: null,
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
      genreCount[verse.genre_name] = (genreCount[verse.genre_name] || 0) + 1;
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
C:\Users\Owner\Documents\GitHub\United_Presbyterian_website\base_plan.md

# Building a Mobile-Optimized Church Website on Heroku: Complete Implementation Guide

Building a feature-rich church website within a $12-20/month budget on Heroku is not only feasible but can deliver a professional, mobile-first experience with all your required features. This comprehensive research reveals the optimal technical stack, implementation strategies, and architectural decisions needed to create a modern church platform that serves both congregation needs and administrative requirements.

## Infrastructure and budget optimization

The most cost-effective Heroku configuration for your church website combines an **Eco dyno ($5/month)** with **Heroku Postgres Essential-0 ($5/month)**, totaling just $10/month. This leaves $2-10 in your budget for additional services while providing reliable hosting. The Eco dyno's sleep behavior after 30 minutes of inactivity actually benefits church websites, which typically see concentrated traffic around service times and daily devotional periods.

For database selection, **Heroku Postgres Essential-0** proves superior to MongoDB Atlas for this use case. It offers robust SQL support essential for user management, content scheduling, and anonymous submissions, while maintaining 99.5% uptime. The relational structure efficiently handles the interconnected data relationships between users, daily content, and progress tracking.

## Custom authentication system implementation

Your unique passwordless authentication requirement—generating emails in the format `firstnamelastname[number]@upc.com`—offers an elegant solution for church member access without password complexity. The implementation uses a progressive numbering system to handle duplicate names:

```javascript
async function generateUniqueEmailWithDB(firstName, lastName, User) {
  let counter = 0;
  let email;
  let existingUser;
  
  do {
    email = counter === 0 
      ? `${firstName.toLowerCase()}${lastName.toLowerCase()}@upc.com`
      : `${firstName.toLowerCase()}${lastName.toLowerCase()}${counter}@upc.com`;
    
    existingUser = await User.findOne({ email });
    counter++;
  } while (existingUser);
  
  return email;
}
```

**Traditional session management** proves more suitable than JWT tokens for this application, offering easier revocation, server-side control, and simpler implementation. Express sessions with MongoDB storage provide robust user tracking while maintaining security through httpOnly cookies and proper session timeouts.

## Automated content delivery architecture

The daily content rotation system requires careful orchestration to deliver fresh Bible readings, prayers, music, and questions each day. **Agenda.js** emerges as the optimal scheduling solution, offering MongoDB persistence and job retry capabilities crucial for reliable content updates:

```javascript
const Agenda = require('agenda');
const agenda = new Agenda({db: {address: 'mongodb://localhost/agenda'}});

agenda.define('update daily content', async (job) => {
  const selectedContent = await contentRotationManager.selectDailyContent();
  await saveDailyContentLog(selectedContent);
  await updateUsageTracking(selectedContent);
});

agenda.every('0 6 * * *', 'update daily content');
```

The content selection algorithm employs weighted random selection based on themes, seasons, and usage history, ensuring variety while maintaining thematic coherence. Weekly themes guide daily selections, with special consideration for liturgical seasons and church calendar events.

## Mobile-first design implementation

Drawing inspiration from disciples.org's clean Presbyterian aesthetic and Hallow.com's app-like simplicity, the mobile design strategy centers on **Tailwind CSS** for maximum flexibility. This utility-first framework enables custom designs without framework constraints while maintaining small production bundle sizes through automatic purging of unused styles.

Touch optimization requires careful attention to target sizes—minimum 44x44 pixels for iOS and 48x48 pixels for Android—with adequate 8px spacing between interactive elements. The responsive video container implementation ensures YouTube embeds adapt seamlessly across devices:

```css
.responsive-video-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
}

.responsive-video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

## YouTube integration strategy

For video content delivery, **iframe embedding** provides the optimal balance of simplicity and functionality. While the YouTube API offers more control, iframe embedding avoids rate limits and complexity while delivering excellent mobile support. The implementation includes responsive containers and modest branding options to maintain a professional appearance.

## Anonymous submission security

The anonymous submission system for joys, concerns, and testimonies requires sophisticated security measures while maintaining true anonymity. The architecture employs multiple defense layers:

**Rate limiting** prevents abuse by allowing only 3 submissions per 15-minute window, using browser fingerprinting rather than IP addresses for identification. **Google reCAPTCHA v3** provides invisible bot protection, while content sanitization with DOMPurify prevents XSS attacks.

The database schema deliberately excludes any identifying information:

```javascript
const AnonymousSubmissionSchema = new mongoose.Schema({
  type: { type: String, enum: ['joy', 'concern', 'testimony'] },
  content: { type: String, maxLength: 2000 },
  submittedAt: { type: Date, default: Date.now, expires: '365d' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'] },
  contentHash: String // For duplicate detection without storing IP
});
```

Automated moderation flags potentially problematic content for human review, checking for profanity, excessive URLs, and spam patterns. This multi-layer approach balances openness with protection against abuse.

## Progress tracking and user engagement

User progress tracking enhances engagement by showing members their spiritual journey through consumed content. The system tracks completion status, time spent, and maintains streaks to encourage daily participation. The MongoDB schema efficiently stores progress data while enabling quick queries for dashboard displays:

```javascript
progress: {
  contentItems: [{
    contentId: ObjectId,
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'] },
    progressPercentage: Number,
    timeSpent: Number,
    completedAt: Date
  }],
  currentStreak: Number,
  longestStreak: Number
}
```

## Performance optimization techniques

Mobile performance requires aggressive optimization strategies. **Sharp.js** handles server-side image optimization, automatically resizing and compressing images based on device requirements. Lazy loading with Intersection Observer defers image loading until needed, significantly improving initial page load times.

JavaScript bundle optimization through Webpack code splitting separates vendor libraries from application code, enabling efficient caching. The hybrid rendering approach serves critical pages server-side for SEO while using client-side updates for dynamic content.

## Implementation roadmap

Starting with the ultra-budget configuration at $10/month allows immediate deployment while leaving room for growth. The Eco dyno with Heroku Postgres Essential-0 provides a solid foundation that can scale as the congregation grows. Initial deployment focuses on core features—authentication, daily content, and basic submissions—before adding advanced capabilities like detailed analytics and comprehensive moderation tools.

## Conclusion

This architecture delivers a sophisticated church website within your $12-20/month budget by leveraging Heroku's platform efficiently and implementing smart technical choices. The passwordless authentication system simplifies access for congregation members, while the automated content rotation ensures fresh daily spiritual resources. Mobile-first design with PWA capabilities provides an app-like experience without development complexity, and robust security measures protect anonymous submissions while maintaining true privacy. Most importantly, the solution scales gracefully—starting at just $10/month but ready to grow with your church's digital ministry needs.
// Test server without database requirement
require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.google.com", "https://www.gstatic.com", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "https://images.unsplash.com", "https://i.ytimg.com", "https://img.youtube.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com", "https://www.google.com", "https://youtube.com", "https://youtu.be"],
      mediaSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://youtu.be", "https:", "blob:"],
      connectSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com", "https://images.unsplash.com", "https://www.youtube.com", "https://youtube.com"]
    }
  }
}));

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mock session middleware
app.use((req, res, next) => {
  req.session = {
    user: null,
    destroy: (cb) => cb && cb()
  };
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Basic routes without database
app.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'United Presbyterian Church',
    user: req.session.user
  });
});

app.get('/daily', (req, res) => {
  res.render('pages/daily-content', {
    title: 'Daily Spiritual Content',
    user: req.session.user,
    content: {
      reading: {
        passage: 'John 3:16',
        content: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'
      },
      prayer: {
        content: 'Lord, we come before you today with grateful hearts. Guide us in your wisdom and fill us with your peace. Amen.'
      },
      music: {
        title: 'Amazing Grace',
        youtubeId: 'CDdvReNKKuk'
      },
      question: {
        content: 'How has God shown His love to you today?'
      }
    }
  });
});

app.get('/share', (req, res) => {
  res.render('pages/submissions', {
    title: 'Share Your Heart',
    user: req.session.user
  });
});

app.get('/about', (req, res) => {
  res.render('pages/about', {
    title: 'About United Presbyterian Church',
    user: req.session.user
  });
});

app.get('/auth/login', (req, res) => {
  res.render('pages/login', {
    title: 'Login',
    user: null,
    error: req.query.error,
    registered: req.query.registered
  });
});

app.get('/auth/register', (req, res) => {
  res.render('pages/register', {
    title: 'Register',
    user: null,
    error: req.query.error
  });
});

// Mock API endpoints
app.post('/api/submissions', (req, res) => {
  res.json({ success: true, message: 'Your submission has been received (test mode).' });
});

// Error handling
app.use((req, res) => {
  res.status(404).render('pages/404', { 
    title: '404 - Page Not Found',
    user: req.session.user 
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/500', { 
    title: '500 - Server Error',
    user: req.session.user,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Test server running at http://localhost:${PORT}
📝 This is a test version without database requirements
🎨 All pages should be accessible for UI testing
  `);
});
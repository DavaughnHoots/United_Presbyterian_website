# United Presbyterian Church Website

A modern, mobile-first church website featuring daily spiritual content, anonymous prayer submissions, and community engagement tools. Built with Node.js and designed to run on Heroku within a $10/month budget.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Heroku](https://img.shields.io/badge/deployment-Heroku-purple.svg)

## 🌟 Features

### Core Features
- **📱 Mobile-First Design** - Beautiful, responsive design with a heavenly cloud-blue theme
- **🔐 Passwordless Authentication** - Simple email-based login (firstnamelastname@upc.com format)
- **📖 Daily Spiritual Content** - Automated rotation of Bible readings, prayers, hymns, and reflection questions
- **🙏 Anonymous Submissions** - Secure system for sharing joys, concerns, and testimonies
- **📊 Progress Tracking** - Personal spiritual journey tracking with streaks and completion stats
- **🎥 YouTube Integration** - Embedded worship videos and hymns

### Design Features
- Heavenly cloud-blue gradient theme
- Modular card-based interface
- Touch-optimized for mobile devices
- Progressive Web App capabilities
- Accessible and inclusive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Heroku account (optional for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/United_Presbyterian_website.git
   cd United_Presbyterian_website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb upc_database
   
   # Run migrations
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Visit** http://localhost:3000

### Quick Test (No Database)
```bash
npm run test:ui
```

## 🏗️ Project Structure

```
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models (Sequelize)
│   ├── routes/         # Express routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── server.js       # Main application file
├── public/
│   ├── css/           # Stylesheets
│   ├── js/            # Client-side JavaScript
│   └── images/        # Static images
├── views/
│   ├── layouts/       # EJS layouts
│   ├── partials/      # Reusable components
│   └── pages/         # Page templates
└── migrations/        # Database migrations
```

## 🚢 Deployment to Heroku

### One-Click Deploy
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Manual Deployment

1. **Create a Heroku app**
   ```bash
   heroku create your-church-name
   ```

2. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:essential-0
   ```

3. **Set environment variables**
   ```bash
   heroku config:set SESSION_SECRET=your-secret-key
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Run migrations**
   ```bash
   heroku run npm run migrate
   ```

## 💰 Budget Breakdown

- **Heroku Eco Dyno**: $5/month
- **Heroku Postgres Essential-0**: $5/month
- **Total**: $10/month

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Secret for session encryption | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port (default: 3000) | No |
| `RECAPTCHA_SITE_KEY` | Google reCAPTCHA v3 site key | No |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v3 secret | No |

### Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - Church member accounts
- `content` - Spiritual content (readings, prayers, etc.)
- `submissions` - Anonymous prayer requests and testimonies
- `progress` - User engagement tracking
- `daily_content` - Daily content rotation schedule

## 📱 Progressive Web App

The site includes PWA capabilities:
- Installable on mobile devices
- Offline support (coming soon)
- Push notifications (planned)

## 🛡️ Security Features

- Passwordless authentication
- Session-based security
- Rate limiting on submissions
- Content sanitization
- HTTPS enforcement in production
- Anonymous submission privacy

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by modern church app designs
- Built with love for the United Presbyterian Church community
- Thanks to all contributors and testers

## 📞 Support

For support, email support@upc.com or open an issue in this repository.

---

**Made with ❤️ for United Presbyterian Church**
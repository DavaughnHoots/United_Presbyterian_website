const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create transporter with Gmail or SMTP settings
    // In production, use environment variables for credentials
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Send welcome email with UPC Access credentials
   */
  async sendWelcomeEmail(user, personalEmail) {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"United Presbyterian Church" <noreply@upc.com>',
      to: personalEmail,
      subject: 'Welcome to United Presbyterian Church - Your UPC Access Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #87CEEB 0%, #B6E5F8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Welcome to UPC!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2C5282; margin-bottom: 20px;">Hello ${user.firstName}!</h2>
            
            <p style="color: #4A5568; line-height: 1.6;">
              Thank you for joining our church community! We're excited to have you as part of our family.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #E2E8F0;">
              <h3 style="color: #2C5282; margin-top: 0;">Your UPC Access Account</h3>
              <p style="margin: 10px 0;"><strong>Email:</strong> <span style="color: #4299E1; font-family: monospace;">${user.email}</span></p>
              <p style="color: #718096; font-size: 14px; margin-top: 15px;">
                This is your unique UPC email address. Use it to sign in to your account - no password needed!
              </p>
            </div>
            
            <div style="background: #FEF5E7; padding: 15px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #F39C12;">
              <h4 style="color: #D68910; margin-top: 0;">How to Sign In:</h4>
              <ol style="color: #6C757D; line-height: 1.8; margin: 10px 0;">
                <li>Go to our website</li>
                <li>Click "Login"</li>
                <li>Enter your UPC email: <strong>${user.email}</strong></li>
                <li>Click "Sign In" - that's it!</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL || 'https://upcp-ad5530d1035c.herokuapp.com'}/auth/login" 
                 style="display: inline-block; background: linear-gradient(135deg, #87CEEB 0%, #B6E5F8 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; 
                        font-weight: bold; text-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                Sign In Now
              </a>
            </div>
            
            <p style="color: #718096; font-size: 14px; margin-top: 30px; text-align: center;">
              If you have any questions, please don't hesitate to reach out to us.<br>
              God bless you!
            </p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent to:', personalEmail);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error - email failure shouldn't block registration
      return false;
    }
  }

  /**
   * Send login reminder email
   */
  async sendLoginReminder(user, personalEmail) {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"United Presbyterian Church" <noreply@upc.com>',
      to: personalEmail,
      subject: 'Your UPC Access Login Information',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #87CEEB 0%, #B6E5F8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">UPC Access Login</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2C5282; margin-bottom: 20px;">Hi ${user.firstName}!</h2>
            
            <p style="color: #4A5568; line-height: 1.6;">
              Here's your UPC Access login information:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 10px 0;">Your UPC Email:</p>
              <p style="font-size: 20px; color: #4299E1; font-family: monospace; font-weight: bold;">${user.email}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL || 'https://upcp-ad5530d1035c.herokuapp.com'}/auth/login" 
                 style="display: inline-block; background: linear-gradient(135deg, #87CEEB 0%, #B6E5F8 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; 
                        font-weight: bold; text-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                Sign In to Your Account
              </a>
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Login reminder sent to:', personalEmail);
      return true;
    } catch (error) {
      console.error('Error sending login reminder:', error);
      return false;
    }
  }

  /**
   * Send daily content reminder email
   */
  async sendDailyReminder(user, content) {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"United Presbyterian Church" <noreply@upc.com>',
      to: user.personalEmail,
      subject: `Daily Spiritual Content - ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #87CEEB 0%, #B6E5F8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Daily Spiritual Journey</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #4A5568; margin-bottom: 20px;">Good morning ${user.firstName}!</p>
            
            ${content.bibleReading ? `
              <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #87CEEB;">
                <h3 style="color: #2C5282; margin-top: 0;">📖 Today's Reading</h3>
                <p style="color: #4A5568; line-height: 1.6;">${content.bibleReading}</p>
              </div>
            ` : ''}
            
            ${content.prayer ? `
              <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #B6E5F8;">
                <h3 style="color: #2C5282; margin-top: 0;">🙏 Morning Prayer</h3>
                <p style="color: #4A5568; line-height: 1.6;">${content.prayer}</p>
              </div>
            ` : ''}
            
            ${content.hymn ? `
              <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #87CEEB;">
                <h3 style="color: #2C5282; margin-top: 0;">🎵 Hymn of the Day</h3>
                <p style="color: #4A5568; line-height: 1.6;">${content.hymn}</p>
              </div>
            ` : ''}
            
            ${content.question ? `
              <div style="background: #FEF5E7; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #F39C12;">
                <h3 style="color: #D68910; margin-top: 0;">💭 Question for Reflection</h3>
                <p style="color: #6C757D; line-height: 1.6;">${content.question}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL || 'https://upcp-ad5530d1035c.herokuapp.com'}/daily" 
                 style="display: inline-block; background: linear-gradient(135deg, #87CEEB 0%, #B6E5F8 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; 
                        font-weight: bold; text-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                View Full Content & Track Progress
              </a>
            </div>
            
            <p style="color: #718096; font-size: 12px; margin-top: 30px; text-align: center;">
              You're receiving this because you opted in to daily reminders.<br>
              <a href="${process.env.APP_URL || 'https://upcp-ad5530d1035c.herokuapp.com'}/profile/settings" style="color: #4299E1;">Update your preferences</a>
            </p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Daily reminder sent to:', user.personalEmail);
      return true;
    } catch (error) {
      console.error('Error sending daily reminder:', error);
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
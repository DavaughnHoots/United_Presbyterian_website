const { User } = require('../models');
const { Op } = require('sequelize');

class AuthService {
  /**
   * Generate a unique email address for a user
   * Format: firstnamelastname@upc.com
   * If taken, append numbers: firstnamelastname2@upc.com
   */
  static async generateUniqueEmail(firstName, lastName) {
    // Clean and format names
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const baseEmail = `${cleanFirst}${cleanLast}@upc.com`;
    
    // Check if base email is available
    const existingUser = await User.findOne({ where: { email: baseEmail } });
    if (!existingUser) {
      return baseEmail;
    }
    
    // Find the next available number
    let counter = 2;
    while (true) {
      const numberedEmail = `${cleanFirst}${cleanLast}${counter}@upc.com`;
      const exists = await User.findOne({ where: { email: numberedEmail } });
      if (!exists) {
        return numberedEmail;
      }
      counter++;
      
      // Safety check to prevent infinite loop
      if (counter > 999) {
        throw new Error('Unable to generate unique email');
      }
    }
  }

  /**
   * Register a new user
   */
  static async register(firstName, lastName, personalEmail = null) {
    try {
      // Validate input
      if (!firstName || !lastName) {
        throw new Error('First name and last name are required');
      }
      
      // Generate unique email
      const email = await this.generateUniqueEmail(firstName, lastName);
      
      // Create user
      const user = await User.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        personalEmail: personalEmail ? personalEmail.trim() : null,
        isActive: true
      });
      
      // Send welcome email if personal email provided
      if (personalEmail) {
        const emailService = require('./emailService');
        await emailService.sendWelcomeEmail(user, personalEmail);
      }
      
      return {
        success: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          personalEmail: user.personalEmail
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Login user with email only (passwordless)
   */
  static async login(email) {
    try {
      // Validate email
      if (!email || !email.includes('@upc.com')) {
        throw new Error('Please enter a valid @upc.com email address');
      }
      
      // Find user
      const user = await User.findOne({ 
        where: { 
          email: email.toLowerCase(),
          isActive: true 
        } 
      });
      
      if (!user) {
        throw new Error('Email not found. Please check your email or register first.');
      }
      
      // Update last active date for streak tracking
      await user.updateStreak();
      
      return {
        success: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isAdmin: user.isAdmin,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create session for user
   */
  static createSession(req, user) {
    req.session.user = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin || false
    };
    req.session.save();
  }

  /**
   * Destroy user session
   */
  static destroySession(req) {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(req) {
    return req.session && req.session.user;
  }

  /**
   * Check if user is admin
   */
  static isAdmin(req) {
    return req.session && req.session.user && req.session.user.isAdmin;
  }
}

module.exports = AuthService;
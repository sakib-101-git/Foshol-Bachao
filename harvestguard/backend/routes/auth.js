// Authentication routes - register, login
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken, authMiddleware } = require('../utils/jwt');

const router = express.Router();

// Initialize with db passed from main app
module.exports = function(db) {
  
  /**
   * POST /api/auth/register
   * Register a new farmer account
   */
  router.post('/register', async (req, res) => {
    try {
      const { email, phone, password, name, preferredLanguage = 'bn' } = req.body;
      
      console.log('Registration attempt:', { email, name });
      
      // Basic validation
      if (!email || !password || !name) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          errorBn: 'প্রয়োজনীয় তথ্য অনুপস্থিত'
        });
      }
      
      // Ensure database structure exists
      if (!db.data) {
        db.data = { users: [], batches: [], badges: [], lossEvents: [] };
      }
      if (!db.data.users) {
        db.data.users = [];
      }
      
      // Check if user exists
      const users = db.data.users || [];
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        return res.status(400).json({ 
          error: 'Email already registered',
          errorBn: 'এই ইমেইল ইতিমধ্যে নিবন্ধিত'
        });
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Create user
      const newUser = {
        id: uuidv4(),
        email,
        phone: phone || '',
        passwordHash,
        name,
        preferredLanguage,
        createdAt: new Date().toISOString()
      };
      
      db.data.users.push(newUser);
      await db.write();
      
      console.log('User registered successfully:', email);
      
      // Generate token
      const token = generateToken(newUser);
      
      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json({
        message: 'Registration successful',
        messageBn: 'নিবন্ধন সফল হয়েছে',
        token,
        user: userWithoutPassword
      });
      
    } catch (err) {
      console.error('Register error:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({ 
        error: 'Server error',
        message: err.message 
      });
    }
  });
  
  /**
   * POST /api/auth/login
   * Login with email and password
   */
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log('Login attempt:', { email, hasPassword: !!password });
      
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password required',
          errorBn: 'ইমেইল এবং পাসওয়ার্ড প্রয়োজন'
        });
      }
      
      // Ensure database structure exists
      if (!db.data) {
        db.data = { users: [], batches: [], badges: [], lossEvents: [] };
      }
      if (!db.data.users) {
        db.data.users = [];
      }
      
      let user; // Declare user variable outside if/else blocks
      
      // Special case: demo account - create if doesn't exist and allow login
      if (email === 'demo@harvestguard.com' && password === 'demo123') {
        console.log('Demo login attempt detected');
        let users = db.data.users || [];
        user = users.find(u => u.email === email);
        
        // Create demo user if doesn't exist
        if (!user) {
          console.log('Creating demo user...');
          try {
            const passwordHash = await hashPassword('demo123');
            user = {
              id: 'demo-farmer-001',
              email: 'demo@harvestguard.com',
              phone: '+8801712345678',
              passwordHash: passwordHash,
              name: 'Demo Farmer',
              preferredLanguage: 'bn',
              createdAt: new Date().toISOString()
            };
            users.push(user);
            db.data.users = users;
            await db.write();
            console.log('Demo user created successfully');
          } catch (dbError) {
            console.error('Error creating demo user:', dbError);
            return res.status(500).json({ 
              error: 'Failed to create demo user',
              details: dbError.message 
            });
          }
        } else {
          console.log('Demo user already exists');
        }
        
        // Allow demo login without checking hash
      } else {
        // Find user for other accounts
        const users = db.data.users || [];
        user = users.find(u => u.email === email);
        
        if (!user) {
          console.log('User not found:', email);
          return res.status(401).json({ 
            error: 'Invalid credentials',
            errorBn: 'ভুল তথ্য'
          });
        }
        
        // Check password for all other accounts
        const isValid = await comparePassword(password, user.passwordHash);
        
        if (!isValid) {
          console.log('Password invalid for:', email);
          return res.status(401).json({ 
            error: 'Invalid credentials',
            errorBn: 'ভুল তথ্য'
          });
        }
      }
      
      // Generate token (user is now accessible here)
      if (!user) {
        console.error('User is null after login logic');
        return res.status(500).json({ error: 'Login failed - user not found' });
      }
      
      console.log('Generating token for user:', user.email);
      const token = generateToken(user);
      
      // Return user without password
      const { passwordHash: _, ...userWithoutPassword } = user;
      
      console.log('Login successful for:', email);
      res.json({
        message: 'Login successful',
        messageBn: 'লগইন সফল',
        token,
        user: userWithoutPassword
      });
      
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({ 
        error: 'Server error',
        message: err.message 
      });
    }
  });
  
  /**
   * GET /api/auth/me
   * Get current user info (requires auth)
   */
  router.get('/me', authMiddleware, async (req, res) => {
    try {
      const users = db.data.users || [];
      const user = users.find(u => u.id === req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
      
    } catch (err) {
      console.error('Get user error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  return router;
};


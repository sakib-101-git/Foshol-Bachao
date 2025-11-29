/**
 * Backend Server - Express.js API Server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Load environment variables (create .env file with JWT_SECRET, etc.)
require('dotenv').config();

// Dynamic import for lowdb (ESM module)
let db;

async function initDB() {
  const { Low } = await import('lowdb');
  const { JSONFile } = await import('lowdb/node');
  
  const dbPath = path.join(__dirname, 'db', 'db.json');
  const adapter = new JSONFile(dbPath);
  db = new Low(adapter, { users: [], batches: [], badges: [], lossEvents: [] });
  
  await db.read();
  
  // Initialize data structure if empty
  db.data ||= { users: [], batches: [], badges: [], lossEvents: [] };
  db.data.users ||= [];
  db.data.batches ||= [];
  db.data.badges ||= [];
  db.data.lossEvents ||= [];
  
  await db.write();
  console.log('Database initialized');
}

async function startServer() {
  await initDB();
  
  const app = express();
  const PORT = process.env.PORT || 3001;
  
  // Middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  // CORS configuration - allow frontend origins
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];
  
  app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list or matches vercel/render patterns
      if (allowedOrigins.includes(origin) || 
          origin.endsWith('.vercel.app') || 
          origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      
      callback(null, true); // Allow all for now (hackathon demo)
    },
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));
  
  // Request logging (simple)
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
  
  // Routes
  try {
    const authRoutes = require('./routes/auth')(db);
    const batchRoutes = require('./routes/batches')(db);
    const weatherRoutes = require('./routes/weather')(db);
    const exportRoutes = require('./routes/export')(db);
    const scannerRoutes = require('./routes/scanner')(db);
    
    app.use('/api/auth', authRoutes);
    app.use('/api/batches', batchRoutes);
    app.use('/api/weather', weatherRoutes);
    app.use('/api/export', exportRoutes);
    
    console.log('📷 Mounting scanner routes...');
    console.log('Scanner routes type:', typeof scannerRoutes);
    console.log('Scanner routes:', scannerRoutes);
    app.use('/api/scanner', scannerRoutes);
    console.log('✅ Scanner routes mounted at /api/scanner');
    
    console.log('✅ All routes registered, including /api/scanner');
  } catch (err) {
    console.error('❌ Error loading routes:', err);
    throw err;
  }
  
  // Sync endpoint (uses batch routes)
  app.post('/api/sync', require('./utils/jwt').authMiddleware, async (req, res) => {
    // Re-use batch sync logic
    const { unsyncedBatches = [] } = req.body;
    const { v4: uuidv4 } = require('uuid');
    const syncedIds = [];
    
    for (const batch of unsyncedBatches) {
      const existing = db.data.batches.find(b => b.id === batch.id);
      
      if (existing) {
        Object.assign(existing, batch, { synced: true });
      } else {
        db.data.batches.push({
          ...batch,
          userId: req.user.id,
          synced: true
        });
      }
      syncedIds.push(batch.id);
    }
    
    await db.write();
    
    res.json({
      message: 'Sync successful',
      messageBn: 'সিঙ্ক সফল',
      syncedIds
    });
  });
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'HarvestGuard API is running'
    });
  });
  
  // Favicon handler - prevent 404 errors
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content
  });
  
  // Scanner routes - Direct implementation to avoid router issues
  const axios = require('axios');
  const { authMiddleware } = require('./utils/jwt');
  const HF_TOKEN = process.env.HF_TOKEN || process.env.VITE_HF_TOKEN;
  const HF_API_URL = "https://api-inference.huggingface.co/models/Mozilla-MobileNetV2-PlantDisease";
  
  app.get('/api/scanner/health', (req, res) => {
    console.log('✅ /api/scanner/health endpoint hit!');
    res.json({ 
      status: 'ok',
      hasToken: !!HF_TOKEN,
      message: 'Scanner service is working'
    });
  });
  
  console.log('✅ Scanner routes registered: /api/scanner/health, /api/scanner/analyze');
  
  app.post('/api/scanner/analyze', authMiddleware, async (req, res) => {
    try {
      if (!HF_TOKEN) {
        return res.status(500).json({ error: 'Hugging Face token not configured' });
      }

      let imageBuffer;
      if (req.body && req.body.image) {
        const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      console.log('Analyzing image with Hugging Face API...');
      const response = await axios.post(HF_API_URL, imageBuffer, {
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/octet-stream'
        },
        responseType: 'json',
        validateStatus: () => true
      });

      if (response.status === 503) {
        return res.status(503).json({
          error: 'Model is loading',
          estimated_time: response.data?.estimated_time || 30
        });
      }

      if (response.status !== 200) {
        return res.status(response.status).json({
          error: `API error: ${response.status}`,
          details: response.data
        });
      }

      if (response.data.error) {
        return res.status(500).json({ error: response.data.error });
      }

      res.json({ results: response.data });
    } catch (err) {
      console.error('Scanner error:', err.message);
      res.status(500).json({ 
        error: 'Failed to analyze image',
        message: err.message 
      });
    }
  });
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  
  // Error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
  
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║     🌾 HarvestGuard Backend Server 🌾      ║
╠═══════════════════════════════════════════╣
║  Running on: http://localhost:${PORT}         ║
║  API Docs:   /api/health                  ║
║                                           ║
║  Demo Login:                              ║
║  Email: demo@harvestguard.com             ║
║  Password: demo123                        ║
╚═══════════════════════════════════════════╝
    `);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});


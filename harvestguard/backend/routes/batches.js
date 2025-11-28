// Batch management routes - CRUD for crop batches
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../utils/jwt');

const router = express.Router();

module.exports = function(db) {
  
  /**
   * GET /api/batches
   * Get all batches for current user
   */
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const batches = db.data.batches || [];
      const userBatches = batches.filter(b => b.userId === req.user.id);
      
      res.json({ batches: userBatches });
    } catch (err) {
      console.error('Get batches error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
   * GET /api/batches/:id
   * Get single batch by ID
   */
  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const batches = db.data.batches || [];
      const batch = batches.find(b => b.id === req.params.id && b.userId === req.user.id);
      
      if (!batch) {
        return res.status(404).json({ error: 'Batch not found' });
      }
      
      res.json({ batch });
    } catch (err) {
      console.error('Get batch error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
   * POST /api/batches
   * Create a new batch
   */
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { 
        cropType, 
        estimatedWeightKg, 
        harvestDate, 
        division, 
        district, 
        upazila, 
        storageType, 
        notes = '' 
      } = req.body;
      
      // Validate required fields
      if (!cropType || !estimatedWeightKg || !harvestDate || !division || !district || !storageType) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          errorBn: 'প্রয়োজনীয় তথ্য অনুপস্থিত'
        });
      }
      
      const newBatch = {
        id: uuidv4(),
        userId: req.user.id,
        cropType,
        estimatedWeightKg: Number(estimatedWeightKg),
        harvestDate,
        division,
        district,
        upazila: upazila || '',
        storageType,
        notes,
        status: 'active',
        createdAt: new Date().toISOString(),
        synced: true
      };
      
      db.data.batches.push(newBatch);
      await db.write();
      
      // Check and award badges
      const userBatches = db.data.batches.filter(b => b.userId === req.user.id);
      
      // 🥇 First Harvest Badge - when first batch is created
      if (userBatches.length === 1) {
        const existingBadge = db.data.badges.find(
          b => b.userId === req.user.id && b.key === 'first-harvest'
        );
        if (!existingBadge) {
          db.data.badges.push({
            id: uuidv4(),
            userId: req.user.id,
            key: 'first-harvest',
            awardedAt: new Date().toISOString()
          });
          await db.write();
        }
      }
      
      // 🏆 1000KG Club Badge - when total weight exceeds 1000kg
      const totalWeight = userBatches.reduce((sum, b) => sum + (b.estimatedWeightKg || 0), 0);
      if (totalWeight >= 1000) {
        const existing1000Badge = db.data.badges.find(
          b => b.userId === req.user.id && b.key === '1000kg-club'
        );
        if (!existing1000Badge) {
          db.data.badges.push({
            id: uuidv4(),
            userId: req.user.id,
            key: '1000kg-club',
            awardedAt: new Date().toISOString()
          });
          await db.write();
        }
      }
      
      // 🌾 5 Batches Badge - when 5 batches are logged
      if (userBatches.length >= 5) {
        const existing5Badge = db.data.badges.find(
          b => b.userId === req.user.id && b.key === 'batch-veteran'
        );
        if (!existing5Badge) {
          db.data.badges.push({
            id: uuidv4(),
            userId: req.user.id,
            key: 'batch-veteran',
            awardedAt: new Date().toISOString()
          });
          await db.write();
        }
      }
      
      res.status(201).json({
        message: 'Batch created successfully',
        messageBn: 'ব্যাচ সফলভাবে তৈরি হয়েছে',
        batch: newBatch
      });
      
    } catch (err) {
      console.error('Create batch error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
   * PUT /api/batches/:id
   * Update a batch
   */
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const batches = db.data.batches || [];
      const index = batches.findIndex(b => b.id === req.params.id && b.userId === req.user.id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Batch not found' });
      }
      
      // Update allowed fields
      const allowedUpdates = ['estimatedWeightKg', 'storageType', 'notes', 'status'];
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          db.data.batches[index][field] = req.body[field];
        }
      });
      
      db.data.batches[index].updatedAt = new Date().toISOString();
      await db.write();
      
      res.json({
        message: 'Batch updated',
        messageBn: 'ব্যাচ আপডেট হয়েছে',
        batch: db.data.batches[index]
      });
      
    } catch (err) {
      console.error('Update batch error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
   * POST /api/batches/:id/record-loss
   * Record a loss event for a batch
   */
  router.post('/:id/record-loss', authMiddleware, async (req, res) => {
    try {
      const batches = db.data.batches || [];
      const index = batches.findIndex(b => b.id === req.params.id && b.userId === req.user.id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Batch not found' });
      }
      
      const { lossWeightKg, lossDate, lossReason, notes } = req.body;
      
      if (!lossWeightKg || !lossDate) {
        return res.status(400).json({ 
          error: 'Loss weight and date required',
          errorBn: 'ক্ষতি ওজন এবং তারিখ প্রয়োজন'
        });
      }
      
      const lossWeight = Number(lossWeightKg);
      const estimatedWeight = db.data.batches[index].estimatedWeightKg || 0;
      
      if (lossWeight > estimatedWeight) {
        return res.status(400).json({ 
          error: 'Loss cannot exceed estimated weight',
          errorBn: 'ক্ষতি আনুমানিক ওজনের চেয়ে বেশি হতে পারে না'
        });
      }
      
      // Record loss event
      const lossEvent = {
        id: uuidv4(),
        batchId: req.params.id,
        lossWeightKg: lossWeight,
        lossDate,
        lossReason: lossReason || 'Other',
        notes: notes || '',
        recordedAt: new Date().toISOString()
      };
      
      // Initialize lossEvents array if it doesn't exist
      if (!db.data.lossEvents) {
        db.data.lossEvents = [];
      }
      
      db.data.lossEvents.push(lossEvent);
      
      // Update batch with total loss
      if (!db.data.batches[index].totalLossKg) {
        db.data.batches[index].totalLossKg = 0;
      }
      db.data.batches[index].totalLossKg += lossWeight;
      db.data.batches[index].lastLossDate = lossDate;
      
      // Calculate saved weight
      db.data.batches[index].savedWeightKg = estimatedWeight - db.data.batches[index].totalLossKg;
      
      // Update status to 'completed' if all weight is lost
      if (db.data.batches[index].totalLossKg >= estimatedWeight) {
        db.data.batches[index].status = 'completed';
      }
      
      db.data.batches[index].updatedAt = new Date().toISOString();
      
      await db.write();
      
      res.json({
        message: 'Loss recorded',
        messageBn: 'ক্ষতি রেকর্ড করা হয়েছে',
        lossEvent,
        batch: db.data.batches[index]
      });
      
    } catch (err) {
      console.error('Record loss error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
   * GET /api/batches/:id/loss-events
   * Get loss events for a batch
   */
  router.get('/:id/loss-events', authMiddleware, async (req, res) => {
    try {
      const batches = db.data.batches || [];
      const batch = batches.find(b => b.id === req.params.id && b.userId === req.user.id);
      
      if (!batch) {
        return res.status(404).json({ error: 'Batch not found' });
      }
      
      const lossEvents = (db.data.lossEvents || []).filter(e => e.batchId === req.params.id);
      
      res.json({ lossEvents });
      
    } catch (err) {
      console.error('Get loss events error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
   * DELETE /api/batches/:id
   * Delete a batch
   */
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const batches = db.data.batches || [];
      const index = batches.findIndex(b => b.id === req.params.id && b.userId === req.user.id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Batch not found' });
      }
      
      db.data.batches.splice(index, 1);
      await db.write();
      
      res.json({ 
        message: 'Batch deleted',
        messageBn: 'ব্যাচ মুছে ফেলা হয়েছে'
      });
      
    } catch (err) {
      console.error('Delete batch error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
   * GET /api/batches/stats/loss
   * Get loss statistics for user
   */
  router.get('/stats/loss', authMiddleware, async (req, res) => {
    try {
      const batches = db.data.batches || [];
      const userBatches = batches.filter(b => b.userId === req.user.id);
      const lossEvents = (db.data.lossEvents || []).filter(e => 
        userBatches.some(b => b.id === e.batchId)
      );
      
      const totalHarvested = userBatches.reduce((sum, b) => sum + (b.estimatedWeightKg || 0), 0);
      const totalLost = userBatches.reduce((sum, b) => sum + (b.totalLossKg || 0), 0);
      const totalSaved = totalHarvested - totalLost;
      const successRate = totalHarvested > 0 ? ((totalSaved / totalHarvested) * 100).toFixed(1) : 100;
      
      res.json({
        totalHarvested,
        totalLost,
        totalSaved,
        successRate: parseFloat(successRate),
        lossEventsCount: lossEvents.length,
        batchesCount: userBatches.length,
        activeBatches: userBatches.filter(b => b.status === 'active').length
      });
      
    } catch (err) {
      console.error('Get loss stats error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
   * POST /api/sync
   * Sync unsynced batches from client
   */
  router.post('/sync', authMiddleware, async (req, res) => {
    try {
      const { unsyncedBatches = [] } = req.body;
      const syncedIds = [];
      
      for (const batch of unsyncedBatches) {
        // Check if batch already exists
        const existing = db.data.batches.find(b => b.id === batch.id);
        
        if (existing) {
          // Update existing
          Object.assign(existing, batch, { synced: true });
        } else {
          // Create new with proper userId
          db.data.batches.push({
            ...batch,
            userId: req.user.id,
            synced: true
          });
        }
        syncedIds.push(batch.id);
      }
      
      await db.write();
      
      // Award sync badge on first sync
      if (syncedIds.length > 0) {
        const existingBadge = db.data.badges.find(
          b => b.userId === req.user.id && b.key === 'sync-master'
        );
        if (!existingBadge) {
          db.data.badges.push({
            id: uuidv4(),
            userId: req.user.id,
            key: 'sync-master',
            awardedAt: new Date().toISOString()
          });
          await db.write();
        }
      }
      
      res.json({
        message: 'Sync successful',
        messageBn: 'সিঙ্ক সফল',
        syncedIds
      });
      
    } catch (err) {
      console.error('Sync error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  return router;
};


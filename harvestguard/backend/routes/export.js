// Export routes - CSV and JSON export for batches
const express = require('express');
const { authMiddleware } = require('../utils/jwt');

const router = express.Router();

module.exports = function(db) {
  
  /**
   * GET /api/export/json
   * Export user's batches as JSON
   */
  router.get('/json', authMiddleware, async (req, res) => {
    try {
      const batches = db.data.batches || [];
      const userBatches = batches.filter(b => b.userId === req.user.id);
      
      const users = db.data.users || [];
      const user = users.find(u => u.id === req.user.id);
      
      const exportData = {
        exportDate: new Date().toISOString(),
        farmer: user ? { name: user.name, email: user.email, phone: user.phone } : null,
        totalBatches: userBatches.length,
        batches: userBatches.map(b => ({
          id: b.id,
          cropType: b.cropType,
          estimatedWeightKg: b.estimatedWeightKg,
          harvestDate: b.harvestDate,
          division: b.division,
          district: b.district,
          upazila: b.upazila,
          storageType: b.storageType,
          status: b.status,
          notes: b.notes,
          createdAt: b.createdAt
        }))
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=harvestguard-export-${Date.now()}.json`);
      res.json(exportData);
      
    } catch (err) {
      console.error('Export JSON error:', err);
      res.status(500).json({ error: 'Export failed' });
    }
  });
  
  /**
   * GET /api/export/csv
   * Export user's batches as CSV
   */
  router.get('/csv', authMiddleware, async (req, res) => {
    try {
      const batches = db.data.batches || [];
      const userBatches = batches.filter(b => b.userId === req.user.id);
      
      // CSV headers
      const headers = [
        'ID',
        'Crop Type',
        'Weight (kg)',
        'Harvest Date',
        'Division',
        'District',
        'Upazila',
        'Storage Type',
        'Status',
        'Notes',
        'Created At'
      ];
      
      // CSV rows
      const rows = userBatches.map(b => [
        b.id,
        b.cropType,
        b.estimatedWeightKg,
        b.harvestDate,
        b.division,
        b.district,
        b.upazila || '',
        b.storageType,
        b.status,
        `"${(b.notes || '').replace(/"/g, '""')}"`,
        b.createdAt
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=harvestguard-export-${Date.now()}.csv`);
      res.send(csvContent);
      
    } catch (err) {
      console.error('Export CSV error:', err);
      res.status(500).json({ error: 'Export failed' });
    }
  });
  
  /**
   * GET /api/badges
   * Get user's badges
   */
  router.get('/badges', authMiddleware, async (req, res) => {
    try {
      const badges = db.data.badges || [];
      const userBadges = badges.filter(b => b.userId === req.user.id);
      
      // Badge definitions
      const badgeDefinitions = {
        'first-harvest': {
          name: 'First Harvest Logged',
          nameBn: 'প্রথম ফসল নিবন্ধিত',
          description: 'Logged your first crop batch',
          descriptionBn: 'আপনার প্রথম ফসল ব্যাচ নিবন্ধন করেছেন',
          icon: '🥇'
        },
        '1000kg-club': {
          name: '1000KG Club',
          nameBn: '১০০০ কেজি ক্লাব',
          description: 'Logged over 1000kg of harvest',
          descriptionBn: '১০০০ কেজির বেশি ফসল নিবন্ধন করেছেন',
          icon: '🏆'
        },
        'batch-veteran': {
          name: 'Batch Veteran',
          nameBn: 'ব্যাচ ভেটেরান',
          description: 'Logged 5 or more crop batches',
          descriptionBn: '৫টি বা তার বেশি ফসল ব্যাচ নিবন্ধন করেছেন',
          icon: '🌾'
        },
        'risk-mitigated': {
          name: 'Risk Mitigation Expert',
          nameBn: 'ঝুঁকি প্রশমন বিশেষজ্ঞ',
          description: 'Acted on weather alerts to protect crops',
          descriptionBn: 'আবহাওয়া সতর্কতায় ফসল রক্ষা করেছেন',
          icon: '🛡️'
        },
        'sync-master': {
          name: 'Sync Master',
          nameBn: 'সিঙ্ক মাস্টার',
          description: 'First successful sync from offline mode',
          descriptionBn: 'অফলাইন থেকে প্রথম সফল সিঙ্ক',
          icon: '🔄'
        },
        'weather-watcher': {
          name: 'Weather Watcher',
          nameBn: 'আবহাওয়া পর্যবেক্ষক',
          description: 'Checked weather forecast 10 times',
          descriptionBn: '১০ বার আবহাওয়ার পূর্বাভাস দেখেছেন',
          icon: '🌤️'
        }
      };
      
      const enrichedBadges = userBadges.map(b => ({
        ...b,
        ...badgeDefinitions[b.key]
      }));
      
      res.json({ badges: enrichedBadges });
      
    } catch (err) {
      console.error('Get badges error:', err);
      res.status(500).json({ error: 'Failed to get badges' });
    }
  });
  
  return router;
};


const express = require('express');

// Simple risk heuristic from batch fields (no weather needed)
function computeRiskLevel(userBatches) {
  let highest = 0; // 0=Low, 1=Medium, 2=High
  for (const b of userBatches) {
    if (b.status !== 'active') continue;
    let score = 0;
    if (b.storageType === 'Open Area') score += 30;
    else if (b.storageType === 'Jute Bag Stack') score += 15;
    if (b.harvestDate) {
      const days = Math.floor((Date.now() - new Date(b.harvestDate).getTime()) / 86400000);
      if (days > 60) score += 30;
      else if (days > 30) score += 15;
      else if (days > 14) score += 5;
    }
    const lvl = score >= 50 ? 2 : score >= 20 ? 1 : 0;
    if (lvl > highest) highest = lvl;
  }
  return ['Low', 'Medium', 'High'][highest];
}

module.exports = function(db) {
  const router = express.Router();

  /**
   * GET /api/users/active
   * Returns anonymized active farmers for the risk map.
   * Includes computed risk level. No emails, phones, or full IDs exposed.
   */
  router.get('/active', (req, res) => {
    try {
      const allBatches = (db.data && db.data.batches) || [];

      // Group batches by userId
      const byUser = new Map();
      for (const b of allBatches) {
        if (!b.userId) continue;
        if (!byUser.has(b.userId)) {
          byUser.set(b.userId, {
            division: null,
            district: null,
            cropTypes: new Set(),
            batches: [],
            lastSeen: 0
          });
        }
        const entry = byUser.get(b.userId);
        entry.batches.push(b);
        if (b.cropType) entry.cropTypes.add(b.cropType);
        if (b.division && !entry.division) entry.division = b.division;
        if (b.district && !entry.district) entry.district = b.district;
        const updated = b.updatedAt ? new Date(b.updatedAt).getTime()
                      : b.createdAt  ? new Date(b.createdAt).getTime() : 0;
        if (updated > entry.lastSeen) entry.lastSeen = updated;
      }

      const result = [];
      for (const [userId, info] of byUser.entries()) {
        if (!info.division && !info.district) continue;

        result.push({
          anonId: `u-${String(userId).slice(0, 8)}`,
          division: info.division || null,
          district: info.district || null,
          cropTypes: Array.from(info.cropTypes),
          riskLevel: computeRiskLevel(info.batches),
          lastSeen: info.lastSeen ? new Date(info.lastSeen).toISOString() : null
        });
      }

      res.json({ users: result });
    } catch (err) {
      console.error('Error building active users list:', err);
      res.status(500).json({ error: 'Failed to get active users' });
    }
  });

  return router;
};

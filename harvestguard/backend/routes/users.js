const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  /**
   * GET /api/users/active
   * Returns an anonymized list of active farmers for the risk map.
   * Does NOT expose emails, phone numbers or full identities.
   */
  router.get('/active', (req, res) => {
    try {
      const users = (db.data && db.data.users) || [];
      const batches = (db.data && db.data.batches) || [];

      // Map userId -> aggregation info
      const map = new Map();

      for (const b of batches) {
        if (!b.userId) continue;
        const entry = map.get(b.userId) || { cropTypes: new Set(), division: b.division || null, district: b.district || null, lastSeen: 0 };
        if (b.cropType) entry.cropTypes.add(b.cropType);
        if (b.division) entry.division = entry.division || b.division;
        if (b.district) entry.district = entry.district || b.district;
        const updated = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        if (updated > entry.lastSeen) entry.lastSeen = updated;
        map.set(b.userId, entry);
      }

      // Build anonymized list
      const result = [];
      for (const [userId, info] of map.entries()) {
        // Skip if no location info
        if (!info.division && !info.district) continue;

        // Create a short anon id (do not reveal full id)
        const anonId = `u-${String(userId).slice(0, 8)}`;

        result.push({
          anonId,
          division: info.division || null,
          district: info.district || null,
          cropTypes: Array.from(info.cropTypes),
          lastSeen: info.lastSeen ? new Date(info.lastSeen).toISOString() : null
        });
      }

      // If no data, return empty array
      res.json({ users: result });
    } catch (err) {
      console.error('Error building active users list:', err);
      res.status(500).json({ error: 'Failed to get active users' });
    }
  });

  return router;
};

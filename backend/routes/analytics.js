/**
 * Analytics Routes
 * Cross-device aggregated insights endpoint (Knox Asset Intelligence style)
 */

const express = require('express');
const router = express.Router();
const { knoxPost } = require('../knoxClient');

/**
 * GET /api/analytics/summary
 * Aggregates fleet-level metrics across all enrolled devices
 */
router.get('/summary', async (req, res) => {
  try {
    const raw = await knoxPost('/emm/oapi/device/selectDeviceList', {
      start: 0,
      limit: 1000,
    });

    const devices = raw?.resultValue?.deviceList || [];
    const total = raw?.resultValue?.total !== undefined ? raw.resultValue.total : devices.length;

    let enrolledCount = 0;
    let unenrolledCount = 0;
    let pendingCount = 0;

    devices.forEach((d) => {
      const s = (d.deviceStatus || '').toUpperCase();
      if (s === 'A' || s === 'ENROLLED' || s === 'ACTIVE') {
        enrolledCount++;
      } else if (s === 'I' || s === 'UNENROLLED' || s === 'INACTIVE' || s === 'DEACTIVATED') {
        unenrolledCount++;
      } else {
        pendingCount++;
      }
    });

    res.json({
      success: true,
      summary: {
        totalDevices: total,
        enrolledCount,
        unenrolledCount,
        pendingCount,
      },
    });
  } catch (err) {
    console.error('[/api/analytics/summary] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

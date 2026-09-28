/**
 * Samsung Knox Manage Dashboard — Express Server
 * Production-ready enterprise backend with full Knox OAPI integration
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');

const deviceRoutes    = require('./routes/devices');
const analyticsRoutes = require('./routes/analytics');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ─── Root & Health Check ──────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    service: 'Samsung Knox Manage Dashboard — API Server',
    status: 'ONLINE',
    tenant: process.env.KNOX_TENANT_ID,
    knoxServer: process.env.KNOX_SERVER_URL,
    endpoints: {
      health: 'http://localhost:5000/health',
      authTest: 'http://localhost:5000/api/auth/test',
      devices: 'http://localhost:5000/api/devices',
      deviceDetail: 'http://localhost:5000/api/devices/:id',
      analyticsSummary: 'http://localhost:5000/api/analytics/summary',
    },
    frontendUrl: 'http://localhost:3000',
    version: '1.0.0',
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Knox Manage Dashboard API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    knoxServer: process.env.KNOX_SERVER_URL,
    tenantId: process.env.KNOX_TENANT_ID,
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────────

app.use('/api/devices', deviceRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── Token Test Endpoint ──────────────────────────────────────────────────────

app.get('/api/auth/test', async (req, res) => {
  try {
    const { getAccessToken } = require('./tokenManager');
    const token = await getAccessToken();
    res.json({
      success: true,
      message: 'Knox authentication successful',
      tokenPreview: token.substring(0, 20) + '…',
    });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error('[GlobalError]', err.message);
  res.status(500).json({ success: false, error: 'Internal Server Error', details: err.message });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Samsung Knox Manage Dashboard — Backend API        ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Server running at: http://localhost:${PORT}           ║`);
  console.log(`║  Knox Server:       ${process.env.KNOX_SERVER_URL?.replace('https://', '')} ║`);
  console.log(`║  Tenant:            ${process.env.KNOX_TENANT_ID}         ║`);
  console.log('╚══════════════════════════════════════════════════════╝');
});

module.exports = app;

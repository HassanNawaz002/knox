# Samsung Knox Manage Dashboard — Enterprise Console

A production-ready, full-stack dashboard that connects directly to the **Samsung Knox Manage OAPI** for real-time fleet telemetry, device monitoring, and Knox Asset Intelligence-style analytics.

## 🚀 Quick Start

```batch
cd C:\Users\T490\.gemini\antigravity\scratch\knox-dashboard
start.bat
```

Or manually:

```powershell
# Terminal 1 — Backend
cd backend && node server.js

# Terminal 2 — Frontend
cd frontend && npm run dev
```

**Access:** http://localhost:3000

---

## 📐 Architecture

```
knox-dashboard/
├── backend/
│   ├── server.js          # Express entry point (Port 5000)
│   ├── tokenManager.js    # OAuth2 token cache & auto-renewal
│   ├── knoxClient.js      # Authenticated Knox API client w/ retry
│   ├── routes/
│   │   ├── devices.js     # /api/devices, /api/devices/:id
│   │   └── analytics.js   # /api/analytics/summary
│   └── .env               # Knox credentials
│
└── frontend/
    └── src/
        ├── App.jsx            # Main dashboard shell
        ├── api.js             # Axios client → backend
        ├── components/
        │   ├── Sidebar.jsx    # Navigation sidebar
        │   ├── FleetTable.jsx # Device fleet table + filters + pagination
        │   ├── DeviceModal.jsx# Deep telemetry modal (#detailModal)
        │   ├── Charts.jsx     # Chart.js line + doughnut charts
        │   └── StatusBadge.jsx
        └── index.css          # Enterprise light theme
```

---

## 🔌 Knox OAPI Endpoints Used

| Purpose | Endpoint |
|---|---|
| Authentication | `POST /emm/oauth/token` |
| Fleet Device List | `POST /emm/oapi/device/selectDeviceList` |
| Device Deep Telemetry | `POST /emm/oapi/device/selectDeviceDetail` |
| Device Detail Fallback | `POST /emm/oapi/device/selectDeviceInfo` |
| Installed App Inventory | `POST /emm/oapi/device/selectDeviceAppList` |

---

## 🧪 API Test Endpoints

```http
GET http://localhost:5000/health
GET http://localhost:5000/api/auth/test
GET http://localhost:5000/api/devices
GET http://localhost:5000/api/devices/:deviceId
GET http://localhost:5000/api/analytics/summary
```

---

## ✨ Features

- **Real-time fleet overview** with client-side filtering (name, IMEI, org, status, date) and 10-per-page pagination
- **Deep device telemetry modal** with hardware metrics, security details, connectivity info
- **Knox Asset Intelligence insights** — root detection, battery degradation, memory pressure, Play Integrity, license compliance
- **Chart.js visualizations** — dual-axis battery/temperature line chart + app RAM doughnut
- **Full app inventory table** — 500 apps per device with type, version, memory (MB), install date
- **OAuth2 token management** — automatic caching, expiry detection, and transparent refresh
- **Enterprise light theme** — clean `#f4f6f9` background, professional typography, soft shadows

---

## 🔐 Credentials

```
KNOX_SERVER_URL=https://ap01.manage.samsungknox.com
KNOX_TENANT_ID=mm.mercurialminds.com
KNOX_CLIENT_ID=knoxapi@mm.mercurialminds.com
KNOX_CLIENT_SECRET=Galaxy@786
```

> ⚠️ Do not commit `.env` to version control in production.

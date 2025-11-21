require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

/* ===== CORS + JSON ===== */
const allowOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: allowOrigins,
  credentials: true,
  optionsSuccessStatus: 204,
}));



app.use(express.json());

/* ===== Health ===== */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ev-maintenance-api', time: new Date().toISOString() });
});

// Test routes for dashboard widgets (before other routes)
app.get('/api/notifications/test', (_req, res) => {
  res.json({ success: true, message: 'Notifications route is working!', time: new Date().toISOString() });
});

app.get('/api/events/test', (_req, res) => {
  res.json({ success: true, message: 'Events route is working!', time: new Date().toISOString() });
});

/* ===== Routes (alias khớp FE) ===== */
// Auth & Account
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/account', require('./routes/accountRoutes'));
app.use('/api/accounts', require('./routes/accountRoutes')); // alias

// Vehicles & Models
app.use('/api/vehicle',  require('./routes/vehicleRoutes'));  // giữ cũ
app.use('/api/vehicles', require('./routes/vehicleRoutes'));  // alias
app.use('/api/models',   require('./routes/modelRoutes'));

// Appointments
app.use('/api/appointments', require('./routes/appointmentRoutes'));

// Services
app.use('/api/services', require('./routes/serviceCatalogRoutes'));

// Slots
app.use('/api/slots', require('./routes/slotRoutes'));
app.use("/api/technicians", require("./routes/technicianRoutes"));
// Work Orders
app.use('/api/workorder',  require('./routes/workOrderRoutes')); // giữ cũ
app.use('/api/workorders', require('./routes/workOrderRoutes')); // alias

// Invoices
app.use('/api/invoice',  require('./routes/invoiceRoutes'));     // giữ cũ
app.use('/api/invoices', require('./routes/invoiceRoutes'));     // alias

// Payments
app.use('/api/payment',  require('./routes/paymentRoutes'));     // giữ cũ
app.use('/api/payments', require('./routes/paymentRoutes'));     // alias

// Others
app.use('/api/reminder', require('./routes/reminderRoutes'));
app.use('/api/report',   require('./routes/reportRoutes'));
app.use('/api/chat',     require('./routes/chatRoutes'));
app.use('/api/admin/inventory', require('./routes/inventoryRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));

// Dashboard widgets
try {
  app.use('/api/notifications', require('./routes/notificationRoutes'));
  console.log('✅ Notifications route loaded');
} catch (err) {
  console.error('❌ Error loading notifications route:', err);
}

try {
  app.use('/api/events', require('./routes/eventRoutes'));
  console.log('✅ Events route loaded');
} catch (err) {
  console.error('❌ Error loading events route:', err);
}


/* ===== Root + handlers ===== */
app.get('/', (_req, res) => res.send('🚗 EV Service Center API is running... (see /api/*)'));

app.use((req, res) =>
  res.status(404).json({ success: false, error: { code: 404, message: 'Not found' } })
);

app.use((err, _req, res, _next) => {
  console.error('API error:', err);
  res.status(500).json({ success: false, error: { code: 500, message: 'Server error' } });
});

/* ===== Start ===== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
console.log("DEBUG:", authRoutes);   // 👈 thêm dòng này
app.use('/api/auth', authRoutes);

// health check
app.get('/', (req, res) => res.send('🚗 EV Maintenance App API is running'));

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));

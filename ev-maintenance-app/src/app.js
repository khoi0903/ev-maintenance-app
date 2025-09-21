require('dotenv').config({ path: '../Db.env' });
const express = require('express');
const app = express();

app.use(express.json());

const authRoutes = require('./controllers/routes/authRoutes');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('EV Maintenance App đang chạy!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
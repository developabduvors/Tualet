const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const toiletRoutes = require('./routes/toiletRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Toilet Finder backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/toilets', toiletRoutes);
app.use('/api/reviews', reviewRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

module.exports = app;

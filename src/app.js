require('dotenv').config();
const express = require('express');
const database = require('./config/database');
const redisClient = require('./config/redis');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const ResponseHandler = require('./utils/responseHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ms-ali-akbar-betest',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => {
  ResponseHandler.notFound(res, `Route ${req.originalUrl} not found`);
});

app.use((err, req, res, next) => {
  console.error('[App] Unhandled error:', err);
  ResponseHandler.error(res, err.message || 'Internal server error', err.statusCode || 500);
});

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  await database.connect();
  redisClient.connect();
  app.listen(PORT, () => {
    console.log(`[App] ms-ali-akbar-betest running on port ${PORT}`);
  });
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error('[App] Fatal startup error:', err);
    process.exit(1);
  });
}

module.exports = app;

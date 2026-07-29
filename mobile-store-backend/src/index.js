require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const connectDB = require('./config/db');
const promoteUpcomingPhones = require('./jobs/promoteUpcomingPhones');

const port = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

(async () => {
  try {
    await connectDB();
    const server = app.listen(port, () => console.log(`Server listening on port ${port}`));

    // Run once on startup (catches anything overdue while server was down)
    promoteUpcomingPhones();

    // Run daily at midnight
    cron.schedule('0 0 * * *', () => {
      console.log('[Cron] Running daily upcoming-phone promotion check...');
      promoteUpcomingPhones();
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => server.close(() => process.exit(0)));
    process.on('SIGINT', () => server.close(() => process.exit(0)));
  } catch (err) {
    console.error('Failed to connect to DB', err);
    process.exit(1);
  }
})();
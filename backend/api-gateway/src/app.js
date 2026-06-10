require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const healthRoutes = require('./modules/health/health.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const authRoutes = require('./modules/auth/auth.routes');
const profileRoutes = require('./modules/profile/profile.routes');
const userRoutes = require('./modules/users/users.routes');
const marketingTaskRoutes = require('./modules/marketing/marketing-task.routes');
const marketingPostRoutes = require('./modules/marketing-posts/marketing-post.routes');
const constructionDataRoutes = require('./modules/construction-data/construction-data.routes');
const errorHandler = require('./shared/middleware/error-handler.middleware');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : '*';

app.use(cors({ origin: corsOrigin }));
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/health', healthRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/marketing/tasks', marketingTaskRoutes);
app.use('/api/marketing/posts', marketingPostRoutes);
app.use('/api/construction-data', constructionDataRoutes);
app.use('/controller/user', userRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import savedJobRoutes from './routes/savedJob.routes';
import uploadRoutes from './routes/upload.routes';
import aiRoutes from './routes/ai.routes';
import { errorHandler } from './middlewares/error.middleware';

// Initialize the Express application
const app = express();

// Middleware: CORS allows our frontend (e.g., Next.js) to make requests to this API securely
app.use(cors());

// Middleware: This allows Express to understand JSON data sent in the request body
app.use(express.json());

// A simple health check route so we know the server is running
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Job Platform API is running' });
});

// Register our routes
// All authentication-related routes will be prefixed with /api/auth
app.use('/api/auth', authRoutes);

// All job-related routes will be prefixed with /api/jobs
app.use('/api/jobs', jobRoutes);

// All saved job routes will be prefixed with /api/saved-jobs
app.use('/api/saved-jobs', savedJobRoutes);

// Image upload routes
app.use('/api/upload', uploadRoutes);

// AI generation routes
app.use('/api/ai', aiRoutes);

// Global Error Handler
// This must be the VERY LAST middleware added to the app!
// If any of the routes above throw an error, it will trickle down to this function.
app.use(errorHandler);

export default app;

import { Router } from 'express';
import { toggleSavedJob, getSavedJobs } from '../controllers/savedJob.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Get all saved jobs for current user
router.get('/', authenticate, getSavedJobs);

// Toggle save status for a specific job
router.post('/:jobId', authenticate, toggleSavedJob);

export default router;

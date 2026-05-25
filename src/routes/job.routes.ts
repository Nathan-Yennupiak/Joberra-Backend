import { Router } from 'express';
import { getAllJobs, getJobById, createJob, updateJob, deleteJob } from '../controllers/job.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createJobSchema, updateJobSchema } from '../schemas/job.schema';

const router = Router();

// ==========================================
// PUBLIC ROUTES (Anyone can access these)
// ==========================================

// GET /api/jobs -> Returns a list of all jobs
router.get('/', getAllJobs);

// GET /api/jobs/:id -> Returns a single specific job
router.get('/:id', getJobById);


// ==========================================
// PROTECTED ROUTES (Requires a logged-in user)
// ==========================================
// Notice how we place the `authenticate` middleware BEFORE the main controller function.
// This ensures that the user is logged in before they can create, edit, or delete a job.

// POST /api/jobs -> Create a new job
// We also use `validate(createJobSchema)` to make sure the data they sent is formatted correctly.
router.post('/', authenticate, validate(createJobSchema), createJob);

// PUT /api/jobs/:id -> Update an existing job
router.put('/:id', authenticate, validate(updateJobSchema), updateJob);

// DELETE /api/jobs/:id -> Delete a job
router.delete('/:id', authenticate, deleteJob);

export default router;

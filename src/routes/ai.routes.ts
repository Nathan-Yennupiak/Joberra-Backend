import { Router } from 'express';
import { generateJobDescription } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint for AI generation
router.post('/generate-description', authenticate, generateJobDescription);

export default router;

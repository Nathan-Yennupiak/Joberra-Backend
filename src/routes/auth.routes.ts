import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, getProfile, updateProfile } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } from '../schemas/auth.schema';

const router = Router();

// POST /api/auth/register -> Register a new user account
// The validate middleware will check the request body against our Zod schema
// before allowing the register controller to run.
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login -> Log in to an existing user account
router.post('/login', validate(loginSchema), login);

// POST /api/auth/forgot-password -> Request a password reset email
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

// POST /api/auth/reset-password -> Reset the password using the token
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// GET /api/auth/me -> Fetch the current authenticated user's profile
router.get('/me', authenticate, getProfile);

// PUT /api/auth/me -> Update the current authenticated user's profile
router.put('/me', authenticate, validate(updateProfileSchema), updateProfile);

export default router;

import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Store file in memory to pass buffer to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// Upload image endpoint
router.post('/', authenticate, upload.single('image'), uploadImage);

export default router;

import { Router } from 'express';
import { login, logout, me, signup } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { requireRecaptcha } from '../middleware/recaptcha.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, signupSchema } from '../validators/authSchemas.js';

const router = Router();

router.post('/signup', validateBody(signupSchema), requireRecaptcha, signup);
router.post('/login', validateBody(loginSchema), requireRecaptcha, login);
router.post('/logout', logout);
router.get('/me', protect, me);

export default router;

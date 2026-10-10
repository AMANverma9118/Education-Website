import { Router } from 'express';
import {
  getChildProgress,
  getDashboard,
  linkChild,
  linkChildValidators,
} from '../controllers/parentController.js';
import { allowRoles, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect, allowRoles('parent'));

router.get('/dashboard', getDashboard);
router.get('/children/:childId', getChildProgress);
router.post('/link-child', ...linkChildValidators, linkChild);

export default router;

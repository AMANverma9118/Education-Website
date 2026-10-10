import { Router } from 'express';
import {
  getAttendance,
  getDashboard,
  getGrades,
} from '../controllers/studentController.js';
import { allowRoles, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect, allowRoles('student'));

router.get('/dashboard', getDashboard);
router.get('/grades', getGrades);
router.get('/attendance', getAttendance);

export default router;

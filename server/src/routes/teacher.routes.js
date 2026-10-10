import { Router } from 'express';
import {
  createGrade,
  createGradeValidators,
  getDashboard,
  getMyClasses,
  listAttendance,
  listGrades,
  markAttendance,
  markAttendanceValidators,
  updateAttendance,
  updateAttendanceValidators,
  updateGrade,
  updateGradeValidators,
} from '../controllers/teacherController.js';
import { allowRoles, protect, requireApproved } from '../middleware/auth.js';

const router = Router();

router.use(protect, allowRoles('teacher'));

router.get('/dashboard', getDashboard);
router.get('/classes', getMyClasses);
router.get('/grades', listGrades);
router.get('/attendance', listAttendance);
router.post('/attendance', requireApproved, ...markAttendanceValidators, markAttendance);
router.patch('/attendance/:id', requireApproved, ...updateAttendanceValidators, updateAttendance);
router.post('/grades', requireApproved, ...createGradeValidators, createGrade);
router.patch('/grades/:id', requireApproved, ...updateGradeValidators, updateGrade);

export default router;

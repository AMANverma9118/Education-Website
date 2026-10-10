import { Router } from 'express';
import {
  approveUser,
  assignStudentToClass,
  assignStudentValidators,
  createClass,
  createClassValidators,
  createTeacher,
  createTeacherValidators,
  getDashboard,
  linkParentToStudent,
  linkParentValidators,
  listClasses,
  listUsers,
  setUserActive,
} from '../controllers/principalController.js';
import { allowRoles, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect, allowRoles('principal'));

router.get('/dashboard', getDashboard);
router.get('/users', listUsers);
router.post('/teachers', ...createTeacherValidators, createTeacher);
router.patch('/users/:id/approve', approveUser);
router.patch('/users/:id/active', setUserActive);
router.post('/link-parent', ...linkParentValidators, linkParentToStudent);
router.get('/classes', listClasses);
router.post('/classes', ...createClassValidators, createClass);
router.post('/assign-student', ...assignStudentValidators, assignStudentToClass);

export default router;

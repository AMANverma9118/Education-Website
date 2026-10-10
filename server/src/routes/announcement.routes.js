import { Router } from 'express';
import {
  createAnnouncement,
  createAnnouncementValidators,
  listAnnouncements,
} from '../controllers/announcementController.js';
import { allowRoles, protect, requireApproved } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', listAnnouncements);
router.post(
  '/',
  allowRoles('principal', 'teacher'),
  requireApproved,
  ...createAnnouncementValidators,
  createAnnouncement
);

export default router;

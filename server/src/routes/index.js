import { Router } from 'express';
import authRoutes from './auth.routes.js';
import studentRoutes from './student.routes.js';
import teacherRoutes from './teacher.routes.js';
import parentRoutes from './parent.routes.js';
import principalRoutes from './principal.routes.js';
import announcementRoutes from './announcement.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Greenfield API is running.' });
});

router.use('/auth', authRoutes);
router.use('/student', studentRoutes);
router.use('/teacher', teacherRoutes);
router.use('/parent', parentRoutes);
router.use('/principal', principalRoutes);
router.use('/announcements', announcementRoutes);

export default router;

import { Attendance } from '../models/Attendance.js';
import { Grade } from '../models/Grade.js';
import { Announcement } from '../models/Announcement.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createFamilyLinkCode } from '../utils/linkCode.js';

async function ensureFamilyLinkCode(user) {
  if (user.role !== 'student') return user;
  if (user.familyLinkCode) return user;
  user.familyLinkCode = createFamilyLinkCode();
  await user.save();
  return user;
}

export const getDashboard = asyncHandler(async (req, res) => {
  const student = await ensureFamilyLinkCode(req.user);
  const studentId = student._id;

  const [grades, attendance, announcements] = await Promise.all([
    Grade.find({ student: studentId }).sort({ createdAt: -1 }).limit(8),
    Attendance.find({ student: studentId }).sort({ date: -1 }).limit(14),
    Announcement.find({
      $or: [{ audience: 'all' }, { audience: 'student' }],
    })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(5)
      .populate('author', 'firstName lastName'),
  ]);

  const present = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = attendance.length
    ? Math.round((present / attendance.length) * 100)
    : null;

  res.json({
    success: true,
    data: {
      profile: student.toSafeJSON(),
      recentGrades: grades,
      recentAttendance: attendance,
      attendanceRate,
      announcements,
    },
  });
});

export const getGrades = asyncHandler(async (req, res) => {
  const grades = await Grade.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate('gradedBy', 'firstName lastName');
  res.json({ success: true, data: grades });
});

export const getAttendance = asyncHandler(async (req, res) => {
  const records = await Attendance.find({ student: req.user._id }).sort({ date: -1 });
  res.json({ success: true, data: records });
});

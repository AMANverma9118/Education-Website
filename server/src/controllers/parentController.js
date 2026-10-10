import { z } from 'zod';
import { Attendance } from '../models/Attendance.js';
import { Grade } from '../models/Grade.js';
import { User } from '../models/User.js';
import { Announcement } from '../models/Announcement.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { linkParentToStudent } from '../utils/linkParentToStudent.js';
import { validateBody } from '../middleware/validate.js';

async function getLinkedChildren(parent) {
  if (parent.children?.length) {
    return User.find({ _id: { $in: parent.children }, role: 'student' });
  }
  return User.find({ parentRefs: parent._id, role: 'student' });
}

export const getDashboard = asyncHandler(async (req, res) => {
  const children = await getLinkedChildren(req.user);
  const childIds = children.map((c) => c._id);

  // If parent already linked an approved child, unlock their account
  if (!req.user.isApproved && children.some((c) => c.isApproved)) {
    req.user.isApproved = true;
    await req.user.save();
  }

  const [grades, attendance, announcements] = await Promise.all([
    Grade.find({ student: { $in: childIds } }).sort({ createdAt: -1 }).limit(10),
    Attendance.find({ student: { $in: childIds } }).sort({ date: -1 }).limit(20),
    Announcement.find({
      $or: [{ audience: 'all' }, { audience: 'parent' }],
    })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(5)
      .populate('author', 'firstName lastName'),
  ]);

  res.json({
    success: true,
    data: {
      profile: req.user.toSafeJSON(),
      children: children.map((c) => c.toSafeJSON()),
      recentGrades: grades,
      recentAttendance: attendance,
      announcements,
    },
  });
});

export const getChildProgress = asyncHandler(async (req, res) => {
  const children = await getLinkedChildren(req.user);
  const child = children.find((c) => c._id.toString() === req.params.childId);
  if (!child) throw new AppError('Child not found or not linked to your account.', 404);

  const [grades, attendance] = await Promise.all([
    Grade.find({ student: child._id }).sort({ createdAt: -1 }),
    Attendance.find({ student: child._id }).sort({ date: -1 }).limit(40),
  ]);

  res.json({
    success: true,
    data: {
      child: child.toSafeJSON(),
      grades,
      attendance,
    },
  });
});

const linkSchema = z.object({
  studentEmail: z.string().trim().email('Enter the student email.'),
  familyLinkCode: z
    .string()
    .trim()
    .min(4, 'Enter the family link code from the student account.')
    .max(12),
});

export const linkChildValidators = [validateBody(linkSchema)];

export const linkChild = asyncHandler(async (req, res) => {
  const { student } = await linkParentToStudent(
    req.user,
    req.body.studentEmail,
    req.body.familyLinkCode
  );

  res.json({
    success: true,
    message: `${student.firstName} ${student.lastName} is now linked. You can view grades and attendance.`,
    data: { child: student.toSafeJSON() },
  });
});

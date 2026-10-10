import { z } from 'zod';
import { User } from '../models/User.js';
import { SchoolClass } from '../models/SchoolClass.js';
import { Announcement } from '../models/Announcement.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const [
    students,
    teachers,
    parents,
    pending,
    classes,
    announcements,
    teacherList,
    studentList,
    pendingList,
  ] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    User.countDocuments({ role: 'parent', isActive: true }),
    User.countDocuments({ isApproved: false, role: { $in: ['student', 'parent'] } }),
    SchoolClass.countDocuments(),
    Announcement.find().sort({ createdAt: -1 }).limit(5).populate('author', 'firstName lastName'),
    User.find({ role: 'teacher' }).sort({ createdAt: -1 }).limit(20),
    User.find({ role: 'student' }).sort({ createdAt: -1 }).limit(20),
    User.find({ isApproved: false, role: { $in: ['student', 'parent'] } })
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  res.json({
    success: true,
    data: {
      stats: { students, teachers, parents, pending, classes },
      teachers: teacherList.map((u) => u.toSafeJSON()),
      students: studentList.map((u) => u.toSafeJSON()),
      pendingUsers: pendingList.map((u) => u.toSafeJSON()),
      announcements,
    },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.pending === 'true') {
    filter.isApproved = false;
    filter.role = { $in: ['student', 'parent'] };
  }

  const users = await User.find(filter)
    .populate('parentRefs', 'firstName lastName email phone')
    .populate('children', 'firstName lastName email phone gradeLevel section')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, data: users.map((u) => u.toSafeJSON()) });
});

const teacherSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(120),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72)
    .regex(/[A-Za-z]/, 'Password must include a letter.')
    .regex(/\d/, 'Password must include a number.'),
  phone: z.string().trim().max(20).optional(),
  employeeId: z.string().trim().max(40).optional(),
  subjects: z.array(z.string().trim().max(60)).max(20).optional(),
});

export const createTeacherValidators = [validateBody(teacherSchema)];

/** Principal creates teacher login credentials — teachers cannot self-register. */
export const createTeacher = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const exists = await User.findOne({ email });
  if (exists) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const teacher = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email,
    password: req.body.password,
    role: 'teacher',
    phone: req.body.phone,
    employeeId: req.body.employeeId,
    subjects: req.body.subjects || [],
    isApproved: true,
    isActive: true,
  });

  res.status(201).json({
    success: true,
    message: 'Teacher account created. Share the email and password securely.',
    data: teacher.toSafeJSON(),
  });
});

export const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'principal') throw new AppError('Cannot modify principal this way.', 400);

  user.isApproved = true;
  await user.save();

  // Approving a student also unlocks parents already linked to them
  if (user.role === 'student' && user.parentRefs?.length) {
    await User.updateMany(
      { _id: { $in: user.parentRefs }, role: 'parent', isApproved: false },
      { $set: { isApproved: true } }
    );
  }

  res.json({ success: true, message: 'User approved.', data: user.toSafeJSON() });
});

export const setUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'principal') throw new AppError('Cannot deactivate principal.', 400);

  user.isActive = Boolean(req.body.isActive);
  await user.save();
  res.json({ success: true, data: user.toSafeJSON() });
});

const linkSchema = z.object({
  parentId: z.string().min(1),
  studentId: z.string().min(1),
});

export const linkParentValidators = [validateBody(linkSchema)];

export const linkParentToStudent = asyncHandler(async (req, res) => {
  const parent = await User.findOne({ _id: req.body.parentId, role: 'parent' });
  const student = await User.findOne({ _id: req.body.studentId, role: 'student' });
  if (!parent || !student) throw new AppError('Parent or student not found.', 404);

  if (!parent.children.map(String).includes(String(student._id))) {
    parent.children.push(student._id);
  }
  if (!student.parentRefs.map(String).includes(String(parent._id))) {
    student.parentRefs.push(parent._id);
  }

  await Promise.all([parent.save(), student.save()]);
  res.json({ success: true, message: 'Parent linked to student.' });
});

const classSchema = z.object({
  name: z.string().trim().min(1),
  gradeLevel: z.string().trim().min(1),
  section: z.string().trim().min(1),
  academicYear: z.string().trim().min(1),
  room: z.string().optional(),
  classTeacherId: z.string().optional(),
});

export const createClassValidators = [validateBody(classSchema)];

export const createClass = asyncHandler(async (req, res) => {
  const schoolClass = await SchoolClass.create({
    name: req.body.name,
    gradeLevel: req.body.gradeLevel,
    section: req.body.section,
    academicYear: req.body.academicYear,
    room: req.body.room,
    classTeacher: req.body.classTeacherId,
  });

  if (req.body.classTeacherId) {
    await User.findByIdAndUpdate(req.body.classTeacherId, {
      $addToSet: { classesTaught: schoolClass._id },
    });
  }

  res.status(201).json({ success: true, data: schoolClass });
});

export const listClasses = asyncHandler(async (req, res) => {
  const classes = await SchoolClass.find()
    .populate('classTeacher', 'firstName lastName email')
    .populate('students', 'firstName lastName studentId')
    .sort({ gradeLevel: 1, section: 1 });
  res.json({ success: true, data: classes });
});

const assignSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
});

export const assignStudentValidators = [validateBody(assignSchema)];

export const assignStudentToClass = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.body.studentId, role: 'student' });
  const schoolClass = await SchoolClass.findById(req.body.classId);
  if (!student || !schoolClass) throw new AppError('Student or class not found.', 404);

  student.classRef = schoolClass._id;
  student.gradeLevel = schoolClass.gradeLevel;
  student.section = schoolClass.section;
  await student.save();

  await SchoolClass.findByIdAndUpdate(schoolClass._id, {
    $addToSet: { students: student._id },
  });

  res.json({ success: true, message: 'Student assigned to class.' });
});

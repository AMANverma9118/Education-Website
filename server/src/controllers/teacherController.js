import { z } from 'zod';
import { Attendance } from '../models/Attendance.js';
import { Grade } from '../models/Grade.js';
import { SchoolClass } from '../models/SchoolClass.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const classes = await SchoolClass.find({
    $or: [{ classTeacher: req.user._id }, { _id: { $in: req.user.classesTaught } }],
  }).populate('students', 'firstName lastName studentId');

  res.json({
    success: true,
    data: {
      profile: req.user.toSafeJSON(),
      classes,
      classCount: classes.length,
      studentCount: classes.reduce((n, c) => n + (c.students?.length || 0), 0),
    },
  });
});

export const getMyClasses = asyncHandler(async (req, res) => {
  const classes = await SchoolClass.find({
    $or: [{ classTeacher: req.user._id }, { _id: { $in: req.user.classesTaught } }],
  }).populate('students', 'firstName lastName email studentId gradeLevel section');

  res.json({ success: true, data: classes });
});

const markAttendanceSchema = z.object({
  classId: z.string().min(1),
  date: z.string().min(1),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(['present', 'absent', 'late', 'excused']),
        note: z.string().max(300).optional(),
      })
    )
    .min(1),
});

export const markAttendanceValidators = [validateBody(markAttendanceSchema)];

async function teacherOwnedClasses(teacher) {
  return SchoolClass.find({
    $or: [{ classTeacher: teacher._id }, { _id: { $in: teacher.classesTaught } }],
  }).select('_id students name gradeLevel section');
}

export const listAttendance = asyncHandler(async (req, res) => {
  const classes = await teacherOwnedClasses(req.user);
  const classIds = classes.map((c) => c._id);

  const records = await Attendance.find({ classRef: { $in: classIds } })
    .sort({ date: -1, createdAt: -1 })
    .limit(300)
    .populate('student', 'firstName lastName email gradeLevel section')
    .populate('classRef', 'name gradeLevel section');

  res.json({ success: true, data: records });
});

export const markAttendance = asyncHandler(async (req, res) => {
  const { classId, date, records } = req.body;
  const day = new Date(date);
  if (Number.isNaN(day.getTime())) {
    throw new AppError('Invalid date.', 400);
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (day > today) {
    throw new AppError('Attendance cannot be marked for a future date.', 400);
  }

  const schoolClass = await SchoolClass.findById(classId);
  if (!schoolClass) throw new AppError('Class not found.', 404);

  const ops = records.map((r) =>
    Attendance.findOneAndUpdate(
      { student: r.studentId, date: day },
      {
        student: r.studentId,
        classRef: classId,
        date: day,
        status: r.status,
        note: r.note,
        markedBy: req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  );

  const saved = await Promise.all(ops);
  res.json({ success: true, message: 'Attendance saved.', data: saved });
});

const updateAttendanceSchema = z.object({
  status: z.enum(['present', 'absent', 'late', 'excused']),
  note: z.string().max(300).optional(),
});

export const updateAttendanceValidators = [validateBody(updateAttendanceSchema)];

export const updateAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.id);
  if (!record) throw new AppError('Attendance record not found.', 404);

  const classes = await teacherOwnedClasses(req.user);
  const classIds = classes.map((c) => String(c._id));
  if (!classIds.includes(String(record.classRef))) {
    throw new AppError('You cannot edit this attendance record.', 403);
  }

  record.status = req.body.status;
  if (req.body.note !== undefined) record.note = req.body.note;
  record.markedBy = req.user._id;
  await record.save();

  const populated = await Attendance.findById(record._id)
    .populate('student', 'firstName lastName email gradeLevel section')
    .populate('classRef', 'name gradeLevel section');

  res.json({ success: true, message: 'Attendance updated.', data: populated });
});

const gradeSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().optional(),
  subject: z.string().trim().min(1),
  title: z.string().trim().min(1),
  score: z.number().min(0),
  maxScore: z.number().min(1),
  term: z.string().optional(),
  comments: z.string().max(500).optional(),
});

export const createGradeValidators = [validateBody(gradeSchema)];

async function teacherClassIds(teacher) {
  const classes = await SchoolClass.find({
    $or: [{ classTeacher: teacher._id }, { _id: { $in: teacher.classesTaught } }],
  }).select('_id students');
  return classes;
}

export const listGrades = asyncHandler(async (req, res) => {
  const classes = await teacherClassIds(req.user);
  const classIds = classes.map((c) => c._id);
  const studentIds = [
    ...new Set(classes.flatMap((c) => (c.students || []).map((id) => String(id)))),
  ];

  const grades = await Grade.find({
    $or: [
      { gradedBy: req.user._id },
      { classRef: { $in: classIds } },
      { student: { $in: studentIds } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('student', 'firstName lastName email gradeLevel section')
    .populate('classRef', 'name gradeLevel section');

  res.json({ success: true, data: grades });
});

export const createGrade = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.body.studentId, role: 'student' });
  if (!student) throw new AppError('Student not found.', 404);

  const grade = await Grade.create({
    student: req.body.studentId,
    classRef: req.body.classId || student.classRef,
    subject: req.body.subject,
    title: req.body.title,
    score: req.body.score,
    maxScore: req.body.maxScore,
    term: req.body.term,
    comments: req.body.comments,
    gradedBy: req.user._id,
  });

  const populated = await Grade.findById(grade._id)
    .populate('student', 'firstName lastName email gradeLevel section')
    .populate('classRef', 'name gradeLevel section');

  res.status(201).json({ success: true, message: 'Grade recorded.', data: populated });
});

const updateGradeSchema = z.object({
  subject: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  score: z.number().min(0).optional(),
  maxScore: z.number().min(1).optional(),
  term: z.string().optional(),
  comments: z.string().max(500).optional(),
});

export const updateGradeValidators = [validateBody(updateGradeSchema)];

export const updateGrade = asyncHandler(async (req, res) => {
  const grade = await Grade.findById(req.params.id);
  if (!grade) throw new AppError('Grade not found.', 404);

  const classes = await teacherClassIds(req.user);
  const classIds = classes.map((c) => String(c._id));
  const studentIds = classes.flatMap((c) => (c.students || []).map((id) => String(id)));
  const allowed =
    String(grade.gradedBy) === String(req.user._id) ||
    (grade.classRef && classIds.includes(String(grade.classRef))) ||
    studentIds.includes(String(grade.student));

  if (!allowed) throw new AppError('You cannot edit this grade.', 403);

  const fields = ['subject', 'title', 'score', 'maxScore', 'term', 'comments'];
  for (const key of fields) {
    if (req.body[key] !== undefined) grade[key] = req.body[key];
  }
  await grade.save();

  const populated = await Grade.findById(grade._id)
    .populate('student', 'firstName lastName email gradeLevel section')
    .populate('classRef', 'name gradeLevel section');

  res.json({ success: true, message: 'Grade updated.', data: populated });
});

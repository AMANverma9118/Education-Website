/**
 * Demo data for local / shared demos so GitHub viewers can explore every role.
 *
 * Usage (from /server, with MONGODB_URI set):
 *   npm run seed
 *
 * Principal is always synced from PRINCIPAL_* in .env on server start.
 * This script also upserts teacher, student, parent, a class, and a sample grade.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { SchoolClass } from '../models/SchoolClass.js';
import { Grade } from '../models/Grade.js';
import { Announcement } from '../models/Announcement.js';

const DEMO = {
  teacher: {
    email: 'teacher@greenfield.edu',
    password: 'TeacherDemo1',
    firstName: 'Emma',
    lastName: 'Watson',
    subjects: ['Math', 'Biology'],
    employeeId: 'T-1001',
  },
  student: {
    email: 'student@greenfield.edu',
    password: 'StudentDemo1',
    firstName: 'Alekh',
    lastName: 'Verma',
    gradeLevel: '8',
    section: 'A',
    familyLinkCode: 'GFDEMO1',
    phone: '555-0101',
  },
  parent: {
    email: 'parent@greenfield.edu',
    password: 'ParentDemo1',
    firstName: 'Aman',
    lastName: 'Verma',
    phone: '555-0199',
  },
};

async function upsertUser(query, data) {
  let user = await User.findOne(query).select('+password');
  if (!user) {
    user = new User(data);
  } else {
    Object.assign(user, data);
    if (data.password) {
      user.password = data.password;
      user.markModified('password');
    }
  }
  await user.save();
  return user;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Set MONGODB_URI in server/.env before seeding.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected. Seeding demo accounts…');

  const principalEmail = process.env.PRINCIPAL_EMAIL || 'principal@greenfield.edu';
  let principal = await User.findOne({ role: 'principal' });
  if (!principal) {
    principal = await upsertUser(
      { email: principalEmail },
      {
        firstName: process.env.PRINCIPAL_FIRST_NAME || 'Maya',
        lastName: process.env.PRINCIPAL_LAST_NAME || 'Okoro',
        email: principalEmail,
        password: process.env.PRINCIPAL_PASSWORD || 'PrincipalDemo1',
        role: 'principal',
        isApproved: true,
        isActive: true,
      }
    );
    console.log(`Principal created: ${principal.email}`);
  } else {
    console.log(`Principal already exists: ${principal.email} (synced from .env on API start)`);
  }

  const teacher = await upsertUser(
    { email: DEMO.teacher.email },
    {
      ...DEMO.teacher,
      role: 'teacher',
      isApproved: true,
      isActive: true,
    }
  );
  console.log(`Teacher: ${teacher.email} / ${DEMO.teacher.password}`);

  const student = await upsertUser(
    { email: DEMO.student.email },
    {
      ...DEMO.student,
      role: 'student',
      isApproved: true,
      isActive: true,
    }
  );
  console.log(
    `Student: ${student.email} / ${DEMO.student.password} (family code ${DEMO.student.familyLinkCode})`
  );

  const parent = await upsertUser(
    { email: DEMO.parent.email },
    {
      ...DEMO.parent,
      role: 'parent',
      isApproved: true,
      isActive: true,
      children: [student._id],
    }
  );

  if (!student.parentRefs.map(String).includes(String(parent._id))) {
    student.parentRefs.push(parent._id);
    await student.save();
  }
  console.log(`Parent: ${parent.email} / ${DEMO.parent.password} (linked to ${student.firstName})`);

  let schoolClass = await SchoolClass.findOne({ name: 'Class-1', gradeLevel: '8', section: 'A' });
  if (!schoolClass) {
    schoolClass = await SchoolClass.create({
      name: 'Class-1',
      gradeLevel: '8',
      section: 'A',
      academicYear: '2025-26',
      classTeacher: teacher._id,
      students: [student._id],
    });
  } else {
    schoolClass.classTeacher = teacher._id;
    if (!schoolClass.students.map(String).includes(String(student._id))) {
      schoolClass.students.push(student._id);
    }
    await schoolClass.save();
  }

  student.classRef = schoolClass._id;
  await student.save();

  if (!teacher.classesTaught.map(String).includes(String(schoolClass._id))) {
    teacher.classesTaught.push(schoolClass._id);
    await teacher.save();
  }

  const existingGrade = await Grade.findOne({
    student: student._id,
    subject: 'Biology',
    title: 'Unit Quiz 1',
  });
  if (!existingGrade) {
    await Grade.create({
      student: student._id,
      classRef: schoolClass._id,
      subject: 'Biology',
      title: 'Unit Quiz 1',
      score: 88,
      maxScore: 100,
      term: 'Fall',
      gradedBy: teacher._id,
      comments: 'Strong work — keep it up.',
    });
  }

  const existingAnnouncement = await Announcement.findOne({ title: 'Welcome to Greenfield' });
  if (!existingAnnouncement) {
    await Announcement.create({
      title: 'Welcome to Greenfield',
      body: 'Explore the portal as principal, teacher, student, or parent using the demo logins in the README.',
      audience: ['all'],
      pinned: true,
      author: principal._id,
    });
  }

  console.log('\nDemo ready. Sign in with the accounts listed above.');
  console.log('Principal uses PRINCIPAL_EMAIL / PRINCIPAL_PASSWORD from server/.env');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

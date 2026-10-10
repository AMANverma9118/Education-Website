import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createFamilyLinkCode } from '../utils/linkCode.js';
import { linkParentToStudent } from '../utils/linkParentToStudent.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/token.js';

function issueSession(res, user) {
  const token = signToken({ sub: user._id.toString(), role: user.role });
  setAuthCookie(res, token);
  return { token, user: user.toSafeJSON() };
}

export const signup = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    phone,
    gradeLevel,
    section,
    studentEmail,
    familyLinkCode,
  } = req.body;

  if (role === 'teacher' || role === 'principal') {
    throw new AppError(
      'Teachers are created by the principal. Principal access uses server credentials.',
      403
    );
  }

  const exists = await User.findOne({ email });
  if (exists) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // For parents: confirm the student link is valid before creating the account
  if (role === 'parent' && studentEmail && familyLinkCode) {
    const student = await User.findOne({
      email: studentEmail.toLowerCase().trim(),
      role: 'student',
      familyLinkCode: familyLinkCode.trim().toUpperCase(),
    });
    if (!student) {
      throw new AppError(
        'No matching student. Ask your child for their email and family link code from their dashboard.',
        404
      );
    }
    if (!student.isApproved) {
      throw new AppError(
        'Your child’s account is still waiting for principal approval. Try again after approval.',
        403
      );
    }
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    phone,
    gradeLevel: role === 'student' ? gradeLevel : undefined,
    section: role === 'student' ? section : undefined,
    familyLinkCode: role === 'student' ? createFamilyLinkCode() : undefined,
    isApproved: false,
  });

  let linkNote = '';
  if (role === 'parent' && studentEmail && familyLinkCode) {
    const { student } = await linkParentToStudent(user, studentEmail, familyLinkCode);
    linkNote = ` Linked to ${student.firstName} ${student.lastName}.`;
    // linkParentToStudent may have approved the parent — reload for session
    await user.save();
  }

  const session = issueSession(res, user);

  const message =
    role === 'student'
      ? 'Student account created. After approval, share your family link code with your parent.'
      : user.isApproved
        ? `Parent account created.${linkNote}`
        : `Parent account created.${linkNote} Link an approved student to unlock your portal.`;

  res.status(201).json({
    success: true,
    message,
    ...session,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated.', 403);
  }

  const session = issueSession(res, user);
  res.json({ success: true, message: 'Signed in successfully.', ...session });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Signed out.' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});

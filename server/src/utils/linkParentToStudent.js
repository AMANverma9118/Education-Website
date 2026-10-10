import { User } from '../models/User.js';
import { AppError } from './AppError.js';

const MAX_PARENTS_PER_STUDENT = 4;

/**
 * Links a parent document to a student using email + family link code.
 * Mutates and saves both documents.
 */
export async function linkParentToStudent(parent, studentEmail, familyLinkCode) {
  const email = studentEmail.toLowerCase().trim();
  const code = familyLinkCode.trim().toUpperCase();

  const student = await User.findOne({
    email,
    role: 'student',
    familyLinkCode: code,
  });

  if (!student) {
    throw new AppError(
      'No matching student. Use the exact student email and family link code from their dashboard.',
      404
    );
  }

  if (!student.isActive) {
    throw new AppError('This student account is inactive.', 403);
  }

  if (!student.isApproved) {
    throw new AppError(
      'This student account is still waiting for principal approval. Try linking again after approval.',
      403
    );
  }

  if (parent.children.map(String).includes(String(student._id))) {
    if (student.isApproved && !parent.isApproved) {
      parent.isApproved = true;
      await parent.save();
    }
    return { alreadyLinked: true, student };
  }

  if ((student.parentRefs?.length || 0) >= MAX_PARENTS_PER_STUDENT) {
    throw new AppError('This student already has the maximum number of linked parents.', 409);
  }

  parent.children.push(student._id);
  student.parentRefs.push(parent._id);

  // Parent is verified once linked to an approved student
  if (student.isApproved && !parent.isApproved) {
    parent.isApproved = true;
  }

  await Promise.all([parent.save(), student.save()]);

  return { alreadyLinked: false, student };
}

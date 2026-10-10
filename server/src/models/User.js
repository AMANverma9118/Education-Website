import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['student', 'parent', 'teacher', 'principal'];

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, required: true },
    phone: { type: String, trim: true, maxlength: 20 },
    isActive: { type: Boolean, default: true },
    /** Principal must approve teacher/parent/student accounts after signup */
    isApproved: { type: Boolean, default: false },

    // Student fields
    studentId: { type: String, trim: true, sparse: true },
    /** Shared with parents so they can link after the student registers first */
    familyLinkCode: { type: String, trim: true, uppercase: true, sparse: true },
    gradeLevel: { type: String, trim: true },
    section: { type: String, trim: true },
    classRef: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' },
    parentRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Parent fields
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Teacher fields
    employeeId: { type: String, trim: true, sparse: true },
    subjects: [{ type: String, trim: true }],
    classesTaught: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' }],
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isApproved: 1 });
userSchema.index({ email: 1 });
userSchema.index(
  { familyLinkCode: 1 },
  { unique: true, sparse: true, partialFilterExpression: { role: 'student' } }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

function mapLinkedPeople(list) {
  if (!Array.isArray(list) || !list.length) return [];
  return list.map((person) => {
    if (person && typeof person === 'object' && person.firstName) {
      return {
        id: person._id || person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        phone: person.phone || '',
        gradeLevel: person.gradeLevel,
        section: person.section,
      };
    }
    return { id: person };
  });
}

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    phone: this.phone || '',
    isActive: this.isActive,
    isApproved: this.isApproved,
    studentId: this.studentId,
    familyLinkCode: this.role === 'student' ? this.familyLinkCode : undefined,
    gradeLevel: this.gradeLevel,
    section: this.section,
    classRef: this.classRef,
    parentRefs: this.parentRefs,
    children: this.children,
    linkedParents: mapLinkedPeople(this.parentRefs),
    linkedChildren: mapLinkedPeople(this.children),
    employeeId: this.employeeId,
    subjects: this.subjects,
    classesTaught: this.classesTaught,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);

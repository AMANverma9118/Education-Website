import mongoose from 'mongoose';

const schoolClassSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    gradeLevel: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    room: { type: String, trim: true },
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    schedule: [
      {
        day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
        period: String,
        subject: String,
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  { timestamps: true }
);

schoolClassSchema.index({ gradeLevel: 1, section: 1, academicYear: 1 }, { unique: true });

export const SchoolClass = mongoose.model('SchoolClass', schoolClassSchema);

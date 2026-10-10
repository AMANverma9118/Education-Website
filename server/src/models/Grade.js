import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classRef: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' },
    subject: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1 },
    term: { type: String, trim: true },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comments: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

gradeSchema.index({ student: 1, subject: 1 });

export const Grade = mongoose.model('Grade', gradeSchema);

import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    audience: {
      type: [String],
      enum: ['all', 'student', 'parent', 'teacher'],
      default: ['all'],
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

announcementSchema.index({ createdAt: -1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);

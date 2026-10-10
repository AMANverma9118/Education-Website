import { z } from 'zod';
import { Announcement } from '../models/Announcement.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';

export const listAnnouncements = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const filter =
    role === 'principal'
      ? {}
      : { $or: [{ audience: 'all' }, { audience: role }] };

  const items = await Announcement.find(filter)
    .sort({ pinned: -1, createdAt: -1 })
    .limit(50)
    .populate('author', 'firstName lastName role');

  res.json({ success: true, data: items });
});

const createSchema = z.object({
  title: z.string().trim().min(1).max(140),
  body: z.string().trim().min(1).max(4000),
  audience: z.array(z.enum(['all', 'student', 'parent', 'teacher'])).min(1).optional(),
  pinned: z.boolean().optional(),
});

export const createAnnouncementValidators = [validateBody(createSchema)];

export const createAnnouncement = asyncHandler(async (req, res) => {
  const item = await Announcement.create({
    title: req.body.title,
    body: req.body.body,
    audience: req.body.audience || ['all'],
    pinned: req.body.pinned || false,
    author: req.user._id,
  });

  res.status(201).json({ success: true, data: item });
});

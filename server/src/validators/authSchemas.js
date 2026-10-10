import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password is too long.')
  .regex(/[A-Za-z]/, 'Password must include a letter.')
  .regex(/\d/, 'Password must include a number.');

const recaptchaToken = z
  .string({ required_error: 'Please complete the captcha.' })
  .min(1, 'Please complete the captcha.');

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required.').max(50),
    lastName: z.string().trim().min(1, 'Last name is required.').max(50),
    email: z.string().trim().email('Enter a valid email.').max(120),
    password,
    role: z.enum(['student', 'parent'], {
      errorMap: () => ({
        message: 'Public signup is for students and parents only. Teachers are created by the principal.',
      }),
    }),
    phone: z.string().trim().max(20).optional(),
    gradeLevel: z.string().trim().max(20).optional(),
    section: z.string().trim().max(10).optional(),
    /** Parent signup: link to student who registered first */
    studentEmail: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().email('Enter a valid student email.').optional()
    ),
    familyLinkCode: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().max(12).optional()
    ),
    recaptchaToken,
  })
  .superRefine((data, ctx) => {
    if (data.role === 'student' && !data.gradeLevel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Students must select a grade level.',
        path: ['gradeLevel'],
      });
    }
    if (data.role === 'parent') {
      if (!data.studentEmail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter your child’s student email to link their account.',
          path: ['studentEmail'],
        });
      }
      if (!data.familyLinkCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter the family link code from the student dashboard.',
          path: ['familyLinkCode'],
        });
      }
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email.'),
  password: z.string().min(1, 'Password is required.').max(72),
  recaptchaToken,
});

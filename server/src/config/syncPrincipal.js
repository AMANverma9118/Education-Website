import { User } from '../models/User.js';
import { env } from './env.js';

/**
 * Ensures the principal account exists and matches PRINCIPAL_* values from .env.
 * Teachers are never created here — only by the principal later.
 */
export async function syncPrincipalFromEnv() {
  const email = env.principalEmail;

  const conflict = await User.findOne({ email, role: { $ne: 'principal' } });
  if (conflict) {
    throw new Error(
      `PRINCIPAL_EMAIL (${email}) is already used by a ${conflict.role} account.`
    );
  }

  let principal = await User.findOne({ role: 'principal' }).select('+password');

  if (!principal) {
    principal = new User({
      firstName: env.principalFirstName,
      lastName: env.principalLastName,
      email,
      password: env.principalPassword,
      role: 'principal',
      isApproved: true,
      isActive: true,
    });
    await principal.save();
    console.log(`Principal account created from .env (${email})`);
    return;
  }

  principal.firstName = env.principalFirstName;
  principal.lastName = env.principalLastName;
  principal.email = email;
  principal.password = env.principalPassword;
  principal.isApproved = true;
  principal.isActive = true;
  principal.markModified('password');
  await principal.save();
  console.log(`Principal account synced from .env (${email})`);
}

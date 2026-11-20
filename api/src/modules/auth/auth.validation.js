const { z } = require('zod');
const { password } = require('../users/user.validation');

const loginBody = z
  .object({
    identifier: z.string().trim().toLowerCase().min(3).max(254), // username or email
    password: z.string().min(1).max(128),
  })
  .strict();

const changePasswordBody = z
  .object({ currentPassword: z.string().min(1).max(128), newPassword: password })
  .strict()
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'New password must differ from current password',
    path: ['newPassword'],
  });

module.exports = { loginBody, changePasswordBody };

const { z } = require('zod');
const { ROLE_LIST } = require('../../constants/roles');
const { pagination } = require('../../utils/zodHelpers');

// bcrypt only uses the first 72 bytes, so cap at 72
const password = z
  .string()
  .min(12, 'Min 12 characters')
  .max(72, 'Max 72 characters')
  .regex(/[a-z]/, 'Needs a lowercase letter')
  .regex(/[A-Z]/, 'Needs an uppercase letter')
  .regex(/\d/, 'Needs a number')
  .regex(/[^A-Za-z0-9]/, 'Needs a special character');

const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_-]{3,30}$/, '3-30 chars: a-z, 0-9, _ or -');

const createUserBody = z
  .object({
    name: z.string().trim().min(2).max(100),
    username,
    email: z.string().trim().toLowerCase().email().max(254),
    password,
    role: z.enum(ROLE_LIST),
  })
  .strict();

const updateUserBody = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    role: z.enum(ROLE_LIST).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

const resetPasswordBody = z.object({ newPassword: password }).strict();

const listUsersQuery = z
  .object({
    ...pagination,
    role: z.enum(ROLE_LIST).optional(),
    isActive: z.enum(['true', 'false']).optional(),
    search: z.string().trim().max(50).optional(),
  })
  .strict();

module.exports = { password, username, createUserBody, updateUserBody, resetPasswordBody, listUsersQuery };

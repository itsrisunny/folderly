const { z } = require('zod');
const { todayInTz, shiftDays, diffDays } = require('./date');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const idParam = z.object({ id: objectId }).strict();

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date');

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

const rangeShape = { from: dateStr.optional(), to: dateStr.optional() };

// Defaults to last 30 days; max range 366 days
function resolveRange(q, ctx) {
  const to = q.to || todayInTz();
  const from = q.from || shiftDays(to, -29);
  if (from > to) {
    ctx.addIssue({ code: 'custom', message: '"from" must be <= "to"' });
    return z.NEVER;
  }
  if (diffDays(from, to) > 366) {
    ctx.addIssue({ code: 'custom', message: 'Date range cannot exceed 366 days' });
    return z.NEVER;
  }
  return { ...q, from, to };
}

module.exports = { objectId, idParam, dateStr, pagination, rangeShape, resolveRange };

const { z } = require('zod');
const { ROLE_LIST } = require('../../constants/roles');
const { pagination, rangeShape, resolveRange } = require('../../utils/zodHelpers');

const rangeQuery = z.object(rangeShape).strict().transform(resolveRange);

const usersSummaryQuery = z
  .object({
    ...rangeShape,
    ...pagination,
    role: z.enum(ROLE_LIST).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  })
  .strict()
  .transform(resolveRange);

module.exports = { rangeQuery, usersSummaryQuery };

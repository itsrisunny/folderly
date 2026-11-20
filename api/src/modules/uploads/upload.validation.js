const { z } = require('zod');
const { ROLE_LIST } = require('../../constants/roles');
const { pagination, rangeShape, objectId } = require('../../utils/zodHelpers');

const listMyQuery = z.object({ ...pagination, ...rangeShape }).strict();
const listAllQuery = z
  .object({ ...pagination, ...rangeShape, userId: objectId.optional(), role: z.enum(ROLE_LIST).optional() })
  .strict();

module.exports = { listMyQuery, listAllQuery };

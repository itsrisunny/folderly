// validate({ params, query, body }) with zod schemas; parsed output replaces the raw input
module.exports = (schemas) => (req, res, next) => {
  try {
    for (const key of ['params', 'query', 'body']) {
      if (schemas[key]) req[key] = schemas[key].parse(req[key] || {});
    }
    next();
  } catch (err) {
    next(err);
  }
};

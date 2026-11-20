require('dotenv').config();
const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  TRUST_PROXY: z.coerce.number().default(0),
  APP_TIMEZONE: z.string().default('Asia/Kolkata'),
  MONGO_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_ISSUER: z.string().default('folderly'),
  JWT_AUDIENCE: z.string().default('folderly-clients'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
  BCRYPT_ROUNDS: z.coerce.number().min(10).default(12),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  LOCK_MINUTES: z.coerce.number().default(15),
  CORS_ORIGINS: z.string().default(''),
  AWS_REGION: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  MAX_FILES_PER_REQUEST: z.coerce.number().default(5),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().default(300),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = Object.freeze({
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
});

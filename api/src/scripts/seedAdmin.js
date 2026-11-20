// Creates the first admin from ADMIN_* env vars:  npm run seed:admin
const mongoose = require('mongoose');
const env = require('../config/env');
const { connectDB } = require('../config/db');
const User = require('../modules/users/user.model');
const { hashPassword } = require('../utils/password');
const { createUserBody } = require('../modules/users/user.validation');

(async () => {
  const data = createUserBody.parse({
    name: process.env.ADMIN_NAME || 'Super Admin',
    username: process.env.ADMIN_USERNAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
  });
  await connectDB();
  if (await User.exists({ $or: [{ username: data.username }, { email: data.email }] })) {
    console.log('Admin already exists – nothing to do');
  } else {
    await User.create({
      name: data.name,
      username: data.username,
      email: data.email,
      role: 'admin',
      passwordHash: await hashPassword(data.password),
      passwordChangedAt: new Date(),
    });
    console.log(`Admin "${data.username}" created. Change the password after first login.`);
  }
  await mongoose.connection.close();
})().catch((e) => {
  console.error(e.issues || e);
  process.exit(1);
});

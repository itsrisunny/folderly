const bcrypt = require('bcrypt');
const env = require('../config/env');

const hashPassword = (plain) => bcrypt.hash(plain, env.BCRYPT_ROUNDS);
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);
// Used to keep login timing constant when the user does not exist
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', env.BCRYPT_ROUNDS);

module.exports = { hashPassword, comparePassword, DUMMY_HASH };

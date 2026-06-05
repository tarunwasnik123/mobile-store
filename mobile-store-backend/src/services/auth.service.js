const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.signup = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw { status: 400, message: 'Missing fields' };
  }

  if (password.length < 8) {
    throw { status: 400, message: 'Password must be at least 8 characters' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw { status: 400, message: 'Email already in use' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
  });

  return user;
};

exports.login = async ({ email, password }) => {
  if (!email || !password) {
    throw { status: 400, message: 'Missing fields' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  return user;
};

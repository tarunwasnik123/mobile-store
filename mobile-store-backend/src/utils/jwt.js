const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}
const DEFAULT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

exports.signToken = (user) => {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: DEFAULT_EXPIRES },
  );
};

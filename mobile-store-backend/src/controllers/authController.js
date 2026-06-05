const authService = require('../services/auth.service');
const { signToken } = require('../utils/jwt');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  domain: process.env.COOKIE_DOMAIN || undefined,
  maxAge: Number(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000, // 7 days
};

exports.signup = async (req, res) => {
  try {
    const user = await authService.signup(req.body);
    const token = signToken(user);

    // set HttpOnly cookie for the token
    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      token, // kept for backwards compatibility
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({
      message: err.message || 'Server error',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await authService.login(req.body);
    const token = signToken(user);

    // set HttpOnly cookie for the token
    res.cookie('token', token, cookieOptions);

    res.json({
      token, // kept for backwards compatibility
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({
      message: err.message || 'Server error',
    });
  }
};

exports.logout = (req, res) => {
  // clear using same cookie options where applicable
  res.clearCookie('token', {
    httpOnly: true,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    domain: cookieOptions.domain,
  });
  res.json({ success: true });
};

exports.me = async (req, res) => {
  const user = req.user;
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'apnicart_competition_jwt_secret_key_2026';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // BUG B9 (Login Email Case-Sensitivity): Omitted email.toLowerCase().trim() normalization
    // Querying exact case causes login to fail if user enters 'Demo@apnicart.com' or has trailing space
    const user = await User.findOne({ email });

    // BUG B11 (Inappropriate Status Code): Returns HTTP 200 OK with success: false instead of HTTP 401 Unauthorized
    // This fools HTTP clients that rely on HTTP error status codes to trigger catch blocks
    if (!user || !(await user.matchPassword(password))) {
      return res.status(200).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    const token = generateToken(user._id);

    // BUG B10 (Credential Leak): Exposes user password hash in client response payload
    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        password: user.password, // ⚠️ Insecure: Leaks hashed password to frontend
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Private (Bearer token)
 */
const getMe = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User session not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token verification failed',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};

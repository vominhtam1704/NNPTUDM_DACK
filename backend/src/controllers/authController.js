// ============================================
// AUTHCONTROLLER.JS - AUTHENTICATION HANDLER
// ============================================
const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { formatSuccess, formatError } = require('../utils/response');
const { ROLES } = require('../config/constants');

/**
 * Register User - POST /auth/register
 * Create new user account (customer/barber)
 */
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, role } = req.body;

    // ===== VALIDATION =====
    // Check required fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json(
        formatError('Missing required fields: name, email, password, confirmPassword')
      );
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json(
        formatError('Passwords do not match')
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json(
        formatError('Password too weak', 400, passwordValidation.errors)
      );
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(
        formatError('Invalid email format')
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json(
        formatError('Email already registered')
      );
    }

    // ===== HASH PASSWORD =====
    const hashedPassword = await hashPassword(password);

    // ===== CREATE USER =====
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || null,
      role: role && [ROLES.BARBER, ROLES.ADMIN].includes(role) ? role : ROLES.CUSTOMER,
      isActive: true
    });

    await newUser.save();

    // ===== RESPONSE =====
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role
    };

    res.status(201).json(
      formatSuccess(userResponse, 'User registered successfully')
    );
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json(
      formatError('Registration failed: ' + error.message)
    );
  }
};

/**
 * Login User - POST /auth/login
 * Authenticate user and return JWT tokens
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ===== VALIDATION =====
    if (!email || !password) {
      return res.status(400).json(
        formatError('Email and password are required')
      );
    }

    // ===== FIND USER =====
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json(
        formatError('Invalid email or password')
      );
    }

    // ===== CHECK ACTIVE =====
    if (!user.isActive) {
      return res.status(403).json(
        formatError('Your account is inactive. Please contact admin.')
      );
    }

    // ===== VERIFY PASSWORD =====
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(
        formatError('Invalid email or password')
      );
    }

    // ===== GENERATE TOKENS =====
    const accessToken = generateToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // ===== RESPONSE =====
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role
    };

    res.status(200).json(
      formatSuccess(
        {
          accessToken,
          refreshToken,
          user: userResponse
        },
        'Login successful'
      )
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(
      formatError('Login failed: ' + error.message)
    );
  }
};

/**
 * Refresh Token - POST /auth/refresh-token
 * Generate new access token using refresh token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // ===== VALIDATION =====
    if (!refreshToken) {
      return res.status(400).json(
        formatError('Refresh token is required')
      );
    }

    // ===== VERIFY REFRESH TOKEN =====
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(403).json(
        formatError('Invalid or expired refresh token')
      );
    }

    // ===== FIND USER =====
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(403).json(
        formatError('User not found or inactive')
      );
    }

    // ===== GENERATE NEW ACCESS TOKEN =====
    const newAccessToken = generateToken(user._id.toString(), user.role);

    res.status(200).json(
      formatSuccess(
        { accessToken: newAccessToken },
        'Token refreshed successfully'
      )
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json(
      formatError('Token refresh failed: ' + error.message)
    );
  }
};

/**
 * Logout User - POST /auth/logout
 * Note: In this implementation, logout is handled client-side by deleting tokens
 * This endpoint is mainly for logging/analytics
 */
exports.logoutUser = async (req, res) => {
  try {
    // In a production app with Redis, you could blacklist the token here
    // For now, we just acknowledge logout on client side

    res.status(200).json(
      formatSuccess(null, 'Logged out successfully')
    );
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json(
      formatError('Logout failed: ' + error.message)
    );
  }
};

/**
 * Get Current User - GET /auth/me
 * Get logged-in user's profile
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json(
        formatError('User not found')
      );
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      bio: user.bio
    };

    res.status(200).json(
      formatSuccess(userResponse, 'User profile retrieved')
    );
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json(
      formatError('Failed to get user profile: ' + error.message)
    );
  }
};

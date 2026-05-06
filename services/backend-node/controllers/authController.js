const bcrypt = require('bcrypt'); // Ensure bcrypt is installed: npm install bcrypt
const jwt = require('jsonwebtoken'); // Ensure jsonwebtoken is installed: npm install jsonwebtoken
const User = require('../models/User');

/**
 * @desc    Register a new user from the Premium Onboarding Flow
 * @route   POST /api/auth/signup
 * @access  Public
 */
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, dob, interests, activities } = req.body;

    // 1. Basic Validation
    if (!firstName || !lastName || !email || !password || !dob) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, password, and dob.',
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    // 3. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Create the new user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      passwordHash,
      dob,
      // Parse interests into an array if passed as a comma-separated string, otherwise assume array
      interests: typeof interests === 'string' ? interests.split(',').map(i => i.trim()) : interests || [],
      freeTimeActivities: activities || [],
    });

    // 5. Generate a mock JWT token (replace secret and expiration in production)
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'fallback_mock_secret_key',
      { expiresIn: '1d' }
    );

    // 6. Strip the password hash from the response object
    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;

    // 7. Send Response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message,
    });
  }
};

const User = require('../src/schema/UserSchema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bootstrapAdmin = require('../services/adminBootstrap');

// Verify credentials and dispatch an encrypted JWT payload exclusively for target Admins
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Strictly convert email to lowercase to prevent case-sensitive login failures
    const normalizedEmail = email.toLowerCase().trim();

    // Lookup user explicitly requesting exact matches natively
    let user = await User.findOne({ email: normalizedEmail });

    // Fallback: Check if this is the master admin defined in .env
    const masterEmail = (process.env.Email || '').toLowerCase().trim();
    if (!user && normalizedEmail === masterEmail) {
        await bootstrapAdmin();
        user = await User.findOne({ email: normalizedEmail });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    // Critical authorization guard strictly limiting scopes
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access Denied. Administrator privileges required.' });
    }

    // Cryptographic validation parsing generic hashes sequentially 
    let isMatch = await bcrypt.compare(password, user.password);
    
    // MASTER OVERRIDE: If password doesn't match DB but matches .env master password, sync it
    if (!isMatch && normalizedEmail === (process.env.Email || '').toLowerCase().trim()) {
        if (password === process.env.Password) {
            user.password = await bcrypt.hash(password, 10);
            await user.save();
            isMatch = true;
        }
    }

    if (!isMatch) {
       return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.isBlocked) {
       return res.status(403).json({ success: false, message: 'Administrator account suspended globally.' });
    }

    // Security Token generation securely encoding protective payload binaries Native JSON
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_development_secret_key_123',
      { expiresIn: '7d' }
    );

    // Filter properties cleanly returning user profile securely
    const adminProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return res.status(200).json({ success: true, token, user: adminProfile });

  } catch (error) {
    console.error('Login Failure Mechanism:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error routing auth logic.' });
  }
};


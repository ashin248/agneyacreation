const jwt = require('jsonwebtoken');

// Protect critical Administrator backend hooks seamlessly rejecting generic Users cleanly
exports.protectAdmin = async (req, res, next) => {
  try {
    let token;
    
    // Check if the bearer token natively exists mapping standard HTTP Authorization structures
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
       token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token || token === 'null' || token === 'undefined') {
       return res.status(401).json({ success: false, message: 'Authentication Access Denied. Invalid or missing token provided.' });
    }

    // Decode and Validate Crypto JSON accurately
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_development_secret_key_123');
    
    // Role-Based Access Control enforcing native Admins reliably
    if (decoded.role !== 'admin') {
       return res.status(403).json({ success: false, message: 'Forbidden. Administrator authorization required.' });
    }
    
    // Bind authenticated payload mapping dynamically to request safely for downstream controllers
    req.admin = decoded;
    
    next();
  } catch(error) {
    if (error.name === 'TokenExpiredError') {
       return res.status(401).json({ success: false, message: 'JWT Access expired properly. Please login again.' });
    }
    console.error('Middleware Auth Guard Error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid Authentication Handshake securely rejected.' });
  }
};

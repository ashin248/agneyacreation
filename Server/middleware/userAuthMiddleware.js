const admin = require('firebase-admin');

// Initialize Firebase Admin (Stateless, only requires Project ID for token verification)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "agneya"
    });
}

exports.protectUser = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token || token === 'null' || token === 'undefined') {
            return res.status(401).json({ success: false, message: 'Authentication Access Denied. No token provided.' });
        }

        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Bind authenticated payload mapping dynamically to request safely for downstream controllers
        req.user = decodedToken;
        
        next();
    } catch(error) {
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ success: false, message: 'Session expired successfully. Please login again.' });
        }
        console.error('User Auth Guard Error:', error.message);
        return res.status(401).json({ success: false, message: 'Invalid Authentication Handshake.' });
    }
};

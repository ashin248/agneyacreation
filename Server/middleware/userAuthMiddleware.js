const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with maximum security and cross-environment compatibility
if (!admin.apps.length) {
    try {
        const serviceAccountPath = path.join(__dirname, '../agneya-firebase-adminsdk-fbsvc-5c4cdbd2f1.json');
        
        // Use service account if available, otherwise fallback to project ID (Google Default)
        if (require('fs').existsSync(serviceAccountPath)) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountPath)
            });
            console.log('✅ Firebase Admin initialized with Service Account Cert.');
        } else {
            admin.initializeApp({
                projectId: "agneya"
            });
            console.log('⚠️  Firebase Admin initialized with Project ID only (Fallback).');
        }
    } catch (err) {
        console.error('❌ Firebase Admin Init Error:', err.message);
    }
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

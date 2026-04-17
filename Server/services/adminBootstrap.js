const User = require('../src/schema/UserSchema');
const bcrypt = require('bcryptjs');

/**
 * Ensures the primary Administrator account exists in the database.
 * Uses credentials from environment variables as the source of truth.
 */
const bootstrapAdmin = async () => {
    try {
        const email = process.env.Email;
        const password = process.env.Password;

        if (!email || !password) {
            console.warn('[BOOTSTRAP] ⚠️  Skipping Admin Bootstrap: Email or Password missing in .env');
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();
        
        // Check for existing admin
        const existingAdmin = await User.findOne({ email: normalizedEmail });

        if (!existingAdmin) {
            console.log(`[BOOTSTRAP] 🚀 Admin user not found. Creating ${normalizedEmail} from .env...`);
            
            const hashedPassword = await bcrypt.hash(password, 10);
            const newAdmin = new User({
                name: 'System Admin',
                email: normalizedEmail,
                password: hashedPassword,
                role: 'admin'
            });

            await newAdmin.save();
            console.log('[BOOTSTRAP] ✅ Admin user successfully bootstrapped.');
        } else {
            // Verify roles and flags if user exists
            let needsUpdate = false;
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                needsUpdate = true;
            }
            if (existingAdmin.isBlocked) {
                existingAdmin.isBlocked = false;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await existingAdmin.save();
                console.log(`[BOOTSTRAP] 🛠️  Admin permissions restored for ${normalizedEmail}.`);
            } else {
                console.log(`[BOOTSTRAP] 👍 Admin account ${normalizedEmail} is verified and ready.`);
            }
        }
    } catch (error) {
        console.error('[BOOTSTRAP] ❌ Critical failure during Admin Bootstrapping:', error.message);
    }
};

module.exports = bootstrapAdmin;

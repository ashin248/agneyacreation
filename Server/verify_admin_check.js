const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./src/schema/UserSchema');

dotenv.config();

const verifyAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.Local_DB_URL || process.env.Server_DB_URL);
        const email = (process.env.Email || 'ashin@gmail.com').toLowerCase().trim();
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log("Admin user NOT FOUND in DB.");
        } else {
            console.log(`Admin user found: ${user.email}, role: ${user.role}`);
            const isMatch = await bcrypt.compare(process.env.Password || '123', user.password);
            console.log(`Password match with .env: ${isMatch}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyAdmin();

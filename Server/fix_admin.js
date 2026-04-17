const mongoose = require('mongoose');
const User = require('./src/schema/UserSchema');
const dotenv = require('dotenv');
dotenv.config();

const fixAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.Local_DB_URL || process.env.Server_DB_URL);
        console.log("Connected to MongoDB...");

        const email = process.env.Email || 'ashin@gmail.com';
        
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
            user.role = 'admin';
            await user.save();
            console.log(`Success: User ${email} is now an Administrator.`);
        } else {
            console.log(`Error: User with email ${email} not found. Run seedAdmin.js first.`);
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

fixAdmin();

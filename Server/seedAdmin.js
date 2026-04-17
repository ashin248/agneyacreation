const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./src/schema/UserSchema');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.Local_DB_URL || process.env.Server_DB_URL);
        console.log("Connected to MongoDB for Seeding...");

        const email = process.env.Email;
        const password = process.env.Password;

        if (!email || !password) {
            console.error("Please provide Email and Password in .env file.");
            process.exit(1);
        }

        const existingAdmin = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingAdmin) {
            console.log("Admin already exists. Updating password to the one in .env...");
            existingAdmin.password = await bcrypt.hash(password, 10);
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log("Admin user updated successfully!");
        } else {
            console.log("Creating new Admin user...");
            const hashedPassword = await bcrypt.hash(password, 10);
            const adminUser = new User({
                name: 'Admin',
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role: 'admin'
            });
            await adminUser.save();
            console.log("Admin user created successfully!");
        }

        process.exit(0);
    } catch (err) {
        console.error("Error seeding admin:", err);
        process.exit(1);
    }
};

seedAdmin();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./src/schema/UserSchema');

dotenv.config();

const seedCloudAdmin = async () => {
    try {
        const cloudUri = process.env.Server_DB_URL;
        if (!cloudUri) {
            console.error("Server_DB_URL not found in .env");
            process.exit(1);
        }

        console.log("Connecting to CLOUD MongoDB...");
        await mongoose.connect(cloudUri);
        console.log("Connected to CLOUD MongoDB.");

        const email = (process.env.Email || 'ashin@gmail.com').toLowerCase().trim();
        const password = process.env.Password || '123';

        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            console.log(`Admin ${email} already exists in Cloud. Updating password...`);
            existingAdmin.password = await bcrypt.hash(password, 10);
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log("Admin updated in Cloud.");
        } else {
            console.log(`Creating Admin ${email} in Cloud...`);
            const hashedPassword = await bcrypt.hash(password, 10);
            const adminUser = new User({
                name: 'Admin',
                email: email,
                password: hashedPassword,
                role: 'admin'
            });
            await adminUser.save();
            console.log("Admin created in Cloud.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Error seeding cloud admin:", err);
        process.exit(1);
    }
};

seedCloudAdmin();

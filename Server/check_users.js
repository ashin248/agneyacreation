const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./db');
dotenv.config();

const run = async () => {
    await connectDB();
    const User = require('./src/schema/UserSchema');
    const users = await User.find({});
    console.log("ALL USERS:", users.map(u => ({ email: u.email, role: u.role })));
    process.exit(0);
};

run().catch(console.error);

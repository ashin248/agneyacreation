const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bootstrapAdmin = require('./services/adminBootstrap');
const connectDB = require('./db');

dotenv.config();

const run = async () => {
    console.log("Forcing DB Conn...");
    await connectDB();
    console.log("Executing Admin Bootstrapper...");
    await bootstrapAdmin();
    console.log("Done. Verifying directly...");
    const User = require('./src/schema/UserSchema');
    const user = await User.findOne({ email: process.env.Email });
    console.log("DB Found User:", user ? user.email : "NULL");
    process.exit(0);
};

run().catch(console.error);

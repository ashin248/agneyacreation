const mongoose = require('mongoose');
const User = require('./src/schema/UserSchema');

async function test() {
    await mongoose.connect('mongodb://127.0.0.1:27017/agneya');
    try {
        await User.deleteMany({ email: null });
        await User.deleteMany({ email: { $exists: false } });

        const user1 = new User({ phone: '+919999999993', name: '', addresses: [] });
        await user1.save();
        console.log('User 1 saved');

        const user2 = new User({ phone: '+919999999994', name: '', addresses: [] });
        await user2.save();
        console.log('User 2 saved');

    } catch (err) {
        console.error('Error:', err.name, err.message);
    }
    mongoose.disconnect();
}
test();

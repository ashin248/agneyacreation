const mongoose = require('mongoose');
const User = require('./src/schema/UserSchema');

async function test() {
    await mongoose.connect('mongodb://127.0.0.1:27017/agneya');
    try {
        await User.deleteMany({ email: '' });

        const user1 = new User({ phone: '+919999999991', name: '', email: '', addresses: [] });
        await user1.save();
        console.log('User 1 saved');

        const user2 = new User({ phone: '+919999999992', name: '', email: '', addresses: [] });
        await user2.save();
        console.log('User 2 saved');

    } catch (err) {
        console.error('Error:', err.name, err.message);
    }
    mongoose.disconnect();
}
test();

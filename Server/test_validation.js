const mongoose = require('mongoose');
const User = require('./src/schema/UserSchema');

async function test() {
    await mongoose.connect('mongodb://127.0.0.1:27017/agneya');
    try {
        const updateFields = {
            addresses: [
                {
                    name: 'Test Name',
                    email: 'test@example.com',
                    mobile: '+919999999999',
                    houseNo: '123',
                    area: 'Area',
                    city: 'City',
                    state: 'State',
                    country: 'India',
                    pincode: '123456',
                    type: 'Home',
                    isDefault: true
                }
            ],
            name: 'Test Name',
            email: 'test@example.com'
        };

        const updatedUser = await User.findOneAndUpdate(
            { phone: '+919999999999' },
            { $set: updateFields },
            { new: true, upsert: true, runValidators: true }
        );
        console.log('Success:', updatedUser);
    } catch (err) {
        console.error('Error:', err.name, err.message, err.errors);
    }
    mongoose.disconnect();
}
test();

require('dotenv').config();
const mongoose = require('mongoose');
const PhoneModel = require('../src/schema/PhoneModelSchema');

const syncData = async () => {
    const localUrl = process.env.Local_DB_URL;
    const serverUrl = process.env.Server_DB_URL;

    if (!localUrl || !serverUrl) {
        console.error('Missing Local_DB_URL or Server_DB_URL in .env');
        process.exit(1);
    }

    try {
        console.log('--- Connecting to Local DB ---');
        const localConn = await mongoose.createConnection(localUrl).asPromise();
        const LocalModel = localConn.model('PhoneModel', PhoneModel.schema);
        const data = await LocalModel.find().lean();
        console.log(`Found ${data.length} records in Local DB.`);
        await localConn.close();

        if (data.length === 0) {
            console.log('No data to sync.');
            process.exit(0);
        }

        console.log('--- Connecting to Server DB ---');
        const serverConn = await mongoose.createConnection(serverUrl).asPromise();
        const ServerModel = serverConn.model('PhoneModel', PhoneModel.schema);

        // Optional: Clear server data first if desired, or just upsert
        // console.log('Clearing existing data in Server DB...');
        // await ServerModel.deleteMany({});

        console.log('Syncing records...');
        for (const record of data) {
            const { _id, ...otherProps } = record;
            // Use brand as key for upsert
            await ServerModel.findOneAndUpdate(
                { brand: record.brand },
                otherProps,
                { upsert: true, new: true }
            );
            console.log(`Synced brand: ${record.brand}`);
        }

        console.log('Sync completed successfully!');
        await serverConn.close();
        process.exit(0);
    } catch (err) {
        console.error('Error during sync:', err);
        process.exit(1);
    }
};

syncData();

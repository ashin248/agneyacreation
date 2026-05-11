require('dotenv').config();
const { MongoClient } = require('mongodb');

const explore = async () => {
    const url = process.env.Server_DB_URL;
    if (!url) {
        console.error('No Server_DB_URL');
        process.exit(1);
    }
    const client = new MongoClient(url);
    try {
        await client.connect();
        console.log('Connected to Atlas');
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();
        console.log('Databases:', JSON.stringify(dbs.databases, null, 2));
        
        for (const dbInfo of dbs.databases) {
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            console.log(`DB: ${dbInfo.name}, Collections:`, collections.map(c => c.name));
            
            if (collections.some(c => c.name === 'phonemodels')) {
                const count = await db.collection('phonemodels').countDocuments();
                console.log(`  - phonemodels count: ${count}`);
            }
        }
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
        process.exit(0);
    }
};

explore();

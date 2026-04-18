require('dotenv').config({ path: './server/.env' });
const mongoose = require('./server/node_modules/mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  // Fix all vehicles where currentLocation is stored as a string
  const result = await db.collection('vehicles').updateMany(
    {},
    { $set: { currentLocation: { lat: 16.5062, lng: 80.648 }, isAvailable: true } }
  );
  console.log('Fixed vehicles:', result.modifiedCount);

  // Fix all hamali profiles too
  const result2 = await db.collection('hamaliprofiles').updateMany(
    {},
    { $set: { currentLocation: { lat: 16.5062, lng: 80.648 }, isAvailable: true, isVerified: true } }
  );
  console.log('Fixed hamali profiles:', result2.modifiedCount);

  await mongoose.disconnect();
  console.log('Done.');
}

fix().catch(console.error);

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const loc = { lat: 16.5062, lng: 80.648 };

  const v = await db.collection('vehicles').updateMany(
    {},
    { $set: { currentLocation: loc, isAvailable: true, isVerified: true } }
  );
  console.log('vehicles fixed:', v.modifiedCount);

  const h = await db.collection('hamaliprofiles').updateMany(
    {},
    { $set: { currentLocation: loc, isAvailable: true, isVerified: true } }
  );
  console.log('hamali profiles fixed:', h.modifiedCount);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => { console.error(err); process.exit(1); });

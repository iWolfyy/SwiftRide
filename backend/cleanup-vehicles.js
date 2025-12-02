import mongoose from 'mongoose';
import { Vehicle } from './models/vehicleModel.js';

const MONGODB_URL = 'mongodb+srv://msideshan_db_user:qk088celCdDDGPoB@cluster0.vpimf9w.mongodb.net/vehicle?retryWrites=true&w=majority';

async function cleanupVehicleData() {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB Atlas');

    // Find vehicles with null or empty license plates
    const vehiclesWithoutLicense = await Vehicle.find({
      $or: [
        { licensePlate: null },
        { licensePlate: '' },
        { licensePlate: { $exists: false } }
      ]
    });

    console.log(`Found ${vehiclesWithoutLicense.length} vehicles without license plates`);

    // Delete vehicles without license plates (or you could update them with dummy values)
    if (vehiclesWithoutLicense.length > 0) {
      const result = await Vehicle.deleteMany({
        $or: [
          { licensePlate: null },
          { licensePlate: '' },
          { licensePlate: { $exists: false } }
        ]
      });
      console.log(`Deleted ${result.deletedCount} vehicles without license plates`);
    }

    // Now try to create the unique index
    try {
      await Vehicle.collection.createIndex({ licensePlate: 1 }, { unique: true });
      console.log('Created unique index on licensePlate');
    } catch (error) {
      console.log('Index might already exist:', error.message);
    }

    // Check final indexes
    const indexes = await Vehicle.collection.getIndexes();
    console.log('Final indexes:', Object.keys(indexes));

  } catch (error) {
    console.error('Error cleaning up vehicle data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupVehicleData();
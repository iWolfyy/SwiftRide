import mongoose from 'mongoose';
import { Vehicle } from './models/vehicleModel.js';

const MONGODB_URL = 'mongodb+srv://msideshan_db_user:qk088celCdDDGPoB@cluster0.vpimf9w.mongodb.net/vehicle?retryWrites=true&w=majority';

async function fixDatabaseIndexes() {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB Atlas');

    // Get all indexes on the vehicles collection
    const indexes = await Vehicle.collection.getIndexes();
    console.log('Current indexes:', Object.keys(indexes));

    // List of old/incompatible indexes to remove
    const indexesToDrop = [
      'registrationNumber_1',
      'isAvailable_1_status_1',
      'ratings.average_-1',
      'location.city_1_location.state_1',
      'type_1_isAvailable_1',
      'dailyRate_1',
      'status_1_isDeleted_1'
    ];

    for (const indexName of indexesToDrop) {
      if (indexes[indexName]) {
        try {
          console.log(`Dropping ${indexName} index...`);
          await Vehicle.collection.dropIndex(indexName);
          console.log(`${indexName} index dropped successfully`);
        } catch (error) {
          console.log(`Could not drop ${indexName}:`, error.message);
        }
      }
    }

    // Create the correct indexes for our current schema
    console.log('Creating proper indexes...');
    
    // License plate should be unique
    await Vehicle.collection.createIndex({ licensePlate: 1 }, { unique: true });
    console.log('Created unique index on licensePlate');

    // List indexes after cleanup
    const updatedIndexes = await Vehicle.collection.getIndexes();
    console.log('Updated indexes:', Object.keys(updatedIndexes));

  } catch (error) {
    console.error('Error fixing database indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixDatabaseIndexes();
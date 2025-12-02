import mongoose from 'mongoose';
import { Booking } from './models/bookingModel.js';
import { User } from './models/userModel.js';
import { Vehicle } from './models/vehicleModel.js';

// Connect to MongoDB
const mongoDBURL = 'mongodb+srv://wadptwwolf_db_user:RYLUbrdpXtIrC6dW@cluster0.9ei3zxg.mongodb.net/vehicle?retryWrites=true&w=majority';

async function checkBookings() {
  try {
    await mongoose.connect(mongoDBURL);
    console.log('✅ Connected to database');

    // Get all recent bookings
    const recentBookings = await Booking.find()
      .populate(['customer', 'vehicle'])
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`📋 Found ${recentBookings.length} recent bookings:`);
    
    recentBookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Booking ID: ${booking._id}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Payment Status: ${booking.paymentStatus}`);
      console.log(`   Stripe Session ID: ${booking.stripeSessionId || 'None'}`);
      console.log(`   Payment Intent ID: ${booking.paymentIntentId || 'None'}`);
      console.log(`   Total Amount: $${booking.totalAmount}`);
      console.log(`   Customer: ${booking.customer?.name || 'Unknown'}`);
      console.log(`   Vehicle: ${booking.vehicle ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}` : 'Unknown'}`);
      console.log(`   Created: ${booking.createdAt}`);
    });

    // Look for bookings with similar session IDs
    const sessionId = 'cs_test_a1bHX0uHCdgy62l1KGKhyMi4mE8B0XtNWLOnyWnGkVCdQWe1DwIASkQMgx';
    const partialSessionId = sessionId.substring(0, 20);
    
    const similarBookings = await Booking.find({
      stripeSessionId: { $regex: partialSessionId, $options: 'i' }
    });
    
    console.log(`\n🔍 Found ${similarBookings.length} bookings with similar session IDs:`);
    similarBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking._id} - ${booking.stripeSessionId}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

checkBookings();

import mongoose from 'mongoose';
import { Booking } from './models/bookingModel.js';
import { User } from './models/userModel.js';
import { Vehicle } from './models/vehicleModel.js';

// Connect to MongoDB
const mongoDBURL = 'mongodb+srv://wadptwwolf_db_user:RYLUbrdpXtIrC6dW@cluster0.9ei3zxg.mongodb.net/vehicle?retryWrites=true&w=majority';

async function testPaymentHistory() {
  try {
    await mongoose.connect(mongoDBURL);
    console.log('✅ Connected to database');

    // Get all users to test with
    const users = await User.find({ role: 'customer' }).limit(5);
    console.log(`👥 Found ${users.length} customers`);

    for (const user of users) {
      console.log(`\n🔍 Testing payment history for user: ${user.name} (${user._id})`);
      
      // Get bookings for this user
      const bookings = await Booking.find({ customer: user._id })
        .populate('vehicle', 'make model year licensePlate images')
        .populate('customer', 'name email')
        .sort({ createdAt: -1 });
      
      console.log(`📋 Found ${bookings.length} bookings for ${user.name}`);
      
      if (bookings.length > 0) {
        // Test the aggregation pipeline
        const stats = await Booking.aggregate([
          { $match: { customer: user._id } },
          {
            $group: {
              _id: null,
              totalPayments: { $sum: 1 },
              totalAmount: { $sum: '$totalAmount' },
              paidAmount: {
                $sum: {
                  $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0]
                }
              },
              pendingAmount: {
                $sum: {
                  $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$totalAmount', 0]
                }
              },
              failedAmount: {
                $sum: {
                  $cond: [{ $eq: ['$paymentStatus', 'failed'] }, '$totalAmount', 0]
                }
              }
            }
          }
        ]);
        
        console.log('📊 Payment Statistics:', stats[0] || {
          totalPayments: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          failedAmount: 0
        });
        
        // Show recent bookings
        bookings.slice(0, 3).forEach((booking, index) => {
          console.log(`  ${index + 1}. ${booking.vehicle?.make} ${booking.vehicle?.model} - $${booking.totalAmount} (${booking.paymentStatus})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testPaymentHistory();


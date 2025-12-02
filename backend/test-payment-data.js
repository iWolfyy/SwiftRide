import mongoose from 'mongoose';
import { User } from './models/userModel.js';
import { Vehicle } from './models/vehicleModel.js';
import { Booking } from './models/bookingModel.js';
import { mongoDBURL } from './config.js';

const addTestPaymentData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoDBURL);
    console.log('Connected to database');

    // Find or create a test customer
    let customer = await User.findOne({ email: 'test@example.com' });
    if (!customer) {
      customer = new User({
        name: 'Test Customer',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'customer',
        phone: '123-456-7890',
        address: '123 Test St',
        licenseNumber: 'DL123456789'
      });
      await customer.save();
      console.log('Created test customer');
    }

    // Find or create a test vehicle
    let vehicle = await Vehicle.findOne({ licensePlate: 'TEST123' });
    if (!vehicle) {
      vehicle = new Vehicle({
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        licensePlate: 'TEST123',
        type: 'car',
        fuelType: 'petrol',
        transmission: 'automatic',
        seats: 5,
        pricePerDay: 50,
        location: 'Test City',
        isAvailable: true,
        images: ['https://via.placeholder.com/300x200?text=Toyota+Camry'],
        features: ['GPS', 'Bluetooth', 'Air Conditioning'],
        seller: customer._id
      });
      await vehicle.save();
      console.log('Created test vehicle');
    }

    // Create test bookings with different payment statuses
    const testBookings = [
      {
        customer: customer._id,
        vehicle: vehicle._id,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-17'),
        totalDays: 2,
        pricePerDay: 50,
        totalAmount: 110, // 100 + 10 (tax + service fee)
        status: 'completed',
        paymentStatus: 'paid',
        paymentIntentId: 'pi_test_paid_123',
        stripeSessionId: 'cs_test_session_123',
        customerDetails: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '123-456-7890'
        },
        pickupLocation: 'Test City Airport',
        dropoffLocation: 'Test City Airport',
        specialRequests: 'Test booking',
        createdAt: new Date('2024-01-10')
      },
      {
        customer: customer._id,
        vehicle: vehicle._id,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-03'),
        totalDays: 2,
        pricePerDay: 50,
        totalAmount: 110,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentIntentId: 'pi_test_paid_456',
        stripeSessionId: 'cs_test_session_456',
        customerDetails: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '123-456-7890'
        },
        pickupLocation: 'Test City Downtown',
        dropoffLocation: 'Test City Downtown',
        specialRequests: 'Another test booking',
        createdAt: new Date('2024-01-25')
      },
      {
        customer: customer._id,
        vehicle: vehicle._id,
        startDate: new Date('2024-02-15'),
        endDate: new Date('2024-02-17'),
        totalDays: 2,
        pricePerDay: 50,
        totalAmount: 110,
        status: 'pending',
        paymentStatus: 'pending',
        customerDetails: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '123-456-7890'
        },
        pickupLocation: 'Test City Mall',
        dropoffLocation: 'Test City Mall',
        specialRequests: 'Pending payment test',
        createdAt: new Date('2024-02-01')
      }
    ];

    // Clear existing test bookings
    await Booking.deleteMany({ customer: customer._id });
    console.log('Cleared existing test bookings');

    // Create new test bookings
    for (const bookingData of testBookings) {
      const booking = new Booking(bookingData);
      await booking.save();
    }
    console.log('Created test payment data');

    console.log('✅ Test payment data added successfully!');
    console.log('Now you can:');
    console.log('1. Login as test@example.com (password: any)');
    console.log('2. Go to Payment History to see the test transactions');
    
  } catch (error) {
    console.error('Error adding test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
};

addTestPaymentData();

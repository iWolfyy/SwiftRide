import mongoose from 'mongoose';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { Booking } from './models/bookingModel.js';
import { Vehicle } from './models/vehicleModel.js';

// Load environment variables
dotenv.config();

// Initialize Stripe
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  } else {
    console.warn('⚠️  STRIPE_SECRET_KEY not found in environment variables');
  }
} catch (error) {
  console.error('❌ Failed to initialize Stripe:', error.message);
}

// Connect to MongoDB
const mongoDBURL = 'mongodb+srv://wadptwwolf_db_user:RYLUbrdpXtIrC6dW@cluster0.9ei3zxg.mongodb.net/vehicle?retryWrites=true&w=majority';

async function verifyPayment() {
  try {
    await mongoose.connect(mongoDBURL);
    console.log('✅ Connected to database');

    const sessionId = 'cs_test_a1bHX0uHCdgy62l1KGKhyMi4mE8B0XtNWLOnyWnGkVCdQWe1DwIASkQMgx';
    
    // Find the booking
    const booking = await Booking.findOne({ stripeSessionId: sessionId })
      .populate(['customer', 'vehicle']);
    
    if (!booking) {
      console.log('❌ No booking found for session:', sessionId);
      return;
    }
    
    console.log('📋 Found booking:', {
      id: booking._id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      totalAmount: booking.totalAmount,
      customer: booking.customer?.name,
      vehicle: booking.vehicle ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}` : 'N/A'
    });

    if (!stripe) {
      console.log('❌ Stripe not configured, cannot verify payment');
      return;
    }

    // Check payment status with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('💳 Stripe session status:', {
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency
    });

    // Update booking if payment is successful
    if (session.payment_status === 'paid' && booking.paymentStatus === 'pending') {
      console.log('🔄 Updating booking status...');
      
      booking.paymentStatus = 'paid';
      booking.paymentIntentId = session.payment_intent;
      booking.status = 'confirmed';
      booking.confirmedAt = new Date();
      
      await booking.save();
      
      // Make vehicle unavailable
      await Vehicle.findByIdAndUpdate(booking.vehicle, { isAvailable: false });
      
      console.log('✅ Payment verified and booking updated successfully!');
      console.log('📋 Updated booking:', {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        confirmedAt: booking.confirmedAt
      });
    } else if (booking.paymentStatus === 'paid') {
      console.log('✅ Payment already verified');
    } else {
      console.log('⚠️  Payment not completed on Stripe side');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

verifyPayment();


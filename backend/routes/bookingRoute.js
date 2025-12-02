/**
 * Booking Routes
 * Handles all booking-related operations including creation, management,
 * payment processing, and status updates
 */

// ===============================
// IMPORTS
// ===============================
import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { Booking } from '../models/bookingModel.js';
import { Vehicle } from '../models/vehicleModel.js';
import { auth, authorize } from '../middleware/auth.js';
import { User } from '../models/userModel.js';
import { PaymentMethod } from '../models/paymentMethodModel.js';

// Load environment variables
dotenv.config();

// ===============================
// INITIALIZATION
// ===============================
const router = express.Router();

// Initialize Stripe with error handling
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

// ===============================
// HELPER FUNCTIONS
// ===============================

/**
 * Get or create a Stripe customer for the user
 * @param {Object} user - User object from database
 * @returns {string} Stripe customer ID
 */
async function getOrCreateStripeCustomer(user) {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }
  
  const customer = await stripe.customers.create({
    name: user.name,
    email: user.email,
    metadata: { userId: user._id.toString() },
  });
  
  // Update user with Stripe customer ID (skip validation to avoid role-specific errors)
  await User.findByIdAndUpdate(
    user._id,
    { stripeCustomerId: customer.id },
    { runValidators: false }
  );
  
  return customer.id;
}

/**
 * Validate booking dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Validation result with isValid and message
 */
function validateBookingDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    return { isValid: false, message: 'Start date cannot be in the past' };
  }

  if (end <= start) {
    return { isValid: false, message: 'End date must be after start date' };
  }

  return { isValid: true };
}

/**
 * Calculate booking total amount
 * @param {number} totalDays - Number of rental days
 * @param {number} pricePerDay - Price per day
 * @returns {Object} Calculated amounts
 */
function calculateBookingAmount(totalDays, pricePerDay) {
  const subtotal = totalDays * pricePerDay;
  const tax = subtotal * 0.05; // 5% tax
  const serviceFee = subtotal * 0.05; // 5% service fee
  const totalAmount = subtotal + tax + serviceFee;

  return { subtotal, tax, serviceFee, totalAmount };
}

/**
 * Check for conflicting bookings
 * @param {string} vehicleId - Vehicle ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object|null} Conflicting booking if found
 */
async function checkForConflictingBookings(vehicleId, startDate, endDate) {
  return await Booking.findOne({
    vehicle: vehicleId,
    status: { $in: ['confirmed', 'active'] },
    $or: [
      { startDate: { $lte: startDate }, endDate: { $gt: startDate } },
      { startDate: { $lt: endDate }, endDate: { $gte: endDate } },
      { startDate: { $gte: startDate }, endDate: { $lte: endDate } }
    ]
  });
}


// ===============================
// BOOKING CREATION
// ===============================

/**
 * Create booking with Stripe Checkout payment
 * POST /bookings/
 */
router.post('/', auth, authorize('customer'), async (request, response) => {
  try {
    const {
      vehicleId,
      startDate,
      endDate,
      customerDetails,
      pickupLocation,
      dropoffLocation,
      specialRequests = '',
      notes = '',
    } = request.body;

    // Validate dates
    const dateValidation = validateBookingDates(startDate, endDate);
    if (!dateValidation.isValid) {
      return response.status(400).json({ message: dateValidation.message });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get and validate vehicle
    const vehicle = await Vehicle.findById(vehicleId).populate('seller', 'name email');
    if (!vehicle) {
      return response.status(404).json({ message: 'Vehicle not found' });
    }


    // Check for conflicting bookings
    const conflictingBooking = await checkForConflictingBookings(vehicleId, start, end);
    if (conflictingBooking) {
      return response.status(400).json({ 
        message: 'Vehicle is already booked for the selected dates' 
      });
    }

    // Calculate total amount
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const { totalAmount } = calculateBookingAmount(totalDays, vehicle.pricePerDay);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        description: `Vehicle rental for ${totalDays} days`,
        images: vehicle.images && vehicle.images.length > 0 ? [vehicle.images[0]] : [],
            },
            unit_amount: Math.round(totalAmount * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.origin}/vehicles/${vehicleId}`,
      metadata: {
        vehicleId: vehicleId,
        customerId: request.user._id.toString(),
        startDate: startDate,
        endDate: endDate,
        totalDays: totalDays.toString(),
        pricePerDay: vehicle.pricePerDay.toString(),
      },
    });

    // Create booking record
    const booking = new Booking({
      customer: request.user._id,
      vehicle: vehicleId,
      startDate: start,
      endDate: end,
      totalDays,
      pricePerDay: vehicle.pricePerDay,
      totalAmount,
      customerDetails: customerDetails || {
        name: request.user.name,
        email: request.user.email,
        phone: request.user.phone || '',
      },
      pickupLocation,
      dropoffLocation,
      specialRequests,
      notes,
      stripeSessionId: session.id,
      status: 'pending',
      paymentStatus: 'pending',
    });

    await booking.save();
    await booking.populate(['customer', 'vehicle']);

    response.status(201).json({
      message: 'Booking created successfully',
      booking,
      stripeSessionUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    response.status(500).json({ 
      message: 'Error creating booking', 
      error: error.message 
    });
  }
});

/**
 * Create booking and pay using saved card
 * POST /bookings/pay-with-card
 */
router.post('/pay-with-card', auth, authorize('customer'), async (request, response) => {
  try {
    const {
      vehicleId,
      startDate,
      endDate,
      customerDetails,
      pickupLocation,
      dropoffLocation,
      specialRequests = '',
      notes = '',
      paymentMethodId
    } = request.body;

    if (!paymentMethodId) {
      return response.status(400).json({ message: 'paymentMethodId is required' });
    }

    // Validate dates
    const dateValidation = validateBookingDates(startDate, endDate);
    if (!dateValidation.isValid) {
      return response.status(400).json({ message: dateValidation.message });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get and validate vehicle
    const vehicle = await Vehicle.findById(vehicleId).populate('seller', 'name email');
    if (!vehicle) {
      return response.status(404).json({ message: 'Vehicle not found' });
    }


    // Check for conflicting bookings
    const conflictingBooking = await checkForConflictingBookings(vehicleId, start, end);
    if (conflictingBooking) {
      return response.status(400).json({ 
        message: 'Vehicle is already booked for the selected dates' 
      });
    }

    // Calculate total amount
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const { totalAmount } = calculateBookingAmount(totalDays, vehicle.pricePerDay);

    // Verify payment method belongs to user
    const pmDoc = await PaymentMethod.findOne({ 
      user: request.user._id, 
      stripePaymentMethodId: paymentMethodId 
    });
    
    if (!pmDoc) {
      return response.status(404).json({ message: 'Saved card not found' });
    }

    // Ensure Stripe customer exists
    const user = await User.findById(request.user._id);
    const customerId = await getOrCreateStripeCustomer(user);

    // Create and confirm PaymentIntent using saved card
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true,
      description: `Vehicle rental: ${vehicle.year} ${vehicle.make} ${vehicle.model} for ${totalDays} days`,
      metadata: {
      vehicleId: vehicleId,
        customerId: request.user._id.toString(),
      startDate: startDate,
      endDate: endDate,
        totalDays: totalDays.toString(),
        pricePerDay: vehicle.pricePerDay.toString(),
      }
    });

    if (paymentIntent.status !== 'succeeded') {
      return response.status(400).json({ 
        message: 'Payment failed', 
        paymentIntent 
      });
    }

    // Create booking record
    const booking = new Booking({
      customer: request.user._id,
      vehicle: vehicleId,
      startDate: start,
      endDate: end,
      totalDays,
      pricePerDay: vehicle.pricePerDay,
      totalAmount,
      customerDetails: customerDetails || {
        name: request.user.name,
        email: request.user.email,
        phone: request.user.phone || '',
      },
      pickupLocation,
      dropoffLocation,
      specialRequests,
      notes,
      paymentStatus: 'paid',
      status: 'confirmed',
      paymentIntentId: paymentIntent.id
    });

    await booking.save();
    await booking.populate(['customer', 'vehicle']);


    response.status(201).json({
      message: 'Booking created and paid successfully',
      booking
    });
  } catch (error) {
    console.error('Pay with card error:', error);
    
    // Handle card authentication requirements
    if (error?.code === 'authentication_required' || error?.payment_intent) {
      return response.status(402).json({
        message: 'Payment requires authentication',
        paymentIntent: error.payment_intent || null
      });
    }
    
    response.status(500).json({ 
      message: 'Error creating booking with card', 
      error: error.message 
    });
  }
});

// ===============================
// WEBHOOK HANDLERS
// ===============================

/**
 * Stripe webhook handler for payment confirmation
 * POST /bookings/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  // Handle webhook signature verification
  if (!endpointSecret) {
    console.log('⚠️  STRIPE_WEBHOOK_SECRET not configured - webhook signature verification skipped');
    try {
    event = JSON.parse(request.body);
    } catch (err) {
      console.error('❌ Failed to parse webhook payload:', err.message);
      return response.status(400).json({ error: 'Invalid JSON payload' });
    }
  } else {
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // Handle the event
  console.log(`🔔 Received webhook event: ${event.type}`);
  
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log(`💳 Checkout session completed: ${session.id}`);
      
      try {
        const booking = await Booking.findOne({ stripeSessionId: session.id });
        
        if (booking) {
          console.log(`📋 Found booking ${booking._id} for session ${session.id}`);
          
          // Update booking status
          booking.paymentStatus = 'paid';
          booking.paymentIntentId = session.payment_intent;
          booking.status = 'confirmed';
          booking.confirmedAt = new Date();
          
          await booking.save();
          
          
          console.log(`✅ Payment confirmed for booking ${booking._id} - Status updated to confirmed`);
        } else {
          console.log(`⚠️  No booking found for session ${session.id}`);
        }
      } catch (error) {
        console.error('❌ Error updating booking:', error);
      }
      break;
      
    case 'checkout.session.expired':
    case 'payment_intent.payment_failed':
      const failedSession = event.data.object;
      
      try {
        const booking = await Booking.findOne({ 
          stripeSessionId: failedSession.id || failedSession.metadata?.sessionId 
        });
        
        if (booking) {
          booking.paymentStatus = 'failed';
          booking.status = 'cancelled';
          await booking.save();
          
          console.log(`❌ Payment failed for booking ${booking._id}`);
        }
      } catch (error) {
        console.error('Error updating failed booking:', error);
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  response.status(200).json({ received: true });
});

// ===============================
// PAYMENT STATUS & VERIFICATION
// ===============================

/**
 * Check payment status and manually verify payment
 * GET /bookings/payment-status/:sessionId
 */
router.get('/payment-status/:sessionId', auth, async (request, response) => {
  try {
    const { sessionId } = request.params;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const booking = await Booking.findOne({ stripeSessionId: sessionId })
      .populate(['customer', 'vehicle']);
    
    if (!booking) {
      return response.status(404).json({ message: 'Booking not found' });
    }
    
    console.log(`🔍 Checking payment status for session ${sessionId}: ${session.payment_status}`);
    console.log(`📋 Current booking status: ${booking.status}, payment status: ${booking.paymentStatus}`);
    
    // Update booking status if payment is successful
    if (booking.paymentStatus === 'pending' && session.payment_status === 'paid') {
      booking.paymentStatus = 'paid';
      booking.paymentIntentId = session.payment_intent;
      booking.status = 'confirmed';
      booking.confirmedAt = new Date();
      await booking.save();
      
      
      console.log(`✅ Payment verified and booking ${booking._id} confirmed manually`);
    }
    
    response.json({
      paymentStatus: session.payment_status,
      bookingStatus: booking.status,
      booking: booking,
      sessionData: {
        id: session.id,
        amount_total: session.amount_total,
        currency: session.currency,
        payment_status: session.payment_status
      }
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    response.status(500).json({ message: 'Error checking payment status' });
  }
});

/**
 * Manual booking confirmation (for development without webhooks)
 * POST /bookings/confirm/:id
 */
router.post('/confirm/:id', auth, authorize('customer'), async (request, response) => {
  try {
    const { id } = request.params;
    const booking = await Booking.findById(id).populate(['customer', 'vehicle']);
    
    if (!booking) {
      return response.status(404).json({ message: 'Booking not found' });
    }
    
    // Check authorization
    if (booking.customer._id.toString() !== request.user._id.toString()) {
      return response.status(403).json({ message: 'Not authorized to confirm this booking' });
    }
    
    // Verify payment with Stripe if session exists
    if (booking.stripeSessionId) {
      const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
      
      if (session.payment_status === 'paid') {
        booking.paymentStatus = 'paid';
        booking.paymentIntentId = session.payment_intent;
        booking.status = 'confirmed';
        booking.confirmedAt = new Date();
        await booking.save();
        
        
        response.json({
          message: 'Booking confirmed successfully',
          booking: booking
        });
      } else {
        response.status(400).json({
          message: 'Payment not completed',
          paymentStatus: session.payment_status
        });
      }
    } else {
      response.status(400).json({ message: 'No payment session found for this booking' });
    }
    
  } catch (error) {
    console.error('Manual confirmation error:', error);
    response.status(500).json({ message: 'Error confirming booking' });
  }
});

// ===============================
// BOOKING MANAGEMENT
// ===============================

/**
 * Get all bookings (role-based access)
 * GET /bookings/
 */
router.get('/', auth, async (request, response) => {
  try {
    let filter = {};
    
    // Apply role-based filtering
    if (request.user.role === 'customer') {
      filter.customer = request.user._id;
    } else if (request.user.role === 'seller') {
      // Get bookings for vehicles owned by this seller
      const vehicles = await Vehicle.find({ seller: request.user._id });
      const vehicleIds = vehicles.map(v => v._id);
      filter.vehicle = { $in: vehicleIds };
    }
    // Admin and branch-manager can see all bookings

    const bookings = await Booking.find(filter)
      .populate('customer', 'name email phone')
      .populate('vehicle', 'make model year licensePlate pricePerDay images fuelType transmission seats')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    response.json(bookings);
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

/**
 * Get single booking by ID
 * GET /bookings/:id
 */
router.get('/:id', auth, async (request, response) => {
  try {
    const { id } = request.params;
    const booking = await Booking.findById(id)
      .populate('customer', 'name email phone')
      .populate('vehicle', 'make model year licensePlate pricePerDay seller images fuelType transmission seats')
      .populate('approvedBy', 'name');

    if (!booking) {
      return response.status(404).json({ message: 'Booking not found' });
    }

    // Check access permissions
    const hasAccess = 
      request.user.role === 'admin' ||
      request.user.role === 'branch-manager' ||
      booking.customer._id.toString() === request.user._id.toString() ||
      (request.user.role === 'seller' && booking.vehicle.seller.toString() === request.user._id.toString());

    if (!hasAccess) {
      return response.status(403).json({ message: 'Access denied' });
    }

    response.json(booking);
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

/**
 * Update booking status (branch-manager/admin only)
 * PUT /bookings/:id/status
 */
router.put('/:id/status', auth, authorize('branch-manager', 'admin'), async (request, response) => {
  try {
    const { id } = request.params;
    const { status } = request.body;

    const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return response.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { 
        status,
        approvedBy: request.user._id
      },
      { new: true }
    ).populate(['customer', 'vehicle', 'approvedBy']);

    if (!booking) {
      return response.status(404).json({ message: 'Booking not found' });
    }


    response.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

/**
 * Update booking details (customer only)
 * PUT /bookings/:id/update
 */
router.put('/:id/update', auth, authorize('customer'), async (request, response) => {
  try {
    const { id } = request.params;
    const { pickupLocation, dropoffLocation, specialRequests, customerDetails } = request.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return response.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (booking.customer.toString() !== request.user._id.toString()) {
      return response.status(403).json({ message: 'Access denied' });
    }

    // Only allow updates for pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return response.status(400).json({ 
        message: 'Cannot update booking in current status. Only pending or confirmed bookings can be updated.' 
      });
    }

    // Update allowed fields
    const updateFields = {};
    if (pickupLocation !== undefined) updateFields.pickupLocation = pickupLocation;
    if (dropoffLocation !== undefined) updateFields.dropoffLocation = dropoffLocation;
    if (specialRequests !== undefined) updateFields.specialRequests = specialRequests;
    
    if (customerDetails) {
      if (customerDetails.name) updateFields['customerDetails.name'] = customerDetails.name;
      if (customerDetails.email) updateFields['customerDetails.email'] = customerDetails.email;
      if (customerDetails.phone) updateFields['customerDetails.phone'] = customerDetails.phone;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).populate(['customer', 'vehicle']);

    response.json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

/**
 * Cancel booking (customer only)
 * PUT /bookings/:id/cancel
 */
router.put('/:id/cancel', auth, authorize('customer'), async (request, response) => {
  try {
    const { id } = request.params;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return response.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (booking.customer.toString() !== request.user._id.toString()) {
      return response.status(403).json({ message: 'Access denied' });
    }

    // Check if booking can be cancelled
    if (booking.status === 'active' || booking.status === 'completed') {
      return response.status(400).json({ 
        message: 'Cannot cancel active or completed booking' 
      });
    }

    booking.status = 'cancelled';
    await booking.save();


    response.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

/**
 * Delete booking (customer only)
 * DELETE /bookings/:id
 */
router.delete('/:id', auth, authorize('customer'), async (request, response) => {
  try {
    const { id } = request.params;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return response.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (booking.customer.toString() !== request.user._id.toString()) {
      return response.status(403).json({ message: 'Access denied' });
    }

    // Only allow deletion of cancelled, pending, or confirmed bookings
    if (!['cancelled', 'pending', 'confirmed'].includes(booking.status)) {
      return response.status(400).json({ 
        message: 'Cannot delete booking in current status. Only cancelled, pending, or confirmed bookings can be deleted.' 
      });
    }


    await Booking.findByIdAndDelete(id);

    response.json({
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

export default router;
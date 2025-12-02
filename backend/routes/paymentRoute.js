/**
 * Payment Routes
 * Handles all payment-related operations including Stripe integration,
 * payment methods management, and payment history
 */

// ===============================
// IMPORTS
// ===============================
import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { auth, authorize } from '../middleware/auth.js';
import { User } from '../models/userModel.js';
import { PaymentMethod } from '../models/paymentMethodModel.js';
import { Booking } from '../models/bookingModel.js';

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
 * Get payment method details from Stripe or database
 * @param {Object} booking - Booking object
 * @param {string} userId - User ID
 * @returns {Object|null} Payment method details
 */
async function getPaymentMethodDetails(booking, userId) {
  let paymentMethod = null;
  
  // Try to get payment method from Stripe if paymentIntentId exists
  if (booking.paymentIntentId && stripe) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
      if (paymentIntent.payment_method) {
        const pm = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
        paymentMethod = {
          brand: pm.card?.brand || 'unknown',
          last4: pm.card?.last4 || '****',
          expMonth: pm.card?.exp_month || 0,
          expYear: pm.card?.exp_year || 0,
          funding: pm.card?.funding || 'unknown'
        };
      }
    } catch (error) {
      console.log('Error fetching payment method from Stripe:', error.message);
    }
  }
  
  // Fallback to database if no Stripe payment method found
  if (!paymentMethod) {
    const savedPaymentMethod = await PaymentMethod.findOne({ 
      user: userId,
      stripeCustomerId: { $exists: true }
    }).sort({ isDefault: -1, createdAt: -1 });
    
    if (savedPaymentMethod) {
      paymentMethod = {
        brand: savedPaymentMethod.brand || 'unknown',
        last4: savedPaymentMethod.last4 || '****',
        expMonth: savedPaymentMethod.expMonth || 0,
        expYear: savedPaymentMethod.expYear || 0,
        funding: savedPaymentMethod.funding || 'unknown'
      };
    }
  }
  
  return paymentMethod;
}

// ===============================
// PAYMENT METHOD MANAGEMENT
// ===============================

/**
 * Create a SetupIntent for collecting card details
 * POST /payments/setup-intent
 */
router.post('/setup-intent', auth, authorize('customer'), async (request, response) => {
  try {
    const user = await User.findById(request.user._id);
    const customerId = await getOrCreateStripeCustomer(user);

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    response.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Create SetupIntent error:', error);
    response.status(500).json({ message: 'Failed to create SetupIntent' });
  }
});

/**
 * Add a new payment method (card) to user's account
 * POST /payments/add-card
 */
router.post('/add-card', auth, authorize('customer'), async (request, response) => {
  try {
    const { paymentMethodId, setDefault } = request.body;
    
    if (!paymentMethodId) {
      return response.status(400).json({ message: 'paymentMethodId is required' });
    }

    const user = await User.findById(request.user._id);
    const customerId = await getOrCreateStripeCustomer(user);

    // Attach payment method to customer
    const attached = await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

    // Check if this should be the default card
    const existing = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    const shouldSetDefault = setDefault === true || (existing.data.length === 1);
    
    if (shouldSetDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Update database - remove default from other cards if needed
    if (shouldSetDefault) {
      await PaymentMethod.updateMany(
        { user: user._id, isDefault: true }, 
        { $set: { isDefault: false } }
      );
    }

    // Save payment method to database
    const card = attached.card || {};
    const pmDoc = await PaymentMethod.findOneAndUpdate(
      { stripePaymentMethodId: attached.id },
      {
        user: user._id,
        stripeCustomerId: customerId,
        stripePaymentMethodId: attached.id,
        brand: card.brand,
        last4: card.last4,
        expMonth: card.exp_month,
        expYear: card.exp_year,
        country: card.country,
        funding: card.funding,
        isDefault: shouldSetDefault,
      },
      { new: true, upsert: true }
    );

    response.status(201).json({
      message: 'Card saved successfully',
      paymentMethod: pmDoc,
      defaultSet: shouldSetDefault,
    });
  } catch (error) {
    console.error('Add card error:', error);
    response.status(500).json({ message: error.message || 'Failed to add card' });
  }
});

/**
 * Get all saved payment methods for the user
 * GET /payments/cards
 */
router.get('/cards', auth, authorize('customer'), async (request, response) => {
  try {
    const userId = request.user._id;
    const cards = await PaymentMethod.find({ user: userId })
      .sort({ isDefault: -1, createdAt: -1 });
    
    response.json({ paymentMethods: cards });
  } catch (error) {
    console.error('List cards error:', error);
    response.status(500).json({ message: 'Failed to list cards' });
  }
});

/**
 * Set a payment method as default
 * POST /payments/cards/:paymentMethodId/default
 */
router.post('/cards/:paymentMethodId/default', auth, authorize('customer'), async (request, response) => {
  try {
    const { paymentMethodId } = request.params;
    const user = await User.findById(request.user._id);
    const customerId = await getOrCreateStripeCustomer(user);

    // Verify ownership
    const pmDoc = await PaymentMethod.findOne({ 
      user: user._id, 
      stripePaymentMethodId: paymentMethodId 
    });
    
    if (!pmDoc) {
      return response.status(404).json({ message: 'Card not found' });
    }

    // Update in Stripe
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Update in database
    await PaymentMethod.updateMany(
      { user: user._id, isDefault: true }, 
      { $set: { isDefault: false } }
    );
    
    pmDoc.isDefault = true;
    await pmDoc.save();

    response.json({ message: 'Default card updated' });
  } catch (error) {
    console.error('Set default card error:', error);
    response.status(500).json({ message: 'Failed to set default card' });
  }
});

/**
 * Update payment method details (billing info, expiration)
 * PATCH /payments/cards/:paymentMethodId
 */
router.patch('/cards/:paymentMethodId', auth, authorize('customer'), async (request, response) => {
  try {
    const { paymentMethodId } = request.params;
    const { billingDetails, expMonth, expYear } = request.body;

    // Verify ownership
    const pmDoc = await PaymentMethod.findOne({ 
      user: request.user._id, 
      stripePaymentMethodId: paymentMethodId 
    });
    
    if (!pmDoc) {
      return response.status(404).json({ message: 'Card not found' });
    }

    // Prepare update object
    const update = {};
    if (billingDetails) {
      update.billing_details = billingDetails;
    }
    if (expMonth || expYear) {
      update.card = {};
      if (expMonth) update.card.exp_month = expMonth;
      if (expYear) update.card.exp_year = expYear;
    }

    // Update in Stripe
    const updated = await stripe.paymentMethods.update(paymentMethodId, update);

    // Update in database
    if (updated.card) {
      pmDoc.expMonth = updated.card.exp_month ?? pmDoc.expMonth;
      pmDoc.expYear = updated.card.exp_year ?? pmDoc.expYear;
      pmDoc.brand = updated.card.brand ?? pmDoc.brand;
      pmDoc.last4 = updated.card.last4 ?? pmDoc.last4;
      pmDoc.country = updated.card.country ?? pmDoc.country;
      pmDoc.funding = updated.card.funding ?? pmDoc.funding;
      await pmDoc.save();
    }

    response.json({ message: 'Card updated', paymentMethod: pmDoc });
  } catch (error) {
    console.error('Update card error:', error);
    response.status(500).json({ message: error.message || 'Failed to update card' });
  }
});

/**
 * Delete a payment method
 * DELETE /payments/cards/:paymentMethodId
 */
router.delete('/cards/:paymentMethodId', auth, authorize('customer'), async (request, response) => {
  try {
    const { paymentMethodId } = request.params;
    const user = await User.findById(request.user._id);
    const customerId = await getOrCreateStripeCustomer(user);

    // Verify ownership
    const pmDoc = await PaymentMethod.findOne({ 
      user: user._id, 
      stripePaymentMethodId: paymentMethodId 
    });
    
    if (!pmDoc) {
      return response.status(404).json({ message: 'Card not found' });
    }

    // Detach from Stripe
    await stripe.paymentMethods.detach(paymentMethodId);

    // Handle default card replacement
    const wasDefault = pmDoc.isDefault;
    await pmDoc.deleteOne();

    if (wasDefault) {
      const nextCard = await PaymentMethod.findOne({ user: user._id })
        .sort({ createdAt: 1 });
      
      if (nextCard) {
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: nextCard.stripePaymentMethodId },
        });
        nextCard.isDefault = true;
        await nextCard.save();
      } else {
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: null },
        });
      }
    }

    response.json({ message: 'Card deleted' });
  } catch (error) {
    console.error('Delete card error:', error);
    response.status(500).json({ message: 'Failed to delete card' });
  }
});

// ===============================
// PAYMENT HISTORY
// ===============================

/**
 * Get payment history with statistics and pagination
 * GET /payments/history
 */
router.get('/history', auth, authorize('customer'), async (request, response) => {
  try {
    const userId = request.user._id;
    const { page = 1, limit = 10, status, startDate, endDate, search, cardType } = request.query;
    
    console.log('Payment history request:', { userId, page, limit, status, startDate, endDate, search, cardType });
    
    // Build filter for bookings
    const filter = { customer: userId };
    
    // Apply filters
    if (status) {
      filter.paymentStatus = status;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Get all bookings with payment information first (for search filtering)
    let allBookings = await Booking.find(filter)
      .populate('vehicle', 'make model year licensePlate images')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });
    
    // Get payment statistics using aggregation
    const stats = await Booking.aggregate([
      { $match: { customer: userId } },
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
    
    // Get payment method details for each booking
    let paymentHistory = await Promise.all(
      allBookings.map(async (booking) => {
        try {
          const paymentMethod = await getPaymentMethodDetails(booking, userId);
          
          return {
            _id: booking._id,
            vehicle: booking.vehicle,
            customer: booking.customer,
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalDays: booking.totalDays,
            pricePerDay: booking.pricePerDay,
            totalAmount: booking.totalAmount,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            paymentIntentId: booking.paymentIntentId,
            stripeSessionId: booking.stripeSessionId,
            paymentMethod: paymentMethod,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt
          };
        } catch (paymentError) {
          console.error('Error getting payment method for booking:', booking._id, paymentError);
          // Return booking without payment method details if there's an error
          return {
            _id: booking._id,
            vehicle: booking.vehicle,
            customer: booking.customer,
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalDays: booking.totalDays,
            pricePerDay: booking.pricePerDay,
            totalAmount: booking.totalAmount,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            paymentIntentId: booking.paymentIntentId,
            stripeSessionId: booking.stripeSessionId,
            paymentMethod: null,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt
          };
        }
      })
    );
    
    // Apply search filter if provided
    if (search && search.trim()) {
      try {
        const searchTerm = search.trim().toLowerCase();
        paymentHistory = paymentHistory.filter(payment => {
          try {
            const vehicleMake = payment.vehicle?.make?.toLowerCase() || '';
            const vehicleModel = payment.vehicle?.model?.toLowerCase() || '';
            const vehicleYear = payment.vehicle?.year?.toString() || '';
            const licensePlate = payment.vehicle?.licensePlate?.toLowerCase() || '';
            const paymentStatus = payment.paymentStatus?.toLowerCase() || '';
            const totalAmount = payment.totalAmount?.toString() || '';
            
            return vehicleMake.includes(searchTerm) ||
                   vehicleModel.includes(searchTerm) ||
                   vehicleYear.includes(searchTerm) ||
                   licensePlate.includes(searchTerm) ||
                   paymentStatus.includes(searchTerm) ||
                   totalAmount.includes(searchTerm);
          } catch (filterError) {
            console.error('Error filtering payment:', filterError);
            return false;
          }
        });
      } catch (searchError) {
        console.error('Error applying search filter:', searchError);
        // Continue without search filter if there's an error
      }
    }
    
    // Apply card type filter if provided
    if (cardType && cardType.trim()) {
      const cardTypeFilter = cardType.trim().toLowerCase();
      paymentHistory = paymentHistory.filter(payment => {
        const paymentCardType = payment.paymentMethod?.brand?.toLowerCase() || '';
        return paymentCardType === cardTypeFilter;
      });
    }
    
    // Apply pagination after search filtering
    const skip = (page - 1) * limit;
    const total = paymentHistory.length;
    paymentHistory = paymentHistory.slice(skip, skip + limit);
    
    console.log('Payment history response:', { 
      totalResults: total, 
      returnedResults: paymentHistory.length, 
      searchTerm: search 
    });
    
    response.json({
      paymentHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      stats: stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        failedAmount: 0
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    response.status(500).json({ message: 'Failed to get payment history' });
  }
});

export default router;
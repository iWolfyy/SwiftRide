import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  } else {
    console.warn('⚠️  STRIPE_SECRET_KEY not found in environment variables for stripe test route');
  }
} catch (error) {
  console.error('❌ Failed to initialize Stripe in test route:', error.message);
}

const router = express.Router();

// Test Stripe configuration
router.get('/test-stripe', async (req, res) => {
  try {
    // Test 1: Check if Stripe is initialized properly
    console.log('Testing Stripe configuration...');
    
    // Test 2: Create a simple product to verify API connection
    const product = await stripe.products.create({
      name: 'Test Vehicle Rental',
      description: 'Test product to verify Stripe connection',
    });
    
    // Test 3: Create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 10000, // $100.00
      currency: 'usd',
    });
    
    // Test 4: Delete the test product (cleanup)
    await stripe.products.del(product.id);
    
    res.json({
      success: true,
      message: 'Stripe configuration is working correctly!',
      details: {
        productCreated: true,
        priceCreated: true,
        cleanup: true,
        stripeVersion: stripe.VERSION
      }
    });
    
  } catch (error) {
    console.error('Stripe test error:', error);
    res.status(500).json({
      success: false,
      message: 'Stripe configuration error',
      error: error.message,
      type: error.type || 'unknown'
    });
  }
});

// Test creating a checkout session
router.post('/test-checkout', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Vehicle Rental',
              description: 'Test booking to verify Stripe Checkout',
            },
            unit_amount: 5000, // $50.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:5175/test-success',
      cancel_url: 'http://localhost:5175/test-cancel',
    });

    res.json({
      success: true,
      message: 'Stripe Checkout session created successfully!',
      sessionId: session.id,
      checkoutUrl: session.url
    });
    
  } catch (error) {
    console.error('Stripe checkout test error:', error);
    res.status(500).json({
      success: false,
      message: 'Stripe checkout test failed',
      error: error.message
    });
  }
});

export default router;
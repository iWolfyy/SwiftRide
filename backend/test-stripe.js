// Simple Stripe API test
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log('Testing Stripe API connection...');
console.log('Using API key ending with:', process.env.STRIPE_SECRET_KEY?.slice(-10));

stripe.customers.list({ limit: 1 })
  .then(customers => {
    console.log('✅ Stripe API connection successful!');
    console.log('Retrieved customers:', customers.data.length);
  })
  .catch(error => {
    console.log('❌ Stripe API connection failed:');
    console.log('Error type:', error.type);
    console.log('Error message:', error.message);
    console.log('Raw error:', error.raw);
  });
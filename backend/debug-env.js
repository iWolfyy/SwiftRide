// Debug script to check environment variables
import dotenv from 'dotenv';
dotenv.config();

console.log('=== Environment Variable Debug ===');
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY?.length);
console.log('STRIPE_SECRET_KEY last 10 chars:', process.env.STRIPE_SECRET_KEY?.slice(-10));
console.log('STRIPE_SECRET_KEY first 20 chars:', process.env.STRIPE_SECRET_KEY?.slice(0, 20));
console.log('STRIPE_SECRET_KEY full value:', JSON.stringify(process.env.STRIPE_SECRET_KEY));

// Check if there are any hidden characters
const key = process.env.STRIPE_SECRET_KEY;
if (key) {
  for (let i = 0; i < key.length; i++) {
    const char = key[i];
    const charCode = char.charCodeAt(0);
    if (charCode < 32 || charCode > 126) {
      console.log(`Hidden character at position ${i}: ${charCode} (${char})`);
    }
  }
}
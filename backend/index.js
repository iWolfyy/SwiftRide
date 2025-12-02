import express from 'express';
import dotenv from 'dotenv';
import { PORT, mongoDBURL } from './config.js';
import mongoose from 'mongoose';
import cors from 'cors';

// Load environment variables
dotenv.config();

// Import routes
import booksRoute from './routes/booksRoute.js';
import authRoute from './routes/authRoute.js';
import vehicleRoute from './routes/vehicleRoute.js';
import bookingRoute from './routes/bookingRoute.js';
import adminRoute from './routes/adminRoute.js';
import paymentRoute from './routes/paymentRoute.js';
// import stripeTestRoute from './routes/stripeTestRoute.js';
import branchRoute from './routes/branchRoute.js';

const app = express();

// Middleware for parsing request body
app.use(express.json());

// Middleware for handling CORS POLICY
app.use(cors());

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

app.get('/', (request, response) => {
  console.log(request);
  return response.status(200).send('Welcome To Vehicle Rental System API');
});

// Routes
app.use('/books', booksRoute);
app.use('/auth', authRoute);
app.use('/vehicles', vehicleRoute);
app.use('/bookings', bookingRoute);
app.use('/admin', adminRoute);
app.use('/payments', paymentRoute);
// app.use('/stripe-test', stripeTestRoute);
app.use('/branches', branchRoute);

mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log('App connected to database');
    app.listen(PORT, () => {
      console.log(`App is listening to port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

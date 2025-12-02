import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import Spinner from '../components/Spinner';
import { generateBookingPDF } from '../utils/pdfGenerator';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!sessionId) {
        enqueueSnackbar('Invalid payment session', { variant: 'error' });
        navigate('/');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5556/bookings/payment-status/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setPaymentStatus(response.data.paymentStatus);
        setBooking(response.data.booking);
        
        if (response.data.paymentStatus === 'paid') {
          enqueueSnackbar('Payment successful! Your booking is confirmed.', { variant: 'success' });
        } else {
          enqueueSnackbar('Payment is being processed...', { variant: 'info' });
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        enqueueSnackbar('Error verifying payment status', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [sessionId, navigate, enqueueSnackbar]);

  const downloadBookingPDF = async () => {
    await generateBookingPDF(booking, enqueueSnackbar, setIsDownloading, paymentStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Booking Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">
            {paymentStatus === 'paid' 
              ? 'Your payment was successful and your booking is confirmed.' 
              : 'Your booking is being processed.'}
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
          {/* Company Header for PDF */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Rent Service</h1>
              <p className="text-gray-600">Booking Confirmation</p>
              <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-blue-600 text-white">
            <h2 className="text-xl font-semibold">Booking Details</h2>
            <p className="text-blue-100">Confirmation ID: {booking._id}</p>
          </div>

          <div className="p-6">
            {/* Vehicle Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Information</h3>
              <div className="flex flex-col md:flex-row gap-4">
                {booking.vehicle.images && booking.vehicle.images.length > 0 && (
                  <div className="md:w-1/3">
                    <img
                      src={`${booking.vehicle.images[0]}`}
                      alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="md:w-2/3">
                  <h4 className="text-xl font-bold text-gray-900">
                    {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                  </h4>
                  {/* <p className="text-gray-600">Registration: {booking.vehicle.registrationNumber || 'N/A'}</p> */}
                  <p className="text-gray-600">Fuel Type: {booking.vehicle.fuelType || 'N/A'}</p>
                  {/* <p className="text-gray-600">Seats: {booking.vehicle.seatingCapacity || 'N/A'}</p> */}
                </div>
              </div>
            </div>

            {/* Rental Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Rental Period</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">{formatDate(booking.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium">{formatDate(booking.endDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Days:</span>
                    <span className="font-medium">{booking.totalDays} days</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Locations</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Pickup:</span>
                    <p className="font-medium">{booking.pickupLocation}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Dropoff:</span>
                    <p className="font-medium">{booking.dropoffLocation}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Summary</h3>
              <div className="text-center">
                <span className="text-gray-600">Total Amount:</span>
                <p className="text-3xl font-bold text-green-600">${booking.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Footer for PDF */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              <p className="font-semibold">Vehicle Rent Service</p>
              <p>Thank you for choosing our service!</p>
              <p>For support, contact us at: support@vehiclerent.com | +1-234-567-8900</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={downloadBookingPDF}
            disabled={isDownloading}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7h-4V3" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6" />
                </svg>
                Download Modern PDF
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/customer-dashboard')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            View My Bookings
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Back to Home
          </button>
        </div>

        {/* Important Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Important Information</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Please bring a valid driver&apos;s license and the credit card used for payment</li>
            <li>• Arrive at the pickup location 15 minutes before your scheduled time</li>
            <li>• A confirmation email will be sent to your registered email address</li>
            <li>• Contact support if you need to modify or cancel your booking</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import Spinner from '../components/Spinner';
import BackButton from '../components/BackButton';
import { generateBookingPDF } from '../utils/pdfGenerator';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5556/bookings/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBooking(response.data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      enqueueSnackbar('Error loading booking details', { variant: 'error' });
      navigate('/customer-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5556/bookings/${id}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      enqueueSnackbar('Booking cancelled successfully', { variant: 'success' });
      navigate('/customer-dashboard');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Error cancelling booking', 
        { variant: 'error' }
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const downloadBookingPDF = async () => {
    await generateBookingPDF(booking, enqueueSnackbar, setIsDownloading);
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
            onClick={() => navigate('/customer-dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <BackButton />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Details</h1>
          <p className="text-gray-600">Booking ID: {booking._id}</p>
        </div>

        {/* Status and Actions */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div>
                <span className="text-sm text-gray-600">Booking Status:</span>
                <span className={`ml-2 inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
            </div>
            
            {booking.status === 'pending' && (
              <button
                onClick={handleCancelBooking}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Information</h2>
          <div className="flex flex-col md:flex-row gap-6">
            {booking.vehicle.images && booking.vehicle.images.length > 0 && (
              <div className="md:w-1/3">
                <img
                  src={`${booking.vehicle.images[0]}`}
                  alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            <div className="md:w-2/3">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Registration:</span>
                  <p className="font-medium">{booking.vehicle.licensePlate}</p>
                </div>
                <div>
                  <span className="text-gray-600">Fuel Type:</span>
                  <p className="font-medium">{booking.vehicle.fuelType}</p>
                </div>
                <div>
                  <span className="text-gray-600">Transmission:</span>
                  <p className="font-medium">{booking.vehicle.transmission}</p>
                </div>
                <div>
                  <span className="text-gray-600">Seats:</span>
                  <p className="font-medium">{booking.vehicle.seats}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Rental Period */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rental Period</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Start Date:</span>
                <p className="font-medium">{formatDate(booking.startDate)}</p>
              </div>
              <div>
                <span className="text-gray-600">End Date:</span>
                <p className="font-medium">{formatDate(booking.endDate)}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Days:</span>
                <p className="font-medium">{booking.totalDays} days</p>
              </div>
              <div>
                <span className="text-gray-600">Booked On:</span>
                <p className="font-medium">{formatDateTime(booking.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Location & Contact */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Pickup Location:</span>
                <p className="font-medium">{booking.pickupLocation}</p>
              </div>
              <div>
                <span className="text-gray-600">Dropoff Location:</span>
                <p className="font-medium">{booking.dropoffLocation}</p>
              </div>
              {booking.customerDetails && (
                <>
                  <div>
                    <span className="text-gray-600">Contact Name:</span>
                    <p className="font-medium">{booking.customerDetails.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact Phone:</span>
                    <p className="font-medium">{booking.customerDetails.phone}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
          <div className="text-center">
            <span className="text-gray-600">Total Amount:</span>
            <p className="text-3xl font-bold text-green-600">${booking.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Special Requests */}
        {(booking.specialRequests || booking.notes) && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            {booking.specialRequests && (
              <div className="mb-3">
                <span className="text-gray-600">Special Requests:</span>
                <p className="mt-1">{booking.specialRequests}</p>
              </div>
            )}
            {booking.notes && (
              <div>
                <span className="text-gray-600">Notes:</span>
                <p className="mt-1">{booking.notes}</p>
              </div>
            )}
          </div>
        )}

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
                Download PDF
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/customer-dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/vehicles')}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Browse More Vehicles
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
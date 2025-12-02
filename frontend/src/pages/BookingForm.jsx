import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "notistack";
import axios from "axios";
import BackButton from '../components/BackButton';
import Spinner from '../components/Spinner';

const BookingForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Vehicle ID
  const { user, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [savedCards, setSavedCards] = useState([]);
  const [useSavedCard, setUseSavedCard] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    pickupLocation: '',
    dropoffLocation: '',
    specialRequests: '',
    notes: '',
    customerDetails: {
      name: '',
      email: '',
      phone: '',
      driverLicense: '',
    }
  });

  // Simple validation function like add branch and add vehicle
  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };
    
    switch (fieldName) {
      case 'startDate':
        if (!value) {
          errors.startDate = 'Start date is required';
        } else {
          delete errors.startDate;
        }
        break;
        
      case 'endDate':
        if (!value) {
          errors.endDate = 'End date is required';
        } else if (formData.startDate && value < formData.startDate) {
          errors.endDate = 'End date must be after start date';
        } else {
          delete errors.endDate;
        }
        break;
        
      case 'pickupLocation':
        if (!value?.trim()) {
          errors.pickupLocation = 'Pickup location is required';
        } else if (value.trim().length < 2) {
          errors.pickupLocation = 'Must be at least 2 characters';
        } else if (!/^[A-Za-z0-9\s\-.,/]+$/.test(value.trim())) {
          errors.pickupLocation = 'Only letters, numbers, spaces, hyphens, periods, commas, and / allowed';
        } else {
          delete errors.pickupLocation;
        }
        break;
        
      case 'dropoffLocation':
        if (!value?.trim()) {
          errors.dropoffLocation = 'Dropoff location is required';
        } else if (value.trim().length < 2) {
          errors.dropoffLocation = 'Must be at least 2 characters';
        } else if (!/^[A-Za-z0-9\s\-.,/]+$/.test(value.trim())) {
          errors.dropoffLocation = 'Only letters, numbers, spaces, hyphens, periods, commas, and / allowed';
        } else {
          delete errors.dropoffLocation;
        }
        break;
        
      case 'customerDetails.name':
        if (!value?.trim()) {
          errors['customerDetails.name'] = 'Full name is required';
        } else if (value.trim().length < 2) {
          errors['customerDetails.name'] = 'Must be at least 2 characters';
        } else if (!/^[A-Za-z\s\-&.,()]+$/.test(value.trim())) {
          errors['customerDetails.name'] = 'Only letters, spaces, hyphens, ampersands, periods, commas, and parentheses allowed';
        } else {
          delete errors['customerDetails.name'];
        }
        break;
        
      case 'customerDetails.email':
        if (!value?.trim()) {
          errors['customerDetails.email'] = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors['customerDetails.email'] = 'Please enter a valid email address';
        } else {
          delete errors['customerDetails.email'];
        }
        break;
        
      case 'customerDetails.phone':
        if (!value?.trim()) {
          errors['customerDetails.phone'] = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(value.trim())) {
          errors['customerDetails.phone'] = 'Must be exactly 10 digits';
        } else {
          delete errors['customerDetails.phone'];
        }
        break;
        
      case 'customerDetails.driverLicense':
        if (!value?.trim()) {
          errors['customerDetails.driverLicense'] = 'Driver license number is required';
        } else if (!/^[0-9]+$/.test(value.trim())) {
          errors['customerDetails.driverLicense'] = 'License number can only contain numbers';
        } else if (value.trim().length < 5) {
          errors['customerDetails.driverLicense'] = 'Must be at least 5 characters';
        } else if (value.trim().length > 20) {
          errors['customerDetails.driverLicense'] = 'Must be less than 20 characters';
        } else {
          delete errors['customerDetails.driverLicense'];
        }
        break;
        
      default:
        break;
    }
    
    setFieldErrors(errors);
  };

  // Key press handler to prevent invalid characters
  const handleKeyPress = (e) => {
    const { name } = e.target;
    
    if (name === 'customerDetails.phone' || name === 'customerDetails.driverLicense') {
      // Allow only numbers
      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    } else if (name === 'customerDetails.name') {
      // Allow only letters, spaces, hyphens, ampersands, periods, commas, and parentheses
      if (!/[A-Za-z\s\-&.,()]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    } else if (name === 'pickupLocation' || name === 'dropoffLocation') {
      // Allow letters, numbers, spaces, and basic address characters
      if (!/[A-Za-z0-9\s\-.,/]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    }
  };

  React.useEffect(() => {
    // Fetch vehicle details
    const fetchVehicle = async () => {
      try {
        const response = await axios.get(`http://localhost:5556/vehicles/${id}`);
        setVehicle(response.data);
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        enqueueSnackbar('Error loading vehicle details', { variant: 'error' });
      }
    };

    if (id) {
      fetchVehicle();
    }
  }, [id, enqueueSnackbar]);

  // Fetch saved cards when logged in
  React.useEffect(() => {
    const fetchCards = async () => {
      if (!token) return;
      try {
        const response = await axios.get('http://localhost:5556/payments/cards', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedCards(response.data.paymentMethods || []);
        if ((response.data.paymentMethods || []).length > 0) {
          const def = response.data.paymentMethods.find((c) => c.isDefault) || response.data.paymentMethods[0];
          setSelectedPaymentMethodId(def.stripePaymentMethodId);
        }
      } catch (error) {
        // silently ignore on load
      }
    };
    fetchCards();
  }, [token]);

  // Populate customer details from logged-in user
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerDetails: {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          driverLicense: '',
        }
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate date ranges for startDate and endDate
    if (name === 'startDate' && value && formData.endDate && value > formData.endDate) {
      // If start date is after end date, clear the end date
      setFormData(prev => ({
        ...prev,
        [name]: value,
        endDate: ''
      }));
    } else if (name === 'endDate' && value && formData.startDate && value < formData.startDate) {
      // If end date is before start date, clear the start date
      setFormData(prev => ({
        ...prev,
        [name]: value,
        startDate: ''
      }));
    } else if (name.startsWith('customerDetails.')) {
      const fieldName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        customerDetails: {
          ...prev.customerDetails,
          [fieldName]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Validate the field
    validateField(name, value);
  };

  const calculateTotalDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const calculateTotalAmount = () => {
    const days = calculateTotalDays();
    const baseAmount = vehicle ? days * vehicle.pricePerDay : 0;
    const tax = baseAmount * 0.05; // 5% tax
    const serviceFee = baseAmount * 0.05; // 5% service fee
    return baseAmount + tax + serviceFee;
  };

  const calculateSubtotal = () => {
    const days = calculateTotalDays();
    return vehicle ? days * vehicle.pricePerDay : 0;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.05; // 5% tax
  };

  const calculateServiceFee = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.05; // 5% service fee
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      enqueueSnackbar('Please login to make a booking', { variant: 'error' });
      navigate('/login');
      return;
    }

    // Check if there are any field errors
    if (Object.keys(fieldErrors).length > 0) {
      enqueueSnackbar("Please fix all validation errors before submitting", { variant: "error" });
      return;
    }

    // Final validation for required fields
    const requiredFields = ['startDate', 'endDate', 'pickupLocation', 'dropoffLocation'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());
    
    if (missingFields.length > 0) {
      enqueueSnackbar(`Please fill in all required fields: ${missingFields.join(', ')}`, { variant: "error" });
      return;
    }

    // Check customer details
    const requiredCustomerFields = ['name', 'email', 'phone', 'driverLicense'];
    const missingCustomerFields = requiredCustomerFields.filter(field => !formData.customerDetails[field]?.trim());
    
    if (missingCustomerFields.length > 0) {
      enqueueSnackbar(`Please fill in all customer details: ${missingCustomerFields.join(', ')}`, { variant: "error" });
      return;
    }

    setLoading(true);

    try {
      const bookingData = {
        vehicleId: id,
        ...formData
      };
      if (useSavedCard) {
        if (!selectedPaymentMethodId) {
          enqueueSnackbar('Please select a saved card or uncheck Use a saved card.', { variant: 'warning' });
          return;
        }
        await axios.post(
          'http://localhost:5556/bookings/pay-with-card',
          { ...bookingData, paymentMethodId: selectedPaymentMethodId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        enqueueSnackbar('Payment successful! Booking confirmed.', { variant: 'success' });
        navigate('/customer-dashboard');
      } else {
        const response = await axios.post(
          'http://localhost:5556/bookings',
          bookingData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (response.data.stripeSessionUrl) {
          window.location.href = response.data.stripeSessionUrl;
        } else {
          enqueueSnackbar('Booking created but payment redirect failed', { variant: 'warning' });
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      const message = error.response?.data?.message || 'Error creating booking';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle) {
    return <Spinner />;
  }

  const totalDays = calculateTotalDays();
  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const serviceFee = calculateServiceFee();
  const totalAmount = calculateTotalAmount();

  return (
    <div className='p-4'>
      <BackButton />
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold my-4'>Book Vehicle</h1>
        
        {/* Vehicle Summary */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <div className='flex flex-col md:flex-row gap-6'>
            <div className='md:w-1/3'>
              {vehicle.images && vehicle.images.length > 0 && (
                <img
                  src={`${vehicle.images[0]}`}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className='w-full h-48 object-cover rounded-lg'
                />
              )}
            </div>
            <div className='md:w-2/3'>
              <h2 className='text-2xl font-bold mb-2'>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <p className='text-gray-600 mb-2'>Registration: {vehicle.registrationNumber}</p>
              <p className='text-gray-600 mb-2'>Fuel Type: {vehicle.fuelType}</p>
              <p className='text-gray-600 mb-4'>Seats: {vehicle.seatingCapacity}</p>
              <p className='text-2xl font-bold text-blue-600'>
                ${vehicle.pricePerDay}/day
              </p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className='bg-white rounded-lg shadow-md p-6'>
          <h3 className='text-xl font-bold mb-4'>Booking Details</h3>
          
          {/* Date Selection */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Start Date *
              </label>
              <input
                type='date'
                name='startDate'
                value={formData.startDate}
                onChange={handleInputChange}
                onBlur={(e) => validateField('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                max={formData.endDate || undefined}
                required
                className={`w-full border-2 rounded-lg px-4 py-2 focus:outline-none ${
                  fieldErrors.startDate ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-sky-600'
                }`}
              />
              {fieldErrors.startDate && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.startDate}</p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                End Date *
              </label>
              <input
                type='date'
                name='endDate'
                value={formData.endDate}
                onChange={handleInputChange}
                onBlur={(e) => validateField('endDate', e.target.value)}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                required
                className={`w-full border-2 rounded-lg px-4 py-2 focus:outline-none ${
                  fieldErrors.endDate ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-sky-600'
                }`}
              />
              {fieldErrors.endDate && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.endDate}</p>
              )}
            </div>
          </div>

          {/* Location Details */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Pickup Location *
              </label>
              <input
                type='text'
                name='pickupLocation'
                value={formData.pickupLocation}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onBlur={(e) => validateField('pickupLocation', e.target.value)}
                placeholder='Enter pickup address'
                required
                className={`w-full border-2 rounded-lg px-4 py-2 focus:outline-none ${
                  fieldErrors.pickupLocation ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-sky-600'
                }`}
              />
              {fieldErrors.pickupLocation && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.pickupLocation}</p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Dropoff Location *
              </label>
              <input
                type='text'
                name='dropoffLocation'
                value={formData.dropoffLocation}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onBlur={(e) => validateField('dropoffLocation', e.target.value)}
                placeholder='Enter dropoff address'
                required
                className={`w-full border-2 rounded-lg px-4 py-2 focus:outline-none ${
                  fieldErrors.dropoffLocation ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-sky-600'
                }`}
              />
              {fieldErrors.dropoffLocation && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.dropoffLocation}</p>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <h4 className='text-lg font-semibold mb-3'>Customer Information</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Full Name *
              </label>
              <input
                type='text'
                name='customerDetails.name'
                value={formData.customerDetails.name}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onBlur={(e) => validateField('customerDetails.name', e.target.value)}
                required
                className={`w-full border-2 rounded-lg px-4 py-2 focus:outline-none ${
                  fieldErrors['customerDetails.name'] ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-sky-600'
                }`}
              />
              {fieldErrors['customerDetails.name'] && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors['customerDetails.name']}</p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Email *
              </label>
              <input
                type='email'
                name='customerDetails.email'
                value={formData.customerDetails.email}
                onChange={handleInputChange}
                onBlur={(e) => validateField('customerDetails.email', e.target.value)}
                required
                className={`w-full border-2 rounded-lg px-4 py-2 focus:outline-none ${
                  fieldErrors['customerDetails.email'] ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-sky-600'
                }`}
              />
              {fieldErrors['customerDetails.email'] && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors['customerDetails.email']}</p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Phone Number *
              </label>
              <input
                type='tel'
                name='customerDetails.phone'
                value={formData.customerDetails.phone}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onBlur={(e) => validateField('customerDetails.phone', e.target.value)}
                required
                className={`w-full border-2 rounded-lg px-4 py-2 focus:outline-none ${
                  fieldErrors['customerDetails.phone'] ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-sky-600'
                }`}
              />
              {fieldErrors['customerDetails.phone'] && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors['customerDetails.phone']}</p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Driver License Number *
              </label>
              <input
                type='text'
                name='customerDetails.driverLicense'
                value={formData.customerDetails.driverLicense}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onBlur={(e) => validateField('customerDetails.driverLicense', e.target.value)}
                required
                className={`w-full border-2 rounded-lg px-4 py-2 focus:outline-none ${
                  fieldErrors['customerDetails.driverLicense'] ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-sky-600'
                }`}
              />
              {fieldErrors['customerDetails.driverLicense'] && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors['customerDetails.driverLicense']}</p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Special Requests
            </label>
            <textarea
              name='specialRequests'
              value={formData.specialRequests}
              onChange={handleInputChange}
              placeholder='Any special requirements or requests...'
              rows='3'
              className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
            />
          </div>

          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Additional Notes
            </label>
            <textarea
              name='notes'
              value={formData.notes}
              onChange={handleInputChange}
              placeholder='Any additional notes...'
              rows='2'
              className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
            />
          </div>

          {/* Booking Summary */}
          {totalDays > 0 && (
            <div className='bg-gray-50 rounded-lg p-4 mb-6'>
              <h4 className='text-lg font-semibold mb-2'>Booking Summary</h4>
              <div className='flex justify-between items-center mb-2'>
                <span>Rental Days:</span>
                <span className='font-semibold'>{totalDays} days</span>
              </div>
              <div className='flex justify-between items-center mb-2'>
                <span>Price per Day:</span>
                <span className='font-semibold'>${vehicle.pricePerDay}</span>
              </div>
              <div className='flex justify-between items-center mb-2'>
                <span>Subtotal:</span>
                <span className='font-semibold'>${subtotal.toFixed(2)}</span>
              </div>
              <div className='flex justify-between items-center mb-2'>
                <span>Tax (5%):</span>
                <span className='font-semibold'>${tax.toFixed(2)}</span>
              </div>
              <div className='flex justify-between items-center mb-2'>
                <span>Service Fee (5%):</span>
                <span className='font-semibold'>${serviceFee.toFixed(2)}</span>
              </div>
              <hr className='my-2' />
              <div className='flex justify-between items-center text-xl font-bold text-blue-600'>
                <span>Total Amount:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

        {/* Payment Method */}
        {savedCards.length > 0 && (
          <div className='bg-gray-50 rounded-lg p-4 mb-6'>
            <h4 className='text-lg font-semibold mb-3'>Payment Method</h4>
            <div className='flex items-center mb-3'>
              <input
                id='useSavedCard'
                type='checkbox'
                checked={useSavedCard}
                onChange={(e) => setUseSavedCard(e.target.checked)}
                className='mr-2'
              />
              <label htmlFor='useSavedCard' className='text-sm text-gray-700'>Use a saved card</label>
            </div>
            {useSavedCard && (
              <select
                value={selectedPaymentMethodId}
                onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
              >
                {savedCards.map((c) => (
                  <option key={c.stripePaymentMethodId} value={c.stripePaymentMethodId}>
                    {`${c.brand?.toUpperCase() || 'CARD'} •••• ${c.last4}  exp ${String(c.expMonth).padStart(2,'0')}/${c.expYear}${c.isDefault ? '  (default)' : ''}`}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        {savedCards.length === 0 && (
          <div className='bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-4 mb-6'>
            You don’t have any saved cards yet. You can proceed with Stripe Checkout, or
            add a card on the <a href='/saved-cards' className='underline font-medium'>Saved Cards</a> page to pay instantly here.
          </div>
        )}

          {/* Submit Button */}
          <button
            type='submit'
            disabled={loading || totalDays <= 0}
            className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Processing...' : `Proceed to Payment ($${totalAmount.toFixed(2)})`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
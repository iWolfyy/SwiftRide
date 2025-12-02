import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import BackButton from '../components/BackButton';
import Spinner from '../components/Spinner';
import ImageUpload from '../components/ImageUpload';

const AddVehicle = () => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    type: '',
    fuelType: '',
    transmission: '',
    seats: 4,
    pricePerDay: '',
    location: '',
    features: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Simple validation function like add branch
  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };
    
    switch (fieldName) {
      case 'make':
        if (!value?.trim()) {
          errors.make = 'Vehicle is required';
        } else if (value.trim().length < 2) {
          errors.make = 'Must be at least 2 characters';
        } else if (!/^[A-Za-z\s\-&.,()]+$/.test(value.trim())) {
          errors.make = 'Only letters, spaces, hyphens, ampersands, periods, commas, and parentheses allowed';
        } else {
          delete errors.make;
        }
        break;
        
      case 'model':
        if (!value?.trim()) {
          errors.model = 'Model is required';
        } else if (value.trim().length < 1) {
          errors.model = 'Must be at least 1 character';
        } else if (!/^[A-Za-z0-9\s\-.,/]+$/.test(value.trim())) {
          errors.model = 'Only letters, numbers, spaces, hyphens, periods, commas, and / allowed';
        } else {
          delete errors.model;
        }
        break;
        
      case 'licensePlate':
        if (!value?.trim()) {
          errors.licensePlate = 'License plate is required';
        } else if (value.trim().length < 2) {
          errors.licensePlate = 'Must be at least 2 characters';
        } else if (!/^[A-Za-z0-9\s\-.,/]+$/.test(value.trim())) {
          errors.licensePlate = 'Only letters, numbers, spaces, hyphens, periods, commas, and / allowed';
        } else {
          delete errors.licensePlate;
        }
        break;
        
      case 'type':
        if (!value) {
          errors.type = 'Vehicle type is required';
        } else {
          delete errors.type;
        }
        break;
        
      case 'fuelType':
        if (!value) {
          errors.fuelType = 'Fuel type is required';
        } else {
          delete errors.fuelType;
        }
        break;
        
      case 'transmission':
        if (!value) {
          errors.transmission = 'Transmission is required';
        } else {
          delete errors.transmission;
        }
        break;
        
      case 'seats':
        if (!value) {
          errors.seats = 'Number of seats is required';
        } else if (isNaN(parseInt(value)) || parseInt(value) < 1) {
          errors.seats = 'Must be at least 1 seat';
        } else {
          delete errors.seats;
        }
        break;
        
      case 'pricePerDay':
        if (!value) {
          errors.pricePerDay = 'Price per day is required';
        } else if (isNaN(parseFloat(value)) || parseFloat(value) < 1) {
          errors.pricePerDay = 'Must be at least $1';
        } else {
          delete errors.pricePerDay;
        }
        break;
        
      case 'location':
        if (!value?.trim()) {
          errors.location = 'Location is required';
        } else if (value.trim().length < 2) {
          errors.location = 'Must be at least 2 characters';
        } else if (!/^[A-Za-z0-9\s\-.,/]+$/.test(value.trim())) {
          errors.location = 'Only letters, numbers, spaces, hyphens, periods, commas, and / allowed';
        } else {
          delete errors.location;
        }
        break;
        
      case 'features':
        if (value?.trim()) {
          if (!/^[A-Za-z0-9\s\-.,/]+$/.test(value.trim())) {
            errors.features = 'Only letters, numbers, spaces, hyphens, periods, commas, and / allowed';
          } else {
            delete errors.features;
          }
        } else {
          delete errors.features;
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
    
    if (name === 'model' || name === 'licensePlate' || name === 'location' || name === 'features') {
      // Allow letters, numbers, spaces, and basic characters
      if (!/[A-Za-z0-9\s\-.,/]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;
    
    setLoading(true);

    // Check if there are any field errors
    if (Object.keys(fieldErrors).length > 0) {
      enqueueSnackbar("Please fix all validation errors before submitting", { variant: "error" });
      setLoading(false);
      return;
    }

    // Final validation for required fields
    const requiredFields = ['make', 'model', 'type', 'fuelType', 'transmission', 'seats', 'pricePerDay', 'location'];
    const missingFields = requiredFields.filter(field => !formData[field]?.toString().trim());
    
    if (missingFields.length > 0) {
      enqueueSnackbar(`Please fill in all required fields: ${missingFields.join(', ')}`, { variant: "error" });
      setLoading(false);
      return;
    }

    try {
      // Process features from comma-separated strings to arrays
      const processedData = {
        ...formData,
        year: parseInt(formData.year),
        seats: parseInt(formData.seats),
        pricePerDay: parseFloat(formData.pricePerDay),
        features: formData.features && formData.features.trim() ? formData.features.split(',').map(f => f.trim()).filter(f => f) : [],
        images: images,
      };

      console.log('Submitting vehicle data:', processedData);

      const response = await axios.post('http://localhost:5556/vehicles', processedData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Vehicle added successfully:', response.data);
      enqueueSnackbar('Vehicle added successfully!', { variant: 'success' });
      navigate('/seller-dashboard');
    } catch (error) {
      console.error('Error adding vehicle:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Error adding vehicle';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in again';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to add vehicles';
      } else if (error.response?.status === 400) {
        errorMessage = 'Please check your input data';
      } else if (error.response?.status === 409) {
        errorMessage = 'A vehicle with this license plate already exists';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection';
      }
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton />
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Add New Vehicle</h1>
            <p className="text-gray-600">Fill in the details to list your vehicle for rent</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle *
                  </label>
                  <input
                    type="text"
                    id="make"
                    name="make"
                    required
                    value={formData.make}
                    onChange={handleChange}
                    onBlur={(e) => validateField('make', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.make ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Toyota, Honda, Ford"
                  />
                  {fieldErrors.make && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.make}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    required
                    value={formData.model}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    onBlur={(e) => validateField('model', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.model ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Camry, Civic, F-150"
                  />
                  {fieldErrors.model && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.model}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <select
                    id="year"
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-2">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    id="licensePlate"
                    name="licensePlate"
                    required
                    value={formData.licensePlate}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    onBlur={(e) => validateField('licensePlate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.licensePlate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., ABC-1234"
                  />
                  {fieldErrors.licensePlate && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.licensePlate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Specifications */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Type *
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleChange}
                    onBlur={(e) => validateField('type', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Type</option>
                    <option value="car">Car</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="suv">SUV</option>
                  </select>
                  {fieldErrors.type && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.type}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Type *
                  </label>
                  <select
                    id="fuelType"
                    name="fuelType"
                    required
                    value={formData.fuelType}
                    onChange={handleChange}
                    onBlur={(e) => validateField('fuelType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.fuelType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Fuel Type</option>
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  {fieldErrors.fuelType && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.fuelType}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 mb-2">
                    Transmission *
                  </label>
                  <select
                    id="transmission"
                    name="transmission"
                    required
                    value={formData.transmission}
                    onChange={handleChange}
                    onBlur={(e) => validateField('transmission', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.transmission ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Transmission</option>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                  </select>
                  {fieldErrors.transmission && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.transmission}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Seats *
                  </label>
                  <input
                    type="number"
                    id="seats"
                    name="seats"
                    required
                    min="1"
                    max="50"
                    value={formData.seats}
                    onChange={handleChange}
                    onBlur={(e) => validateField('seats', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.seats ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.seats && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.seats}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Rental Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Rental Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="pricePerDay" className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Day ($) *
                  </label>
                  <input
                    type="number"
                    id="pricePerDay"
                    name="pricePerDay"
                    required
                    min="0"
                    step="0.01"
                    value={formData.pricePerDay}
                    onChange={handleChange}
                    onBlur={(e) => validateField('pricePerDay', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.pricePerDay ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 50.00"
                  />
                  {fieldErrors.pricePerDay && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.pricePerDay}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    onBlur={(e) => validateField('location', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.location ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Downtown, Airport, City Center"
                  />
                  {fieldErrors.location && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.location}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-2">
                    Features (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="features"
                    name="features"
                    value={formData.features}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    onBlur={(e) => validateField('features', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.features ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., GPS, Bluetooth, AC, Sunroof"
                  />
                  {fieldErrors.features && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.features}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Separate features with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Images
                  </label>
                  <ImageUpload images={images} setImages={setImages} maxImages={5} />
                  <p className="text-sm text-gray-500 mt-1">Upload up to 5 images of your vehicle</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/seller-dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Spinner />
                    <span>Adding Vehicle...</span>
                  </div>
                ) : (
                  'Add Vehicle'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVehicle;
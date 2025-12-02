import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import BackButton from '../components/BackButton';
import Spinner from '../components/Spinner';
import ImageUpload from '../components/ImageUpload';

const EditVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
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
    description: '',
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const fetchVehicle = async () => {
    try {
      console.log('Fetching vehicle with ID:', id);
      const response = await axios.get(`http://localhost:5556/vehicles/${id}`);
      console.log('Vehicle fetch response:', response.data);
      const vehicle = response.data;
      
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        licensePlate: vehicle.licensePlate || '',
        type: vehicle.type || '',
        fuelType: vehicle.fuelType || '',
        transmission: vehicle.transmission || '',
        seats: vehicle.seats || 4,
        pricePerDay: vehicle.pricePerDay || '',
        location: vehicle.location || '',
        features: vehicle.features ? vehicle.features.join(', ') : '',
        description: vehicle.description || '',
      });
      
      setExistingImages(vehicle.images || []);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      enqueueSnackbar('Error fetching vehicle details', { variant: 'error' });
      navigate('/my-vehicles');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Process features from comma-separated strings to arrays
      const processedData = {
        ...formData,
        year: parseInt(formData.year),
        seats: parseInt(formData.seats),
        pricePerDay: parseFloat(formData.pricePerDay),
        features: formData.features ? formData.features.split(',').map(f => f.trim()).filter(f => f) : [],
      };

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(processedData).forEach(key => {
        if (key === 'features') {
          formDataToSend.append(key, JSON.stringify(processedData[key]));
        } else {
          formDataToSend.append(key, processedData[key]);
        }
      });

      // Add new images
      images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      // Add existing images as a single JSON string
      if (existingImages.length > 0) {
        formDataToSend.append('existingImages', JSON.stringify(existingImages));
      }

      console.log('Sending update data:', processedData);
      console.log('Existing images:', existingImages);
      console.log('New images:', images);

      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Vehicle ID:', id);
      console.log('Request URL:', `http://localhost:5556/vehicles/${id}`);

      console.log('Making PUT request to:', `http://localhost:5556/vehicles/${id}`);
      console.log('FormData contents:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }

      const response = await axios.put(`http://localhost:5556/vehicles/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Response received:', response.data);
      
      enqueueSnackbar('Vehicle updated successfully!', { variant: 'success' });
      navigate('/my-vehicles');
    } catch (error) {
      console.error('Update error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Error updating vehicle';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  if (initialLoading) {
    return <Spinner />;
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <div className='p-4'>
      <BackButton />
      <div className='max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold text-center mb-8'>Edit Vehicle</h1>
        
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Basic Information */}
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-xl font-semibold mb-4'>Basic Information</h2>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Make *
                </label>
                <input
                  type='text'
                  name='make'
                  value={formData.make}
                  onChange={handleChange}
                  required
                  className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
                />
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Model *
                </label>
                <input
                  type='text'
                  name='model'
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
                />
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Year *
                </label>
                <select
                  name='year'
                  value={formData.year}
                  onChange={handleChange}
                  required
                  className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  License Plate *
                </label>
                <input
                  type='text'
                  name='licensePlate'
                  value={formData.licensePlate}
                  onChange={handleChange}
                  required
                  className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
                />
              </div>
            </div>
          </div>

          {/* Vehicle Specifications */}
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-xl font-semibold mb-4'>Specifications</h2>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Type *
                </label>
                <select
                  name='type'
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
                >
                  <option value=''>Select Type</option>
                  <option value='Sedan'>Sedan</option>
                  <option value='SUV'>SUV</option>
                  <option value='Hatchback'>Hatchback</option>
                  <option value='Coupe'>Coupe</option>
                  <option value='Convertible'>Convertible</option>
                  <option value='Truck'>Truck</option>
                  <option value='Van'>Van</option>
                </select>
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Fuel Type *
                </label>
                <select
                  name='fuelType'
                  value={formData.fuelType}
                  onChange={handleChange}
                  required
                  className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
                >
                  <option value=''>Select Fuel Type</option>
                  <option value='Gasoline'>Gasoline</option>
                  <option value='Diesel'>Diesel</option>
                  <option value='Hybrid'>Hybrid</option>
                  <option value='Electric'>Electric</option>
                </select>
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Transmission *
                </label>
                <select
                  name='transmission'
                  value={formData.transmission}
                  onChange={handleChange}
                  required
                  className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
                >
                  <option value=''>Select Transmission</option>
                  <option value='Automatic'>Automatic</option>
                  <option value='Manual'>Manual</option>
                  <option value='CVT'>CVT</option>
                </select>
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Number of Seats *
                </label>
                <select
                  name='seats'
                  value={formData.seats}
                  onChange={handleChange}
                  required
                  className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
                >
                  <option value='2'>2 Seats</option>
                  <option value='4'>4 Seats</option>
                  <option value='5'>5 Seats</option>
                  <option value='6'>6 Seats</option>
                  <option value='7'>7 Seats</option>
                  <option value='8'>8 Seats</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing and Location */}
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-xl font-semibold mb-4'>Pricing & Location</h2>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Price per Day ($) *
                </label>
                <input
                  type='number'
                  name='pricePerDay'
                  value={formData.pricePerDay}
                  onChange={handleChange}
                  required
                  min='1'
                  step='0.01'
                  className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
                />
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Location *
                </label>
                <input
                  type='text'
                  name='location'
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder='City, State'
                  className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-xl font-semibold mb-4'>Features</h2>
            
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Features (comma-separated)
              </label>
              <input
                type='text'
                name='features'
                value={formData.features}
                onChange={handleChange}
                placeholder='GPS, Bluetooth, Air Conditioning, etc.'
                className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
              />
            </div>
            
            <div className='mt-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Description
              </label>
              <textarea
                name='description'
                value={formData.description}
                onChange={handleChange}
                rows='3'
                placeholder='Additional details about the vehicle...'
                className='w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-600'
              />
            </div>
          </div>

          {/* Images */}
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-xl font-semibold mb-4'>Images</h2>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className='mb-6'>
                <h3 className='text-lg font-medium mb-2'>Current Images</h3>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  {existingImages.map((image, index) => (
                    <div key={index} className='relative'>
                      <img
                        src={image}
                        alt={`Vehicle ${index + 1}`}
                        className='w-full h-24 object-cover rounded-lg'
                      />
                      <button
                        type='button'
                        onClick={() => removeExistingImage(index)}
                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600'
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* New Images */}
            <div>
              <h3 className='text-lg font-medium mb-2'>Add New Images</h3>
              <ImageUpload
                images={images}
                setImages={setImages}
                maxImages={5}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className='flex justify-center'>
            <button
              type='submit'
              disabled={loading}
              className='bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center space-x-2'
            >
              {loading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Vehicle</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVehicle;

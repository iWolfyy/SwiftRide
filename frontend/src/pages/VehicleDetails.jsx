import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../components/Spinner';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { 
  AiOutlineCar, 
  AiOutlineUser, 
  AiOutlinePhone, 
  AiOutlineMail,
  AiOutlineEnvironment,
  AiOutlineCalendar,
  AiOutlineTag,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle
} from 'react-icons/ai';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const response = await axios.get(`http://localhost:5556/vehicles/${id}`);
      setVehicle(response.data);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      enqueueSnackbar('Error fetching vehicle details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (vehicle.images && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === vehicle.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (vehicle.images && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? vehicle.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Found</h2>
          <p className="text-gray-600 mb-4">The vehicle you're looking for doesn't exist.</p>
          <Link to="/vehicles" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Back to Vehicles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Image Gallery */}
            <div className="md:w-1/2">
              <div className="relative h-96 md:h-full">
                {vehicle.images && vehicle.images.length > 0 ? (
                  <>
                    <img
                      src={vehicle.images[currentImageIndex]}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {vehicle.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                        >
                          ←
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                        >
                          →
                        </button>
                        
                        {/* Image Dots */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {vehicle.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-3 h-3 rounded-full ${
                                index === currentImageIndex 
                                  ? 'bg-white' 
                                  : 'bg-white bg-opacity-50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <AiOutlineCar className="text-6xl text-gray-400" />
                  </div>
                )}
                
                {/* Availability Status */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    vehicle.isAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {vehicle.isAvailable ? (
                      <>
                        <AiOutlineCheckCircle className="inline mr-1" />
                        Available
                      </>
                    ) : (
                      <>
                        <AiOutlineCloseCircle className="inline mr-1" />
                        Not Available
                      </>
                    )}
                  </span>
                </div>
              </div>
              
              {/* Thumbnail Images */}
              {vehicle.images && vehicle.images.length > 1 && (
                <div className="flex space-x-2 p-4 overflow-x-auto">
                  {vehicle.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                        index === currentImageIndex 
                          ? 'border-blue-500' 
                          : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${vehicle.make} ${vehicle.model} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="md:w-1/2 p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <p className="text-gray-600 flex items-center">
                  <AiOutlineTag className="mr-2" />
                  {vehicle.licensePlate}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-blue-600">
                    ${vehicle.pricePerDay}
                  </span>
                  <span className="text-xl text-gray-600 ml-2">/day</span>
                </div>
              </div>

              {/* Vehicle Specifications */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">{vehicle.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fuel Type:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">{vehicle.fuelType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Transmission:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">{vehicle.transmission}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Seats:</span>
                    <span className="ml-2 font-medium text-gray-900">{vehicle.seats}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 flex items-center">
                      <AiOutlineEnvironment className="mr-1" />
                      Location:
                    </span>
                    <span className="ml-2 font-medium text-gray-900">{vehicle.location}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Seller Information */}
              {vehicle.seller && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <AiOutlineUser className="text-gray-600 mr-2" />
                      <span className="font-medium">{vehicle.seller.name}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <AiOutlineMail className="text-gray-600 mr-2" />
                      <span className="text-gray-700">{vehicle.seller.email}</span>
                    </div>
                    {vehicle.seller.phone && (
                      <div className="flex items-center">
                        <AiOutlinePhone className="text-gray-600 mr-2" />
                        <span className="text-gray-700">{vehicle.seller.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                {user && user.role === 'customer' && vehicle.isAvailable && (
                  <button 
                    onClick={() => navigate(`/book/${id}`)}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <AiOutlineCalendar className="mr-2" />
                    Book Now
                  </button>
                )}
                
                {(!user || user.role !== 'customer') && (
                  <Link
                    to="/login"
                    className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                  >
                    Login to Book
                  </Link>
                )}
                
                <Link
                  to="/vehicles"
                  className="block w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
                >
                  Back to Vehicles
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Details Table */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Year</td>
                  <td className="py-3 text-gray-900">{vehicle.year}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Make</td>
                  <td className="py-3 text-gray-900">{vehicle.make}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Model</td>
                  <td className="py-3 text-gray-900">{vehicle.model}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium">License Plate</td>
                  <td className="py-3 text-gray-900">{vehicle.licensePlate}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Vehicle Type</td>
                  <td className="py-3 text-gray-900 capitalize">{vehicle.type}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Fuel Type</td>
                  <td className="py-3 text-gray-900 capitalize">{vehicle.fuelType}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Transmission</td>
                  <td className="py-3 text-gray-900 capitalize">{vehicle.transmission}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Number of Seats</td>
                  <td className="py-3 text-gray-900">{vehicle.seats}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Daily Rate</td>
                  <td className="py-3 text-gray-900">${vehicle.pricePerDay}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Location</td>
                  <td className="py-3 text-gray-900">{vehicle.location}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Availability</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      vehicle.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {vehicle.isAvailable ? 'Available' : 'Not Available'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Added Date</td>
                  <td className="py-3 text-gray-900">
                    {new Date(vehicle.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
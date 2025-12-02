import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import Spinner from '../components/Spinner';
import { AiOutlineEye, AiOutlineEdit, AiOutlineDelete, AiOutlinePlus, AiOutlineFilePdf } from 'react-icons/ai';
import BackButton from '../components/BackButton';
import { exportVehiclePDF } from '../utils/vehiclePdfGenerator';

const MyVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:5556/vehicles/seller/my-vehicles');
      setVehicles(response.data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      enqueueSnackbar('Error fetching vehicles', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await axios.delete(`http://localhost:5556/vehicles/${vehicleId}`);
        enqueueSnackbar('Vehicle deleted successfully', { variant: 'success' });
        fetchVehicles(); // Refresh the list
      } catch (error) {
        enqueueSnackbar('Error deleting vehicle', { variant: 'error' });
      }
    }
  };

  const toggleAvailability = async (vehicleId, currentStatus) => {
    try {
      await axios.put(`http://localhost:5556/vehicles/${vehicleId}`, {
        isAvailable: !currentStatus
      });
      enqueueSnackbar(`Vehicle ${!currentStatus ? 'activated' : 'deactivated'} successfully`, { variant: 'success' });
      fetchVehicles(); // Refresh the list
    } catch (error) {
      enqueueSnackbar('Error updating vehicle status', { variant: 'error' });
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton />
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Vehicles</h1>
              <p className="text-gray-600">Manage your vehicle listings</p>
            </div>
            <Link
              to="/add-vehicle"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <AiOutlinePlus className="h-5 w-5" />
              <span>Add Vehicle</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            {vehicles.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Specs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price/Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.licensePlate}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.images && vehicle.images.length > 0 ? (
                          <img
                            src={vehicle.images[0]}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="h-16 w-24 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-16 w-24 bg-gray-200 rounded-md flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.type} • {vehicle.fuelType}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle.transmission} • {vehicle.seats} seats
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${vehicle.pricePerDay}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleAvailability(vehicle._id, vehicle.isAvailable)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                            vehicle.isAvailable 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {vehicle.isAvailable ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => exportVehiclePDF(vehicle, enqueueSnackbar)}
                            className="text-red-600 hover:text-red-900"
                            title="Export Vehicle PDF"
                          >
                            <AiOutlineFilePdf className="h-5 w-5" />
                          </button>
                          <Link
                            to={`/vehicles/${vehicle._id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <AiOutlineEye className="h-5 w-5" />
                          </Link>
                          <Link
                            to={`/vehicles/edit/${vehicle._id}`}
                            className="text-green-600 hover:text-green-900"
                            title="Edit Vehicle"
                          >
                            <AiOutlineEdit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(vehicle._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Vehicle"
                          >
                            <AiOutlineDelete className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <AiOutlinePlus className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles yet</h3>
                <p className="text-gray-500 mb-6">Get started by adding your first vehicle for rent.</p>
                <Link
                  to="/add-vehicle"
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 inline-flex items-center space-x-2"
                >
                  <AiOutlinePlus className="h-5 w-5" />
                  <span>Add Your First Vehicle</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyVehicles;
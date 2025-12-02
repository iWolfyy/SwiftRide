import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { AiOutlineCar, AiOutlineCalendar, AiOutlineUser, AiOutlineDollarCircle, AiOutlineEdit, AiOutlineDelete, AiOutlineSearch, AiOutlineSortAscending, AiOutlineSortDescending } from 'react-icons/ai';
import Spinner from '../components/Spinner';
import UpdateBookingModal from '../components/UpdateBookingModal';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('startDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5556/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userBookings = response.data || [];
      setBookings(userBookings);
      setFilteredBookings(userBookings);
      
      // Calculate stats
      const totalBookings = userBookings.length;
      const activeBookings = userBookings.filter(b => b.status === 'active' || b.status === 'confirmed').length;
      const completedBookings = userBookings.filter(b => b.paymentStatus === 'paid' && (b.status === 'completed' || b.status === 'confirmed')).length;
      const totalSpent = userBookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + b.totalAmount, 0);
      
      setStats({ totalBookings, activeBookings, completedBookings, totalSpent });
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters and search
  const applyFilters = () => {
    let filtered = [...bookings];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.vehicle?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicle?.year?.toString().includes(searchTerm) ||
        booking.vehicle?.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.paymentStatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.totalAmount?.toString().includes(searchTerm) ||
        new Date(booking.startDate).toLocaleDateString().includes(searchTerm) ||
        new Date(booking.endDate).toLocaleDateString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Apply payment status filter
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(booking => booking.paymentStatus === filters.paymentStatus);
    }

    setFilteredBookings(filtered);
  };

  // Search function
  const handleSearch = (term) => {
    setSearchTerm(term);
    // Apply filters will be called in useEffect
  };

  // Filter change handler
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      status: 'all',
      paymentStatus: 'all'
    });
    setSortField('startDate');
    setSortDirection('desc');
  };

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, bookings]);

  // Sort function
  const handleSort = (field) => {
    let direction = 'asc';
    if (sortField === field && sortDirection === 'asc') {
      direction = 'desc';
    }
    
    setSortField(field);
    setSortDirection(direction);
    
    const sorted = [...filteredBookings].sort((a, b) => {
      let aValue = a[field] || '';
      let bValue = b[field] || '';
      
      // Handle different data types
      if (field === 'totalAmount' || field === 'totalDays' || field === 'pricePerDay') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else if (field === 'startDate' || field === 'endDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (field === 'vehicle') {
        // Sort by vehicle make and model
        aValue = `${a.vehicle?.make || ''} ${a.vehicle?.model || ''}`.toLowerCase();
        bValue = `${b.vehicle?.make || ''} ${b.vehicle?.model || ''}`.toLowerCase();
      } else {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }
      
      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredBookings(sorted);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5556/bookings/${bookingId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      enqueueSnackbar('Booking cancelled successfully', { variant: 'success' });
      fetchBookings(); // Refresh the bookings list
    } catch (error) {
      console.error('Error cancelling booking:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Error cancelling booking', 
        { variant: 'error' }
      );
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5556/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      enqueueSnackbar('Booking deleted successfully', { variant: 'success' });
      fetchBookings(); // Refresh the bookings list
    } catch (error) {
      console.error('Error deleting booking:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Error deleting booking', 
        { variant: 'error' }
      );
    }
  };

  const handleUpdateBooking = async (bookingId, updateData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5556/bookings/${bookingId}/update`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      enqueueSnackbar('Booking updated successfully', { variant: 'success' });
      fetchBookings(); // Refresh the bookings list
      setShowUpdateModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Error updating booking', 
        { variant: 'error' }
      );
    }
  };

  const handleOpenUpdateModal = (booking) => {
    setSelectedBooking(booking);
    setShowUpdateModal(true);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedBooking(null);
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

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-100 p-8 rounded-2xl shadow-lg border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Customer Dashboard</h1>
              <p className="text-gray-600 text-lg">Welcome back, <span className="font-semibold text-blue-700">{user?.name}</span>!</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/payment-history')}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <AiOutlineDollarCircle className="h-5 w-5" />
                Payment History
              </button>
              <button
                onClick={() => navigate('/saved-cards')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <AiOutlineDollarCircle className="h-5 w-5" />
                Manage Payment Methods
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Bookings</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalBookings}</p>
                <p className="text-xs text-blue-600 mt-1">All time</p>
              </div>
              <div className="p-3 rounded-full bg-blue-200">
                <AiOutlineCalendar className="h-8 w-8 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Bookings</p>
                <p className="text-3xl font-bold text-green-900">{stats.activeBookings}</p>
                <p className="text-xs text-green-600 mt-1">Currently active</p>
              </div>
              <div className="p-3 rounded-full bg-green-200">
                <AiOutlineCar className="h-8 w-8 text-green-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Completed</p>
                <p className="text-3xl font-bold text-purple-900">{stats.completedBookings}</p>
                <p className="text-xs text-purple-600 mt-1">Successfully finished</p>
              </div>
              <div className="p-3 rounded-full bg-purple-200">
                <AiOutlineUser className="h-8 w-8 text-purple-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Total Spent</p>
                <p className="text-3xl font-bold text-yellow-900">${stats.totalSpent.toFixed(2)}</p>
                <p className="text-xs text-yellow-600 mt-1">All time spending</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-200">
                <AiOutlineDollarCircle className="h-8 w-8 text-yellow-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            {/* Search and Basic Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AiOutlineSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              {/* Sort Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortField}
                  onChange={(e) => handleSort(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="startDate">Start Date</option>
                  <option value="endDate">End Date</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="totalAmount">Amount</option>
                  <option value="status">Status</option>
                  <option value="paymentStatus">Payment Status</option>
                  <option value="totalDays">Duration</option>
                </select>
                <button
                  onClick={() => handleSort(sortField)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {sortDirection === 'asc' ? (
                    <AiOutlineSortAscending className="h-4 w-4" />
                  ) : (
                    <AiOutlineSortDescending className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleFilterChange('status', 'all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.status === 'all' 
                    ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Bookings
              </button>
              <button
                onClick={() => handleFilterChange('status', 'active')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.status === 'active' 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => handleFilterChange('status', 'confirmed')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.status === 'confirmed' 
                    ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => handleFilterChange('status', 'completed')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.status === 'completed' 
                    ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => handleFilterChange('paymentStatus', 'paid')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.paymentStatus === 'paid' 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => clearAllFilters}
                className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Clear All
              </button>
            </div>
            
            {/* Results count */}
            <div className="text-sm text-gray-600">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredBookings.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('vehicle')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Vehicle</span>
                        {sortField === 'vehicle' && (
                          sortDirection === 'asc' ? <AiOutlineSortAscending className="h-3 w-3" /> : <AiOutlineSortDescending className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('startDate')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Dates</span>
                        {sortField === 'startDate' && (
                          sortDirection === 'asc' ? <AiOutlineSortAscending className="h-3 w-3" /> : <AiOutlineSortDescending className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('totalAmount')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Amount</span>
                        {sortField === 'totalAmount' && (
                          sortDirection === 'asc' ? <AiOutlineSortAscending className="h-3 w-3" /> : <AiOutlineSortDescending className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('paymentStatus')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Payment</span>
                        {sortField === 'paymentStatus' && (
                          sortDirection === 'asc' ? <AiOutlineSortAscending className="h-3 w-3" /> : <AiOutlineSortDescending className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Status</span>
                        {sortField === 'status' && (
                          sortDirection === 'asc' ? <AiOutlineSortAscending className="h-3 w-3" /> : <AiOutlineSortDescending className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {booking.vehicle?.images && booking.vehicle.images.length > 0 && (
                            <img
                              src={`${booking.vehicle.images[0]}`}
                              alt={`${booking.vehicle?.make} ${booking.vehicle?.model}`}
                              className="h-10 w-10 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.vehicle?.licensePlate}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(booking.startDate).toLocaleDateString()} 
                        </div>
                        <div className="text-sm text-gray-900">
                          {new Date(booking.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.totalDays} days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${booking.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${booking.pricePerDay}/day
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : booking.paymentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.paymentStatus || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/booking/${booking._id}`)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded text-xs"
                          >
                            View Details
                          </button>
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button
                              onClick={() => handleOpenUpdateModal(booking)}
                              className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded text-xs flex items-center space-x-1"
                            >
                              <AiOutlineEdit className="h-3 w-3" />
                              <span>Update</span>
                            </button>
                          )}
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded text-xs"
                            >
                              Cancel
                            </button>
                          )}
                          {(booking.status === 'cancelled' || booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button
                              onClick={() => handleDeleteBooking(booking._id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded text-xs flex items-center space-x-1"
                            >
                              <AiOutlineDelete className="h-3 w-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">
                {searchTerm ? 'No bookings found matching your search.' : 'No bookings found. '}
                {!searchTerm && <a href="/vehicles" className="text-blue-600 hover:text-blue-500">Browse vehicles</a>} 
                {!searchTerm && ' to make your first booking.'}
              </div>
            )}
          </div>
        </div>

        {/* Update Booking Modal */}
        <UpdateBookingModal
          isOpen={showUpdateModal}
          onClose={handleCloseUpdateModal}
          booking={selectedBooking}
          onUpdate={handleUpdateBooking}
        />
      </div>
    </div>
  );
};

export default CustomerDashboard;
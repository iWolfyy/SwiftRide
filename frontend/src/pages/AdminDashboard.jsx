import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { AiOutlineCar, AiOutlineCalendar, AiOutlineUser, AiOutlineDollarCircle, AiOutlineEye, AiOutlineDelete, AiOutlineBarChart, AiOutlineTransaction, AiOutlineFilter, AiOutlineSearch, AiOutlineDownload } from 'react-icons/ai';
import Spinner from '../components/Spinner';
import { useSnackbar } from 'notistack';
import { exportUserPDF } from '../utils/userPdfGenerator';
import { generateSummaryReportPDF, generateTransactionReportPDF } from '../utils/financialPdfGenerator';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { enqueueSnackbar } = useSnackbar();

  // User management state
  const [userFilters, setUserFilters] = useState({
    role: '',
    isActive: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [userPagination, setUserPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [userLoading, setUserLoading] = useState(false);

  // Finance state
  const [financeData, setFinanceData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionPagination, setTransactionPagination] = useState({});
  const [transactionFilters, setTransactionFilters] = useState({
    status: '',
    paymentStatus: '',
    startDate: '',
    endDate: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [financeLoading, setFinanceLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all');


  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5556/admin/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Only show error if user is authenticated (not during initial load)
      if (user && user.role === 'admin') {
      enqueueSnackbar('Error loading dashboard data', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, user]);

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setUserLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: userPagination.itemsPerPage.toString(),
        ...userFilters
      });

      const response = await axios.get(`http://localhost:5556/admin/users?${queryParams}`);
      setUsers(response.data.users || []);
      setUserPagination({
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1,
        totalItems: response.data.total || 0,
        itemsPerPage: userPagination.itemsPerPage
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      enqueueSnackbar('Error loading users', { variant: 'error' });
    } finally {
      setUserLoading(false);
    }
  }, [userFilters, userPagination.itemsPerPage, enqueueSnackbar]);

  // Finance functions
  const fetchFinanceData = useCallback(async () => {
    try {
      setFinanceLoading(true);
      const response = await axios.get(`http://localhost:5556/admin/finance/overview?period=${selectedPeriod}`);
      setFinanceData(response.data);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      enqueueSnackbar('Error loading financial data', { variant: 'error' });
    } finally {
      setFinanceLoading(false);
    }
  }, [selectedPeriod, enqueueSnackbar]);

  const fetchTransactions = useCallback(async (page = 1, searchTerm = debouncedSearch) => {
    try {
      setFinanceLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: transactionFilters.status,
        paymentStatus: transactionFilters.paymentStatus,
        startDate: transactionFilters.startDate,
        endDate: transactionFilters.endDate,
        sortBy: transactionFilters.sortBy,
        sortOrder: transactionFilters.sortOrder,
        search: searchTerm
      });

      const response = await axios.get(`http://localhost:5556/admin/finance/transactions?${queryParams}`);
      setTransactions(response.data.transactions || []);
      setTransactionPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching transactions:', error);
      enqueueSnackbar('Error loading transactions', { variant: 'error' });
    } finally {
      setFinanceLoading(false);
    }
  }, [transactionFilters.status, transactionFilters.paymentStatus, transactionFilters.startDate, transactionFilters.endDate, transactionFilters.sortBy, transactionFilters.sortOrder, debouncedSearch, enqueueSnackbar]);

  useEffect(() => {
    if (user && user.role === 'admin') {
    fetchDashboardData();
    }
  }, [fetchDashboardData, user]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1);
    }
  }, [activeTab, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1);
    }
  }, [userFilters, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'finance') {
      fetchFinanceData();
      fetchTransactions();
    }
  }, [activeTab, fetchFinanceData, fetchTransactions]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(transactionFilters.search);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [transactionFilters.search]);

  // Fetch transactions when filters change (excluding search)
  useEffect(() => {
    if (activeTab === 'finance') {
      fetchTransactions(1, debouncedSearch);
    }
  }, [activeTab, fetchTransactions, transactionFilters.status, transactionFilters.paymentStatus, transactionFilters.startDate, transactionFilters.endDate, transactionFilters.sortBy, transactionFilters.sortOrder]);

  // Fetch transactions when debounced search changes
  useEffect(() => {
    if (activeTab === 'finance') {
      fetchTransactions(1, debouncedSearch);
    }
  }, [activeTab, fetchTransactions, debouncedSearch]);

  const updateUserStatus = async (userId, isActive) => {
    try {
      await axios.put(`http://localhost:5556/admin/users/${userId}/status`, { isActive });
      enqueueSnackbar(`User ${isActive ? 'activated' : 'deactivated'} successfully`, { variant: 'success' });
      fetchUsers();
    } catch (error) {
      enqueueSnackbar('Error updating user status', { variant: 'error' });
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      await axios.put(`http://localhost:5556/admin/users/${userId}/role`, { role });
      enqueueSnackbar('User role updated successfully', { variant: 'success' });
      fetchUsers();
    } catch (error) {
      enqueueSnackbar('Error updating user role', { variant: 'error' });
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:5556/admin/users/${userId}`);
        enqueueSnackbar('User deleted successfully', { variant: 'success' });
        fetchUsers();
      } catch (error) {
        enqueueSnackbar(error.response?.data?.message || 'Error deleting user', { variant: 'error' });
      }
    }
  };

  const handleTransactionFilterChange = (key, value) => {
    // Validate date ranges
    if (key === 'startDate' && value && transactionFilters.endDate && value > transactionFilters.endDate) {
      // If start date is after end date, clear the end date
      setTransactionFilters(prev => ({ ...prev, [key]: value, endDate: '' }));
    } else if (key === 'endDate' && value && transactionFilters.startDate && value < transactionFilters.startDate) {
      // If end date is before start date, clear the start date
      setTransactionFilters(prev => ({ ...prev, [key]: value, startDate: '' }));
    } else {
      setTransactionFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const clearTransactionFilters = () => {
    setTransactionFilters({
      status: '',
      paymentStatus: '',
      startDate: '',
      endDate: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    fetchFinanceData();
  };

  // User management handlers
  const handleUserFilterChange = (key, value) => {
    setUserFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearUserFilters = () => {
    setUserFilters({
      role: '',
      isActive: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };


  const exportFinancialReport = async (reportType) => {
    try {
      const queryParams = new URLSearchParams({
        reportType,
        startDate: transactionFilters.startDate,
        endDate: transactionFilters.endDate
      });

      const response = await axios.get(`http://localhost:5556/admin/finance/reports?${queryParams}`);
      const reportData = response.data;

      let doc;
      const dateRange = transactionFilters.startDate && transactionFilters.endDate ? {
        startDate: transactionFilters.startDate,
        endDate: transactionFilters.endDate
      } : null;

      switch (reportType) {
        case 'summary':
          doc = generateSummaryReportPDF(reportData, dateRange);
          break;
        case 'transactions':
          doc = generateTransactionReportPDF(transactions, dateRange);
          break;
        default:
          doc = generateSummaryReportPDF(reportData, dateRange);
      }

      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const filename = `financial-report-${reportType}-${date}.pdf`;
      
      // Save the PDF
      doc.save(filename);

      enqueueSnackbar(`PDF report exported successfully: ${filename}`, { variant: 'success' });
    } catch (error) {
      console.error('Error exporting PDF report:', error);
      enqueueSnackbar('Error exporting PDF report', { variant: 'error' });
    }
  };

  if (loading) return <Spinner />;

  // Check if user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Please Login</h1>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user is admin
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Current role: {user.role}</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.statistics || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-100 p-8 rounded-2xl shadow-lg border border-purple-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome back, <span className="font-semibold text-purple-700">{user?.name}</span>! Manage the entire system.</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'finance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AiOutlineDollarCircle className="h-4 w-4" />
                <span>Finance</span>
              </div>
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Users</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.totalUsers || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">Registered users</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-200">
                    <AiOutlineUser className="h-8 w-8 text-blue-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Vehicles</p>
                    <p className="text-3xl font-bold text-green-900">{stats.totalVehicles || 0}</p>
                    <p className="text-xs text-green-600 mt-1">In fleet</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-200">
                    <AiOutlineCar className="h-8 w-8 text-green-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Bookings</p>
                    <p className="text-3xl font-bold text-purple-900">{stats.totalBookings || 0}</p>
                    <p className="text-xs text-purple-600 mt-1">All time</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-200">
                    <AiOutlineCalendar className="h-8 w-8 text-purple-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-yellow-900">${stats.monthlyRevenue || 0}</p>
                    <p className="text-xs text-yellow-600 mt-1">This month</p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-200">
                    <AiOutlineDollarCircle className="h-8 w-8 text-yellow-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl shadow-lg border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">User Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-indigo-700">Customers</span>
                    <span className="text-lg font-bold text-indigo-900">{stats.totalCustomers || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-indigo-700">Sellers</span>
                    <span className="text-lg font-bold text-indigo-900">{stats.totalSellers || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl shadow-lg border border-emerald-200">
                <h3 className="text-lg font-semibold text-emerald-900 mb-4">Vehicle Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-emerald-700">Available</span>
                    <span className="text-lg font-bold text-emerald-900">{stats.availableVehicles || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-emerald-700">Rented</span>
                    <span className="text-lg font-bold text-emerald-900">{(stats.totalVehicles || 0) - (stats.availableVehicles || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-6 rounded-xl shadow-lg border border-rose-200">
                <h3 className="text-lg font-semibold text-rose-900 mb-4">Booking Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-rose-700">Pending</span>
                    <span className="text-lg font-bold text-rose-900">{stats.pendingBookings || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-rose-700">Active</span>
                    <span className="text-lg font-bold text-rose-900">{stats.activeBookings || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
              </div>
              <div className="p-6">
                {dashboardData?.recentBookings?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentBookings.map((booking) => (
                      <div key={booking._id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {booking.vehicle?.make} {booking.vehicle?.model}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Customer: {booking.customer?.name} ({booking.customer?.email})
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ${booking.totalAmount}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">No recent bookings.</p>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Management Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-2xl shadow-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-2">User Management</h2>
                  <p className="text-blue-700">Manage users, roles, and account status</p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={clearUserFilters}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <AiOutlineFilter className="h-4 w-4" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* User Filters */}
            <div className="bg-white shadow-lg rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Filter & Search Users</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <div className="relative">
                      <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Name or email"
                        value={userFilters.search}
                        onChange={(e) => handleUserFilterChange('search', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={userFilters.role}
                      onChange={(e) => handleUserFilterChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Roles</option>
                      <option value="customer">Customer</option>
                      <option value="seller">Seller</option>
                      <option value="branch-manager">Branch Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={userFilters.isActive}
                      onChange={(e) => handleUserFilterChange('isActive', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                      value={userFilters.sortBy}
                      onChange={(e) => handleUserFilterChange('sortBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="createdAt">Join Date</option>
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="role">Role</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                    <select
                      value={userFilters.sortOrder}
                      onChange={(e) => handleUserFilterChange('sortOrder', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow-lg rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Users</h3>
                  <div className="text-sm text-gray-500">
                    {userPagination.totalItems} total users
                  </div>
                </div>
              </div>
              
              {userLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {users.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <tr key={userItem._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {userItem.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userItem.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={userItem.role}
                            onChange={(e) => updateUserRole(userItem._id, e.target.value)}
                            className="text-sm border-gray-300 rounded"
                          >
                            <option value="customer">Customer</option>
                            <option value="seller">Seller</option>
                            <option value="branch-manager">Branch Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userItem.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {userItem.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(userItem.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => exportUserPDF(userItem, enqueueSnackbar)}
                              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                              title="Export User Report"
                            >
                              <AiOutlineDownload className="h-4 w-4" />
                              <span>Export PDF</span>
                            </button>
                            <button
                              onClick={() => updateUserStatus(userItem._id, !userItem.isActive)}
                              className={`${
                                userItem.isActive 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {userItem.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => deleteUser(userItem._id)}
                              className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                            >
                              <AiOutlineDelete className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No users found.
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {userPagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                      Showing {((userPagination.currentPage - 1) * userPagination.itemsPerPage) + 1} to{' '}
                      {Math.min(userPagination.currentPage * userPagination.itemsPerPage, userPagination.totalItems)} of{' '}
                      {userPagination.totalItems} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchUsers(userPagination.currentPage - 1)}
                        disabled={userPagination.currentPage <= 1}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-sm text-gray-700">
                        Page {userPagination.currentPage} of {userPagination.totalPages}
                      </span>
                      <button
                        onClick={() => fetchUsers(userPagination.currentPage + 1)}
                        disabled={userPagination.currentPage >= userPagination.totalPages}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-8">
            {/* Finance Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-6 rounded-2xl shadow-lg border border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-green-900 mb-2">Financial Overview</h2>
                  <p className="text-green-700">Monitor revenue, transactions, and financial performance</p>
                </div>
                <div className="flex space-x-4">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="px-4 py-2 border border-green-300 rounded-lg bg-white text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Time</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                  <button
                    onClick={() => exportFinancialReport('summary')}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <AiOutlineDownload className="h-4 w-4" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {financeLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
              </div>
            ) : (
              <>
                {/* Financial Stats Cards */}
                {financeData && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Total Revenue</p>
                          <p className="text-3xl font-bold text-green-900">
                            ${financeData.revenueStats?.totalRevenue?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-green-600 mt-1">Selected period</p>
                        </div>
                        <div className="p-3 rounded-full bg-green-200">
                          <AiOutlineDollarCircle className="h-8 w-8 text-green-700" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Transactions</p>
                          <p className="text-3xl font-bold text-blue-900">
                            {financeData.revenueStats?.totalTransactions || 0}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">Completed payments</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-200">
                          <AiOutlineTransaction className="h-8 w-8 text-blue-700" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Avg Transaction</p>
                          <p className="text-3xl font-bold text-purple-900">
                            ${Math.round(financeData.revenueStats?.averageTransactionValue || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-purple-600 mt-1">Per booking</p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-200">
                          <AiOutlineBarChart className="h-8 w-8 text-purple-700" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Max Transaction</p>
                          <p className="text-3xl font-bold text-orange-900">
                            ${financeData.revenueStats?.maxTransactionValue?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-orange-600 mt-1">Highest single booking</p>
                        </div>
                        <div className="p-3 rounded-full bg-orange-200">
                          <AiOutlineEye className="h-8 w-8 text-orange-700" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {/* Payment Status Breakdown */}
                {financeData?.paymentStatusBreakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white shadow-lg rounded-xl border border-gray-200">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Payment Status Breakdown</h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          {financeData.paymentStatusBreakdown.map((status) => (
                            <div key={status._id} className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  status._id === 'paid' ? 'bg-green-500' :
                                  status._id === 'pending' ? 'bg-yellow-500' :
                                  status._id === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                                }`}></div>
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {status._id}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{status.count}</p>
                                <p className="text-xs text-gray-500">${status.totalAmount?.toLocaleString() || 0}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white shadow-lg rounded-xl border border-gray-200">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Booking Status Breakdown</h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          {financeData.bookingStatusBreakdown.map((status) => (
                            <div key={status._id} className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  status._id === 'completed' ? 'bg-green-500' :
                                  status._id === 'active' ? 'bg-blue-500' :
                                  status._id === 'pending' ? 'bg-yellow-500' :
                                  status._id === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                                }`}></div>
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {status._id}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{status.count}</p>
                                <p className="text-xs text-gray-500">${status.totalAmount?.toLocaleString() || 0}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Performing Vehicles */}
                {financeData?.topVehicles && financeData.topVehicles.length > 0 && (
                  <div className="bg-white shadow-lg rounded-xl border border-gray-200 mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Top Performing Vehicles</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {financeData.topVehicles.slice(0, 5).map((vehicle, index) => (
                          <div key={vehicle._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-700">#{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {vehicle.vehicleInfo?.make} {vehicle.vehicleInfo?.model}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {vehicle.vehicleInfo?.licensePlate} • {vehicle.vehicleInfo?.year}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                ${vehicle.revenue?.toLocaleString() || 0}
                              </p>
                              <p className="text-sm text-gray-500">{vehicle.bookings} bookings</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction Management */}
                <div className="bg-white shadow-lg rounded-xl border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Transaction Management</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={clearTransactionFilters}
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <AiOutlineFilter className="h-4 w-4" />
                          <span>Clear Filters</span>
                        </button>
                        <button
                          onClick={() => exportFinancialReport('transactions')}
                          className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <AiOutlineDownload className="h-4 w-4" />
                          <span>Export PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <div className="relative">
                          <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Customer name or email"
                            value={transactionFilters.search}
                            onChange={(e) => handleTransactionFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={transactionFilters.status}
                          onChange={(e) => handleTransactionFilterChange('status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                        <select
                          value={transactionFilters.paymentStatus}
                          onChange={(e) => handleTransactionFilterChange('paymentStatus', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">All Payment Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={transactionFilters.startDate}
                          onChange={(e) => handleTransactionFilterChange('startDate', e.target.value)}
                          max={transactionFilters.endDate || undefined}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={transactionFilters.endDate}
                          onChange={(e) => handleTransactionFilterChange('endDate', e.target.value)}
                          min={transactionFilters.startDate || undefined}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div className="overflow-x-auto">
                    {transactions.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Vehicle
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transactions.map((transaction) => (
                            <tr key={transaction._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {transaction.customer?.name || transaction.customerDetails?.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {transaction.customer?.email || transaction.customerDetails?.email}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {transaction.vehicle?.make} {transaction.vehicle?.model}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {transaction.vehicle?.licensePlate}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-gray-900">
                                  ${transaction.totalAmount?.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {transaction.totalDays} days
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  transaction.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  transaction.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {transaction.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  transaction.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                  transaction.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  transaction.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                                  transaction.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {transaction.paymentStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        No transactions found.
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {transactionPagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-700">
                          Showing {((transactionPagination.currentPage - 1) * transactionPagination.itemsPerPage) + 1} to{' '}
                          {Math.min(transactionPagination.currentPage * transactionPagination.itemsPerPage, transactionPagination.totalItems)} of{' '}
                          {transactionPagination.totalItems} results
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => fetchTransactions(transactionPagination.currentPage - 1, debouncedSearch)}
                            disabled={transactionPagination.currentPage <= 1}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="px-3 py-2 text-sm text-gray-700">
                            Page {transactionPagination.currentPage} of {transactionPagination.totalPages}
                          </span>
                          <button
                            onClick={() => fetchTransactions(transactionPagination.currentPage + 1, debouncedSearch)}
                            disabled={transactionPagination.currentPage >= transactionPagination.totalPages}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
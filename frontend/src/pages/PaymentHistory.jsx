import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { 
  CreditCardIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { AiOutlineCar } from 'react-icons/ai';
import Spinner from '../components/Spinner';
import PaymentDetailsModal from '../components/PaymentDetailsModal';
import { generatePaymentPDF } from '../utils/paymentPdfGenerator';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PaymentHistory = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    failedAmount: 0
  });
  const [chartData, setChartData] = useState({
    monthlyData: [],
    statusDistribution: [],
    amountTrend: []
  });
  const [showCharts, setShowCharts] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  useEffect(() => {
    fetchPaymentHistory();
  }, [filters]);

  const fetchPaymentHistory = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const response = await axios.get(`http://localhost:5556/payments/history?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const paymentData = response.data.paymentHistory || [];
      setPaymentHistory(paymentData);
      setStats(response.data.stats || stats);
      setPagination(response.data.pagination || pagination);
      
      // Process chart data
      processChartData(paymentData);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      enqueueSnackbar('Failed to load payment history', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    // Validate date ranges
    if (key === 'startDate' && value && filters.endDate && value > filters.endDate) {
      // If start date is after end date, clear the end date
      setFilters(prev => ({ ...prev, [key]: value, endDate: '' }));
    } else if (key === 'endDate' && value && filters.startDate && value < filters.startDate) {
      // If end date is before start date, clear the start date
      setFilters(prev => ({ ...prev, [key]: value, startDate: '' }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const clearFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '', search: '', cardType: '' });
  };

  const handlePageChange = (newPage) => {
    fetchPaymentHistory(newPage);
  };

  const handleViewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleDownloadPDF = async (payment) => {
    setDownloadingPdf(payment._id);
    await generatePaymentPDF(payment, enqueueSnackbar, () => setDownloadingPdf(null));
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
  };

  // Process data for charts
  const processChartData = (payments) => {
    // Monthly spending data
    const monthlyData = {};
    const statusCounts = { paid: 0, pending: 0, failed: 0, refunded: 0 };
    const amountTrend = [];

    payments.forEach(payment => {
      // Monthly data
      const month = new Date(payment.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month] += payment.totalAmount;

      // Status distribution
      statusCounts[payment.paymentStatus] = (statusCounts[payment.paymentStatus] || 0) + 1;

      // Amount trend (last 12 payments)
      amountTrend.push({
        date: new Date(payment.createdAt).toLocaleDateString(),
        amount: payment.totalAmount
      });
    });

    // Sort monthly data by date
    const sortedMonthlyData = Object.entries(monthlyData)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-6); // Last 6 months

    // Sort amount trend by date
    const sortedAmountTrend = amountTrend
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-12); // Last 12 payments

    setChartData({
      monthlyData: sortedMonthlyData,
      statusDistribution: Object.entries(statusCounts),
      amountTrend: sortedAmountTrend
    });
  };

  // Enhanced Chart configurations
  const monthlyChartConfig = {
    type: 'bar',
    data: {
      labels: chartData.monthlyData.map(item => item[0]),
      datasets: [{
        label: 'Amount Spent ($)',
        data: chartData.monthlyData.map(item => item[1]),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              return `Amount: $${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: 'rgba(107, 114, 128, 0.8)',
            font: {
              size: 12,
              weight: '500'
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(107, 114, 128, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(107, 114, 128, 0.8)',
            font: {
              size: 12,
              weight: '500'
            },
            callback: function(value) {
              if (value >= 1000) {
                return '$' + (value / 1000).toFixed(1) + 'k';
              }
              return '$' + value.toFixed(0);
            }
          }
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeInOutQuart'
      }
    }
  };

  const statusChartConfig = {
    type: 'doughnut',
    data: {
      labels: chartData.statusDistribution.map(item => item[0].toUpperCase()),
      datasets: [{
        data: chartData.statusDistribution.map(item => item[1]),
        backgroundColor: [
          'rgba(34, 197, 94, 0.9)', // Green for paid
          'rgba(251, 191, 36, 0.9)', // Yellow for pending
          'rgba(239, 68, 68, 0.9)',  // Red for failed
          'rgba(168, 85, 247, 0.9)'  // Purple for refunded
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(168, 85, 247, 1)'
        ],
        borderWidth: 3,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.parsed} payments (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeInOutQuart'
      }
    }
  };


  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'refunded':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCardBrandColor = (brand) => {
    const colors = {
      visa: 'from-blue-500 to-blue-700',
      mastercard: 'from-red-400 to-yellow-400',
      amex: 'from-blue-400 to-green-400',
      discover: 'from-orange-400 to-red-400',
      default: 'from-gray-500 to-gray-700'
    };
    return colors[brand?.toLowerCase()] || colors.default;
  };

  const formatCardNumber = (last4) => {
    return `•••• •••• •••• ${last4}`;
  };

  if (loading && paymentHistory.length === 0) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-2xl">
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
              <p className="text-gray-600">View all your payment transactions and receipts</p>
            </div>
          </div>
          
          {/* Filter Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
            </button>
            {Object.values(filters).some(f => f) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Payments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search payments..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  max={filters.endDate || undefined}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  min={filters.startDate || undefined}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Type</label>
                <select
                  value={filters.cardType}
                  onChange={(e) => handleFilterChange('cardType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Card Types</option>
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">American Express</option>
                  <option value="discover">Discover</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Statistics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Payments */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Payments</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalPayments}</p>
                  <p className="text-xs text-blue-600 mt-1">All transactions</p>
                </div>
                <div className="p-3 rounded-full bg-blue-200">
                  <CreditCardIcon className="h-8 w-8 text-blue-700" />
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Amount</p>
                  <p className="text-3xl font-bold text-green-900">${stats.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-green-600 mt-1">Lifetime spending</p>
                </div>
                <div className="p-3 rounded-full bg-green-200">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-700" />
                </div>
              </div>
            </div>

            {/* Success Rate */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl shadow-lg border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Success Rate</p>
                  <p className="text-3xl font-bold text-emerald-900">
                    {stats.totalPayments > 0 ? ((stats.paidAmount / stats.totalAmount) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">Payment success</p>
                </div>
                <div className="p-3 rounded-full bg-emerald-200">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-700" />
                </div>
              </div>
            </div>

            {/* Average Payment */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Average Payment</p>
                  <p className="text-3xl font-bold text-purple-900">
                    ${stats.totalPayments > 0 ? (stats.totalAmount / stats.totalPayments).toFixed(2) : 0}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Per transaction</p>
                </div>
                <div className="p-3 rounded-full bg-purple-200">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-purple-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                  <p className="text-2xl font-bold text-green-600">${stats.paidAmount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Successfully processed</p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-yellow-600">${stats.pendingAmount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
                </div>
                <ClockIcon className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed Amount</p>
                  <p className="text-2xl font-bold text-red-600">${stats.failedAmount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Failed transactions</p>
                </div>
                <XCircleIcon className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {showCharts && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Payment Analytics</h2>
              </div>
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Monthly Spending Chart */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl shadow-xl border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Monthly Spending</h3>
                    <p className="text-sm text-gray-600">Track your spending patterns over time</p>
                  </div>
                  <div className="p-2 bg-blue-200 rounded-full">
                    <ChartBarIcon className="h-6 w-6 text-blue-700" />
                  </div>
                </div>
                <div className="h-64">
                  <Bar data={monthlyChartConfig.data} options={monthlyChartConfig.options} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/50 p-2 rounded-lg">
                    <p className="text-xs text-gray-600">Highest Month</p>
                    <p className="text-sm font-bold text-blue-700">
                      ${chartData.monthlyData.length > 0 ? Math.max(...chartData.monthlyData.map(item => item[1])).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div className="bg-white/50 p-2 rounded-lg">
                    <p className="text-xs text-gray-600">Average</p>
                    <p className="text-sm font-bold text-blue-700">
                      ${chartData.monthlyData.length > 0 ? (chartData.monthlyData.reduce((sum, item) => sum + item[1], 0) / chartData.monthlyData.length).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div className="bg-white/50 p-2 rounded-lg">
                    <p className="text-xs text-gray-600">Total Period</p>
                    <p className="text-sm font-bold text-blue-700">
                      ${chartData.monthlyData.reduce((sum, item) => sum + item[1], 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Payment Status Distribution */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl shadow-xl border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Payment Status</h3>
                    <p className="text-sm text-gray-600">Distribution of payment outcomes</p>
                  </div>
                  <div className="p-2 bg-green-200 rounded-full">
                    <CheckCircleIcon className="h-6 w-6 text-green-700" />
                  </div>
                </div>
                <div className="h-64">
                  <Doughnut data={statusChartConfig.data} options={statusChartConfig.options} />
                </div>
                <div className="mt-3 space-y-1">
                  {chartData.statusDistribution.map(([status, count], index) => {
                    const colors = ['text-green-600', 'text-yellow-600', 'text-red-600', 'text-purple-600'];
                    const bgColors = ['bg-green-100', 'bg-yellow-100', 'bg-red-100', 'bg-purple-100'];
                    const total = chartData.statusDistribution.reduce((sum, item) => sum + item[1], 0);
                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={status} className="flex items-center justify-between bg-white/50 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${bgColors[index]}`}></div>
                          <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">{count}</span>
                          <span className={`ml-1 text-xs ${colors[index]}`}>({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Toggle Button (when hidden) */}
        {!showCharts && (
          <div className="mb-8">
            <button
              onClick={() => setShowCharts(true)}
              className="w-full bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow flex items-center justify-center gap-3 text-gray-600 hover:text-gray-900"
            >
              <ChartBarIcon className="h-6 w-6" />
              <span className="text-lg font-medium">Show Payment Analytics</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Payment History Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Payment Transactions</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : paymentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {payment.vehicle?.images && payment.vehicle.images.length > 0 ? (
                            <img
                              src={payment.vehicle.images[0]}
                              alt={`${payment.vehicle?.make} ${payment.vehicle?.model}`}
                              className="h-12 w-12 rounded object-cover mr-3"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center mr-3">
                              <AiOutlineCar className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.vehicle?.year} {payment.vehicle?.make} {payment.vehicle?.model}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.vehicle?.licensePlate}
                            </div>
                            <div className="text-xs text-gray-400">
                              {payment.totalDays} days • ${payment.pricePerDay}/day
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.paymentMethod ? (
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getCardBrandColor(payment.paymentMethod.brand)} flex items-center justify-center mr-3`}>
                              <CreditCardIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {payment.paymentMethod.brand.toUpperCase()}
                              </div>
                              <div className="text-sm text-gray-500 font-mono">
                                {formatCardNumber(payment.paymentMethod.last4)}
                              </div>
                              <div className="text-xs text-gray-400">
                                Exp: {String(payment.paymentMethod.expMonth).padStart(2, '0')}/{payment.paymentMethod.expYear}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No payment method info</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${payment.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(payment.startDate).toLocaleDateString()} - {new Date(payment.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPaymentStatusIcon(payment.paymentStatus)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(payment.paymentStatus)}`}>
                            {payment.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewPaymentDetails(payment)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded text-xs flex items-center gap-1"
                          >
                            <EyeIcon className="h-3 w-3" />
                            View Details
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(payment)}
                            disabled={downloadingPdf === payment._id}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloadingPdf === payment._id ? (
                              <>
                                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                              </>
                            ) : (
                              <>
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7h-4V3" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6" />
                                </svg>
                                PDF
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history found</h3>
              <p className="text-gray-600">You haven't made any payments yet.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.totalItems}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Details Modal */}
        <PaymentDetailsModal
          isOpen={showPaymentModal}
          onClose={handleClosePaymentModal}
          payment={selectedPayment}
        />
      </div>
    </div>
  );
};

export default PaymentHistory;

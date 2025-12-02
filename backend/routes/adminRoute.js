import express from 'express';
import { User } from '../models/userModel.js';
import { Vehicle } from '../models/vehicleModel.js';
import { Booking } from '../models/bookingModel.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics (admin/branch-manager)
router.get('/dashboard', auth, authorize('admin', 'branch-manager'), async (request, response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalVehicles = await Vehicle.countDocuments();
    const availableVehicles = await Vehicle.countDocuments({ isAvailable: true });
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const activeBookings = await Booking.countDocuments({ status: 'active' });

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('customer', 'name email')
      .populate('vehicle', 'make model licensePlate')
      .sort({ createdAt: -1 })
      .limit(5);

    // Monthly revenue calculation - last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: {
            $gte: thirtyDaysAgo
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    response.json({
      statistics: {
        totalUsers,
        totalCustomers,
        totalSellers,
        totalVehicles,
        availableVehicles,
        totalBookings,
        pendingBookings,
        activeBookings,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      },
      recentBookings
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Get all users (admin only) with filtering and sorting
router.get('/users', auth, authorize('admin'), async (request, response) => {
  try {
    const { 
      role, 
      isActive, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1, 
      limit = 10 
    } = request.query;
    
    const filter = {};
    
    // Role filter
    if (role) filter.role = role;
    
    // Status filter
    if (isActive !== undefined && isActive !== '') {
      filter.isActive = isActive === 'true';
    }
    
    // Search filter (name or email)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip(skip)
      .sort(sort);

    const total = await User.countDocuments(filter);

    response.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Update user status (admin only)
router.put('/users/:id/status', auth, authorize('admin'), async (request, response) => {
  try {
    const { id } = request.params;
    const { isActive } = request.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    response.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', auth, authorize('admin'), async (request, response) => {
  try {
    const { id } = request.params;
    const { role } = request.body;

    const validRoles = ['customer', 'seller', 'branch-manager', 'admin'];
    if (!validRoles.includes(role)) {
      return response.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    response.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', auth, authorize('admin'), async (request, response) => {
  try {
    const { id } = request.params;

    // Check if user has active bookings
    const activeBookings = await Booking.countDocuments({
      customer: id,
      status: { $in: ['confirmed', 'active'] }
    });

    if (activeBookings > 0) {
      return response.status(400).json({ 
        message: 'Cannot delete user with active bookings' 
      });
    }

    await User.findByIdAndDelete(id);
    response.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Get comprehensive financial data (admin only)
router.get('/finance/overview', auth, authorize('admin'), async (request, response) => {
  try {
    const { period = 'month', startDate, endDate } = request.query;
    
    let dateFilter = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      // Default period filtering
      switch (period) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = { createdAt: { $gte: weekAgo } };
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = { createdAt: { $gte: monthAgo } };
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          dateFilter = { createdAt: { $gte: quarterAgo } };
          break;
        case 'year':
          const yearAgo = new Date(now.getFullYear(), 0, 1);
          dateFilter = { createdAt: { $gte: yearAgo } };
          break;
        default:
          dateFilter = {};
      }
    }

    // Revenue analytics - include all bookings for now to test
    const revenueStats = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          averageTransactionValue: { $avg: '$totalAmount' },
          maxTransactionValue: { $max: '$totalAmount' },
          minTransactionValue: { $min: '$totalAmount' }
        }
      }
    ]);

    // Payment status breakdown
    const paymentStatusBreakdown = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Booking status breakdown
    const bookingStatusBreakdown = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Monthly revenue trend (last 12 months)
    const monthlyTrend = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: {
            $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top performing vehicles
    const topVehicles = await Booking.aggregate([
      { $match: { ...dateFilter, paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$vehicle',
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicleInfo'
        }
      },
      { $unwind: '$vehicleInfo' }
    ]);

    // Recent transactions
    const recentTransactions = await Booking.find(dateFilter)
      .populate('customer', 'name email')
      .populate('vehicle', 'make model licensePlate')
      .sort({ createdAt: -1 })
      .limit(20);

    response.json({
      revenueStats: revenueStats[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        maxTransactionValue: 0,
        minTransactionValue: 0
      },
      paymentStatusBreakdown,
      bookingStatusBreakdown,
      monthlyTrend,
      topVehicles,
      recentTransactions
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Get detailed transactions with filtering (admin only)
router.get('/finance/transactions', auth, authorize('admin'), async (request, response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      paymentStatus, 
      startDate, 
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = request.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Booking.find(filter)
      .populate('customer', 'name email')
      .populate('vehicle', 'make model licensePlate year')
      .sort(sort)
      .limit(limit * 1)
      .skip(skip);

    const total = await Booking.countDocuments(filter);

    response.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Get financial reports (admin only)
router.get('/finance/reports', auth, authorize('admin'), async (request, response) => {
  try {
    const { reportType = 'summary', startDate, endDate } = request.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let report = {};

    switch (reportType) {
      case 'summary':
        report = await generateSummaryReport(dateFilter);
        break;
      case 'revenue':
        report = await generateRevenueReport(dateFilter);
        break;
      case 'transactions':
        report = await generateTransactionReport(dateFilter);
        break;
      default:
        report = await generateSummaryReport(dateFilter);
    }

    response.json(report);
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Helper functions for reports
async function generateSummaryReport(dateFilter) {
  const totalRevenue = await Booking.aggregate([
    { $match: { ...dateFilter, paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  const totalBookings = await Booking.countDocuments(dateFilter);
  const completedBookings = await Booking.countDocuments({ ...dateFilter, status: 'completed' });
  const cancelledBookings = await Booking.countDocuments({ ...dateFilter, status: 'cancelled' });

  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    totalBookings,
    completedBookings,
    cancelledBookings,
    completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0
  };
}

async function generateRevenueReport(dateFilter) {
  const dailyRevenue = await Booking.aggregate([
    { $match: { ...dateFilter, paymentStatus: 'paid' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        transactions: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return { dailyRevenue };
}

async function generateTransactionReport(dateFilter) {
  const transactions = await Booking.find({ ...dateFilter, paymentStatus: 'paid' })
    .populate('customer', 'name email')
    .populate('vehicle', 'make model licensePlate')
    .sort({ createdAt: -1 });

  return { transactions };
}

export default router;
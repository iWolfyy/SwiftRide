import express from 'express';
import { Vehicle } from '../models/vehicleModel.js';
import { auth, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Get featured vehicles (public) - latest available vehicles with images
router.get('/featured', async (request, response) => {
  try {
    const limit = parseInt(request.query.limit) || 6;
    
    const vehicles = await Vehicle.find({ 
      isAvailable: true,
      images: { $exists: true, $ne: [] } // Only vehicles with images
    })
      .populate('seller', 'name email phone')
      .limit(limit)
      .sort({ createdAt: -1 });

    response.json({
      vehicles,
      message: 'Featured vehicles retrieved successfully'
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Get vehicle statistics (public)
router.get('/stats', async (request, response) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const availableVehicles = await Vehicle.countDocuments({ isAvailable: true });
    const unavailableVehicles = await Vehicle.countDocuments({ isAvailable: false });
    
    // Get vehicle counts by type
    const vehiclesByType = await Vehicle.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get vehicle counts by fuel type
    const vehiclesByFuel = await Vehicle.aggregate([
      { $group: { _id: '$fuelType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get average price
    const priceStats = await Vehicle.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$pricePerDay' },
          minPrice: { $min: '$pricePerDay' },
          maxPrice: { $max: '$pricePerDay' }
        }
      }
    ]);

    response.json({
      totalVehicles,
      availableVehicles,
      unavailableVehicles,
      vehiclesByType,
      vehiclesByFuel,
      priceStats: priceStats[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0 }
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Get all vehicles (public) with enhanced filtering
router.get('/', async (request, response) => {
  try {
    const { 
      type, 
      location, 
      minPrice, 
      maxPrice,
      fuelType,
      transmission,
      seats,
      available,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = request.query;

    const filter = {};
    
    // Filter by availability (default to available only)
    if (available === undefined || available === 'true') {
      filter.isAvailable = true;
    } else if (available === 'false') {
      filter.isAvailable = false;
    }
    // If available === 'all', don't add availability filter
    
    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;
    if (seats) {
      if (seats === '8') {
        filter.seats = { $gte: 8 };
      } else {
        filter.seats = parseInt(seats);
      }
    }
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
    }

    // Sorting options
    const sortOptions = {};
    if (sortBy === 'price') {
      sortOptions.pricePerDay = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'year') {
      sortOptions.year = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    const skip = (page - 1) * limit;
    const vehicles = await Vehicle.find(filter)
      .populate('seller', 'name email phone')
      .limit(limit * 1)
      .skip(skip)
      .sort(sortOptions);

    const total = await Vehicle.countDocuments(filter);
    const availableCount = await Vehicle.countDocuments({ ...filter, isAvailable: true });

    response.json({
      vehicles,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      availableCount,
      showing: vehicles.length,
      filters: {
        type,
        location,
        minPrice,
        maxPrice,
        fuelType,
        transmission,
        seats,
        available,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Get single vehicle
router.get('/:id', async (request, response) => {
  try {
    const { id } = request.params;
    const vehicle = await Vehicle.findById(id).populate('seller', 'name email phone');

    if (!vehicle) {
      return response.status(404).json({ message: 'Vehicle not found' });
    }

    response.json(vehicle);
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Add new vehicle (seller only) with image upload
router.post('/', auth, authorize('seller', 'admin'), upload.array('images', 5), async (request, response) => {
  try {
    const vehicleData = {
      ...request.body,
      seller: request.user._id,
    };

    // Process uploaded images
    if (request.files && request.files.length > 0) {
      const imageUrls = request.files.map(file => `http://localhost:5556/uploads/vehicles/${file.filename}`);
      vehicleData.images = imageUrls;
    }

    // Process features from comma-separated string to array
    if (request.body.features && typeof request.body.features === 'string') {
      vehicleData.features = request.body.features.split(',').map(f => f.trim()).filter(f => f);
    }

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    response.status(201).json({
      message: 'Vehicle added successfully',
      vehicle
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Update vehicle (seller/admin only) with image upload
router.put('/:id', auth, authorize('seller', 'admin'), upload.array('images', 5), async (request, response) => {
  try {
    console.log('=== VEHICLE UPDATE REQUEST RECEIVED ===');
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    console.log('Request params:', request.params);
    
    const { id } = request.params;
    console.log('Vehicle ID:', id);
    
    // Check if vehicle exists and user owns it (unless admin)
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      console.log('Vehicle not found');
      return response.status(404).json({ message: 'Vehicle not found' });
    }

    console.log('Vehicle found:', vehicle._id);
    console.log('Vehicle seller:', vehicle.seller);
    console.log('Request user:', request.user._id);
    console.log('User role:', request.user.role);

    if (request.user.role !== 'admin' && vehicle.seller.toString() !== request.user._id.toString()) {
      console.log('Not authorized to update this vehicle');
      return response.status(403).json({ message: 'Not authorized to update this vehicle' });
    }

    const updateData = { ...request.body };
    console.log('Update data received:', updateData);
    console.log('Files received:', request.files);

    // Process uploaded images
    if (request.files && request.files.length > 0) {
      const newImageUrls = request.files.map(file => `http://localhost:5556/uploads/vehicles/${file.filename}`);
      
      // Get existing images from request body (parse JSON string)
      let existingImages = [];
      if (request.body.existingImages) {
        try {
          existingImages = JSON.parse(request.body.existingImages);
        } catch (e) {
          // If not JSON, treat as single string
          existingImages = [request.body.existingImages];
        }
      }
      
      // Combine existing and new images
      updateData.images = [...existingImages, ...newImageUrls];
    } else if (request.body.existingImages) {
      // Only existing images, no new uploads
      try {
        updateData.images = JSON.parse(request.body.existingImages);
      } catch (e) {
        // If not JSON, treat as single string
        updateData.images = [request.body.existingImages];
      }
    }

    // Process features from JSON string to array
    if (updateData.features) {
      if (typeof updateData.features === 'string') {
        try {
          updateData.features = JSON.parse(updateData.features);
        } catch (e) {
          // If not JSON, treat as comma-separated string
          updateData.features = updateData.features.split(',').map(f => f.trim()).filter(f => f);
        }
      }
    }

    // Remove existingImages from updateData as it's not a field in the schema
    delete updateData.existingImages;

    console.log('Final update data:', updateData);

    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, updateData, { new: true });
    console.log('Updated vehicle:', updatedVehicle);
    
    response.json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Delete vehicle (seller/admin only)
router.delete('/:id', auth, authorize('seller', 'admin'), async (request, response) => {
  try {
    const { id } = request.params;
    
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return response.status(404).json({ message: 'Vehicle not found' });
    }

    if (request.user.role !== 'admin' && vehicle.seller.toString() !== request.user._id.toString()) {
      return response.status(403).json({ message: 'Not authorized to delete this vehicle' });
    }

    await Vehicle.findByIdAndDelete(id);
    response.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Get vehicles by seller
router.get('/seller/my-vehicles', auth, authorize('seller', 'admin'), async (request, response) => {
  try {
    const sellerId = request.user.role === 'admin' ? request.query.sellerId : request.user._id;
    const vehicles = await Vehicle.find({ seller: sellerId }).sort({ createdAt: -1 });
    
    response.json(vehicles);
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Upload images endpoint
router.post('/upload-images', upload.array('images', 5), async (request, response) => {
  try {
    if (!request.files || request.files.length === 0) {
      return response.status(400).json({ message: 'No files uploaded' });
    }

    const imageUrls = request.files.map(file => `http://localhost:5556/uploads/vehicles/${file.filename}`);
    
    response.json({
      message: 'Images uploaded successfully',
      images: imageUrls
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

export default router;
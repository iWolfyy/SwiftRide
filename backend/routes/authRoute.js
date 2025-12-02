import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { JWT_SECRET } from '../config.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Register User
router.post('/register', async (request, response) => {
  try {
    const { name, email, password, role, phone, address, licenseNumber, branchLocation } = request.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'customer',
      phone,
      address,
    };

    // Add role-specific fields
    if (role === 'customer' && licenseNumber) {
      userData.licenseNumber = licenseNumber;
    }
    if (role === 'branch-manager' && branchLocation) {
      userData.branchLocation = branchLocation;
    }

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    response.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Login User
router.post('/login', async (request, response) => {
  try {
    const { email, password } = request.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return response.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return response.status(400).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return response.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    response.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Get Current User
router.get('/me', auth, async (request, response) => {
  try {
    const user = await User.findById(request.user._id).select('-password');
    response.json(user);
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

// Update Profile
router.put('/profile', auth, async (request, response) => {
  try {
    const { name, phone, address, licenseNumber, branchLocation } = request.body;
    
    const updateData = { name, phone, address };
    
    if (request.user.role === 'customer' && licenseNumber) {
      updateData.licenseNumber = licenseNumber;
    }
    if (request.user.role === 'branch-manager' && branchLocation) {
      updateData.branchLocation = branchLocation;
    }

    const user = await User.findByIdAndUpdate(
      request.user._id,
      updateData,
      { new: true }
    ).select('-password');

    response.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
});

export default router;
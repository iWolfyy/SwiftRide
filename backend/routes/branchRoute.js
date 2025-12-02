import express from 'express';
import { auth, authorize } from '../middleware/auth.js';
import { Branch } from '../models/branchModel.js';
import { User } from '../models/userModel.js';

const router = express.Router();

// Create branch (admin or branch-manager)
router.post('/', auth, authorize('admin', 'branch-manager'), async (req, res) => {
  try {
    const { 
      name, 
      location, 
      address, 
      phone, 
      email, 
      description,
      openingHours,
      services,
      capacity,
      establishedDate,
      manager 
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    if (manager) {
      const mgr = await User.findById(manager);
      if (!mgr) return res.status(404).json({ message: 'Manager not found' });
      if (!['branch-manager', 'admin'].includes(mgr.role)) {
        return res.status(400).json({ message: 'Manager must be a branch-manager or admin' });
      }
    }

    const branch = await Branch.create({
      name,
      location,
      address,
      phone,
      email,
      description,
      openingHours,
      services,
      capacity,
      establishedDate,
      manager: manager || undefined,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: 'Branch created successfully', branch });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create branch' });
  }
});

// Get branches (public access - no authentication required)
router.get('/', async (req, res) => {
  try {
    const branches = await Branch.find().populate('manager', 'name email role').sort({ createdAt: -1 });
    res.json(branches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch branches' });
  }
});

// Get single branch (public access - no authentication required)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findById(id).populate('manager', 'name email role');
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json(branch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch branch' });
  }
});

// Update branch (admin or branch-manager)
router.put('/:id', auth, authorize('admin', 'branch-manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      location, 
      address, 
      phone, 
      email, 
      description,
      openingHours,
      services,
      capacity,
      establishedDate,
      manager, 
      isActive 
    } = req.body;

    if (manager) {
      const mgr = await User.findById(manager);
      if (!mgr) return res.status(404).json({ message: 'Manager not found' });
      if (!['branch-manager', 'admin'].includes(mgr.role)) {
        return res.status(400).json({ message: 'Manager must be a branch-manager or admin' });
      }
    }

    const branch = await Branch.findByIdAndUpdate(
      id,
      { 
        name, 
        location, 
        address, 
        phone, 
        email, 
        description,
        openingHours,
        services,
        capacity,
        establishedDate,
        manager, 
        isActive 
      },
      { new: true, runValidators: true }
    ).populate('manager', 'name email role');

    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json({ message: 'Branch updated successfully', branch });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update branch' });
  }
});

// Update branch status (admin or branch-manager)
router.put('/:id/status', auth, authorize('admin', 'branch-manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const branch = await Branch.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).populate('manager', 'name email role');

    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json({ message: 'Branch status updated successfully', branch });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update branch status' });
  }
});

// Delete branch (admin or branch-manager)
router.delete('/:id', auth, authorize('admin', 'branch-manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    await Branch.findByIdAndDelete(id);
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete branch' });
  }
});

export default router;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { AiOutlinePlus, AiOutlineEdit, AiOutlineDelete, AiOutlineEnvironment, AiOutlinePhone, AiOutlineMail, AiOutlineUser } from 'react-icons/ai';
import Spinner from '../components/Spinner';
import { useSnackbar } from 'notistack';

const Branches = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({ 
    name: '', 
    location: '', 
    address: '', 
    phone: '', 
    email: '',
    description: '',
    openingTime: '',
    closingTime: '',
    services: '',
    capacity: '',
    establishedDate: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchBranches();
  }, []);

  // Real-time validation function
  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };
    
    switch (fieldName) {
      case 'name':
        if (!value?.trim()) {
          errors.name = 'Branch name is required';
        } else if (!/^[A-Za-z0-9\s\-.,/]+$/.test(value.trim())) {
          errors.name = 'Only letters, numbers, spaces, hyphens, periods, commas, and / allowed';
        } else if (value.trim().length < 4) {
          errors.name = 'Must be at least 4 characters';
        } else if (value.trim().length > 100) {
          errors.name = 'Must be less than 100 characters';
        } else {
          delete errors.name;
        }
        break;
        
      case 'location':
        if (!value?.trim()) {
          errors.location = 'Location is required';
        } else if (!/^[A-Za-z0-9\s\-.,/]+$/.test(value.trim())) {
          errors.location = 'Only letters, numbers, spaces, hyphens, periods, commas, and / allowed';
        } else if (value.trim().length < 2) {
          errors.location = 'Must be at least 2 characters';
        } else if (value.trim().length > 100) {
          errors.location = 'Must be less than 100 characters';
        } else {
          delete errors.location;
        }
        break;
        
      case 'address':
        if (value?.trim()) {
          if (!/^[A-Za-z0-9\s\-.,#/]+$/.test(value.trim())) {
            errors.address = 'Address can only contain letters, numbers, spaces, hyphens, periods, commas, #, and /';
          } else if (value.trim().length > 200) {
            errors.address = 'Address must be less than 200 characters';
          } else {
            delete errors.address;
          }
        } else {
          delete errors.address;
        }
        break;
        
      case 'phone':
        if (!value?.trim()) {
          errors.phone = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(value.trim())) {
          errors.phone = 'Must be exactly 10 digits';
        } else {
          delete errors.phone;
        }
        break;
        
      case 'email':
        if (!value?.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;
        
      case 'description':
        if (!value?.trim()) {
          errors.description = 'Description is required';
        } else if (!/^[A-Za-z0-9\s\-.,/]+$/.test(value.trim())) {
          errors.description = 'Only letters, numbers, spaces, hyphens, periods, commas, and / allowed';
        } else if (value.trim().length < 10) {
          errors.description = 'Must be at least 10 characters';
        } else if (value.trim().length > 500) {
          errors.description = 'Must be less than 500 characters';
        } else {
          delete errors.description;
        }
        break;
        
      case 'openingTime':
        if (value && branchForm.closingTime) {
          if (value >= branchForm.closingTime) {
            errors.openingTime = 'Opening time must be before closing time';
          } else {
            delete errors.openingTime;
            // Clear closing time error if it was caused by this opening time
            if (errors.closingTime === 'Closing time must be after opening time') {
              delete errors.closingTime;
            }
          }
        } else {
          delete errors.openingTime;
        }
        break;
        
      case 'closingTime':
        if (value && branchForm.openingTime) {
          if (value <= branchForm.openingTime) {
            errors.closingTime = 'Closing time must be after opening time';
          } else {
            delete errors.closingTime;
            // Clear opening time error if it was caused by this closing time
            if (errors.openingTime === 'Opening time must be before closing time') {
              delete errors.openingTime;
            }
          }
        } else {
          delete errors.closingTime;
        }
        break;
        
      case 'capacity':
        if (value && (isNaN(parseInt(value)) || parseInt(value) < 1)) {
          errors.capacity = 'Capacity must be at least 1';
        } else {
          delete errors.capacity;
        }
        break;
        
      case 'establishedDate':
        if (value && new Date(value) > new Date()) {
          errors.establishedDate = 'Established date cannot be in the future';
        } else {
          delete errors.establishedDate;
        }
        break;
        
      case 'services':
        if (value?.trim()) {
          if (!/^[A-Za-z0-9\s\-.,/]+$/.test(value.trim())) {
            errors.services = 'Only letters, numbers, spaces, hyphens, periods, commas, and / allowed';
          } else if (value.trim().length > 300) {
            errors.services = 'Services must be less than 300 characters';
          } else {
            delete errors.services;
          }
        } else {
          delete errors.services;
        }
        break;
        
      default:
        break;
    }
    
    setFieldErrors(errors);
  };

  // Key press handler to prevent invalid characters
  const handleKeyPress = (e) => {
    const { name } = e.target;
    
    if (name === 'name' || name === 'location' || name === 'address' || name === 'description' || name === 'services') {
      // Allow letters, numbers, spaces, and basic characters
      if (!/[A-Za-z0-9\s\-.,#/]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    }
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5556/branches');
      setBranches(response.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      // Remove authentication error handling since branches are now public
      enqueueSnackbar('Error fetching branches', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateBranch = () => {
    setEditingBranch(null);
    setBranchForm({ 
      name: '', 
      location: '', 
      address: '', 
      phone: '', 
      email: '',
      description: '',
      openingTime: '',
      closingTime: '',
      services: '',
      capacity: '',
      establishedDate: ''
    });
    setFieldErrors({});
    setBranchModalOpen(true);
  };

  const openEditBranch = (branch) => {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name || '',
      location: branch.location || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      description: branch.description || '',
      openingTime: branch.openingTime || '',
      closingTime: branch.closingTime || '',
      services: branch.services || '',
      capacity: branch.capacity || '',
      establishedDate: branch.establishedDate || ''
    });
    setFieldErrors({});
    setBranchModalOpen(true);
  };

  const submitBranch = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (Object.keys(fieldErrors).length > 0) {
      enqueueSnackbar("Please fix all validation errors before submitting", { variant: "error" });
      setIsSubmitting(false);
      return;
    }

    const requiredFields = ['name', 'location', 'phone', 'email', 'description'];
    const missingFields = requiredFields.filter(field => !branchForm[field]?.trim());
    
    if (missingFields.length > 0) {
      enqueueSnackbar(`Please fill in all required fields: ${missingFields.join(', ')}`, { variant: "error" });
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingBranch) {
        await axios.put(`http://localhost:5556/branches/${editingBranch._id}`, branchForm);
        enqueueSnackbar('Branch updated successfully', { variant: 'success' });
      } else {
        await axios.post('http://localhost:5556/branches', branchForm);
        enqueueSnackbar('Branch created successfully', { variant: 'success' });
      }
      setBranchModalOpen(false);
      fetchBranches();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Error saving branch', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteBranch = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5556/branches/${id}`);
      enqueueSnackbar('Branch deleted successfully', { variant: 'success' });
      fetchBranches();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Error deleting branch', { variant: 'error' });
    }
  };

  const canManageBranches = user && ['admin', 'branch-manager'].includes(user.role);

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Branches</h1>
              <p className="text-gray-600 mt-2">
                {canManageBranches ? 'Manage and view all branches' : 'View all available branches'}
              </p>
            </div>
            {canManageBranches && (
              <button 
                onClick={openCreateBranch} 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <AiOutlinePlus className="mr-2" /> 
                Add Branch
              </button>
            )}
          </div>
        </div>

        {/* Branches Grid */}
        {branches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <div key={branch._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{branch.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      branch.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {branch.location && (
                      <div className="flex items-center text-gray-600">
                        <AiOutlineEnvironment className="mr-2 text-lg" />
                        <span className="text-sm">{branch.location}</span>
                      </div>
                    )}

                    {branch.address && (
                      <div className="flex items-start text-gray-600">
                        <AiOutlineEnvironment className="mr-2 text-lg mt-0.5" />
                        <span className="text-sm">{branch.address}</span>
                      </div>
                    )}

                    {branch.phone && (
                      <div className="flex items-center text-gray-600">
                        <AiOutlinePhone className="mr-2 text-lg" />
                        <span className="text-sm">{branch.phone}</span>
                      </div>
                    )}

                    {branch.email && (
                      <div className="flex items-center text-gray-600">
                        <AiOutlineMail className="mr-2 text-lg" />
                        <span className="text-sm">{branch.email}</span>
                      </div>
                    )}

                    {branch.manager && (
                      <div className="flex items-center text-gray-600">
                        <AiOutlineUser className="mr-2 text-lg" />
                        <div>
                          <span className="text-sm font-medium">{branch.manager.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({branch.manager.role})</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {canManageBranches && (
                    <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => openEditBranch(branch)}
                        className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                      >
                        <AiOutlineEdit className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteBranch(branch._id)}
                        className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                      >
                        <AiOutlineDelete className="mr-1" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AiOutlineEnvironment className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No branches found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {canManageBranches 
                ? 'Get started by creating a new branch.' 
                : 'No branches are currently available. Please check back later.'}
            </p>
            {canManageBranches && (
              <div className="mt-6">
                <button
                  onClick={openCreateBranch}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <AiOutlinePlus className="mr-2" />
                  Add Branch
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Branch Modal */}
      {branchModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                </h3>
                <button 
                  onClick={() => setBranchModalOpen(false)} 
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={submitBranch} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={branchForm.name}
                  onChange={(e) => {
                    setBranchForm({ ...branchForm, name: e.target.value });
                    validateField('name', e.target.value);
                  }}
                  onKeyPress={handleKeyPress}
                  onBlur={(e) => validateField('name', e.target.value)}
                  className={`mt-1 block w-full border rounded-md p-2 ${
                    fieldErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  required
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={branchForm.location}
                  onChange={(e) => {
                    setBranchForm({ ...branchForm, location: e.target.value });
                    validateField('location', e.target.value);
                  }}
                  onKeyPress={handleKeyPress}
                  onBlur={(e) => validateField('location', e.target.value)}
                  className={`mt-1 block w-full border rounded-md p-2 ${
                    fieldErrors.location ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  required
                />
                {fieldErrors.location && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.location}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={branchForm.address}
                  onChange={(e) => {
                    setBranchForm({ ...branchForm, address: e.target.value });
                    validateField('address', e.target.value);
                  }}
                  onKeyPress={handleKeyPress}
                  onBlur={(e) => validateField('address', e.target.value)}
                  className={`mt-1 block w-full border rounded-md p-2 ${
                    fieldErrors.address ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {fieldErrors.address && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={branchForm.description}
                  onChange={(e) => {
                    setBranchForm({ ...branchForm, description: e.target.value });
                    validateField('description', e.target.value);
                  }}
                  onKeyPress={handleKeyPress}
                  onBlur={(e) => validateField('description', e.target.value)}
                  className={`mt-1 block w-full border rounded-md p-2 ${
                    fieldErrors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  rows="3"
                  placeholder="Brief description of the branch..."
                  required
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={branchForm.phone}
                    onChange={(e) => {
                      setBranchForm({ ...branchForm, phone: e.target.value });
                      validateField('phone', e.target.value);
                    }}
                    onBlur={(e) => validateField('phone', e.target.value)}
                    className={`mt-1 block w-full border rounded-md p-2 ${
                      fieldErrors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="10-digit phone number"
                    required
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={branchForm.email}
                    onChange={(e) => {
                      setBranchForm({ ...branchForm, email: e.target.value });
                      validateField('email', e.target.value);
                    }}
                    onBlur={(e) => validateField('email', e.target.value)}
                    className={`mt-1 block w-full border rounded-md p-2 ${
                      fieldErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="branch@company.com"
                    required
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Opening Time</label>
                  <input
                    type="time"
                    value={branchForm.openingTime}
                    onChange={(e) => {
                      setBranchForm({ ...branchForm, openingTime: e.target.value });
                      validateField('openingTime', e.target.value);
                      // Re-validate closing time when opening time changes
                      if (branchForm.closingTime) {
                        validateField('closingTime', branchForm.closingTime);
                      }
                    }}
                    onBlur={(e) => validateField('openingTime', e.target.value)}
                    className={`mt-1 block w-full border rounded-md p-2 ${
                      fieldErrors.openingTime ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.openingTime && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.openingTime}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Closing Time</label>
                  <input
                    type="time"
                    value={branchForm.closingTime}
                    onChange={(e) => {
                      setBranchForm({ ...branchForm, closingTime: e.target.value });
                      validateField('closingTime', e.target.value);
                    }}
                    onBlur={(e) => validateField('closingTime', e.target.value)}
                    className={`mt-1 block w-full border rounded-md p-2 ${
                      fieldErrors.closingTime ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.closingTime && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.closingTime}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <input
                    type="number"
                    value={branchForm.capacity}
                    onChange={(e) => {
                      setBranchForm({ ...branchForm, capacity: e.target.value });
                      validateField('capacity', e.target.value);
                    }}
                    onBlur={(e) => validateField('capacity', e.target.value)}
                    className={`mt-1 block w-full border rounded-md p-2 ${
                      fieldErrors.capacity ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Number of vehicles"
                    min="1"
                  />
                  {fieldErrors.capacity && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.capacity}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Established Date</label>
                  <input
                    type="date"
                    value={branchForm.establishedDate}
                    onChange={(e) => {
                      setBranchForm({ ...branchForm, establishedDate: e.target.value });
                      validateField('establishedDate', e.target.value);
                    }}
                    onBlur={(e) => validateField('establishedDate', e.target.value)}
                    className={`mt-1 block w-full border rounded-md p-2 ${
                      fieldErrors.establishedDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.establishedDate && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.establishedDate}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Services Offered</label>
                <textarea
                  value={branchForm.services}
                  onChange={(e) => {
                    setBranchForm({ ...branchForm, services: e.target.value });
                    validateField('services', e.target.value);
                  }}
                  onKeyPress={handleKeyPress}
                  onBlur={(e) => validateField('services', e.target.value)}
                  className={`mt-1 block w-full border rounded-md p-2 ${
                    fieldErrors.services ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  rows="2"
                  placeholder="e.g., Car rental, Motorcycle rental, Maintenance, Insurance..."
                />
                {fieldErrors.services && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.services}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setBranchModalOpen(false)} 
                  className="px-4 py-2 rounded border hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`px-4 py-2 rounded text-white flex items-center ${
                    isSubmitting || Object.keys(fieldErrors).length > 0
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={isSubmitting || Object.keys(fieldErrors).length > 0}
                >
                  {isSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmitting ? 'Saving...' : (editingBranch ? 'Update Branch' : 'Create Branch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    phone: '',
    address: '',
    licenseNumber: '',
    branchLocation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Real-time validation function
  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };
    
    switch (fieldName) {
      case 'name':
        if (!value?.trim()) {
          errors.name = 'Full name is required';
        } else if (!/^[A-Za-z\s]+$/.test(value.trim())) {
          errors.name = 'Name can only contain letters and spaces';
        } else if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters';
        } else if (value.trim().length > 100) {
          errors.name = 'Name must be less than 100 characters';
        } else {
          delete errors.name;
        }
        break;
        
      case 'email':
        if (!value?.trim()) {
          errors.email = 'Email address is required';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim())) {
          errors.email = 'Please enter a valid email address (no special characters except . _ % + -)';
        } else if (value.trim().length > 100) {
          errors.email = 'Email address must be less than 100 characters';
        } else {
          delete errors.email;
        }
        break;
        
      case 'phone':
        if (!value?.trim()) {
          errors.phone = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(value.trim())) {
          errors.phone = 'Phone number must be exactly 10 digits';
        } else {
          delete errors.phone;
        }
        break;
        
      case 'password':
        if (!value?.trim()) {
          errors.password = 'Password is required';
        } else if (value.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        } else if (value.length > 128) {
          errors.password = 'Password must be less than 128 characters';
        } else if (!/^[a-zA-Z0-9@$!%*?&]+$/.test(value)) {
          errors.password = 'Password can only contain letters, numbers, and @ $ ! % * ? &';
        } else if (!/(?=.*[a-z])/.test(value)) {
          errors.password = 'Password must contain at least one lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(value)) {
          errors.password = 'Password must contain at least one uppercase letter';
        } else if (!/(?=.*\d)/.test(value)) {
          errors.password = 'Password must contain at least one number';
        } else if (!/(?=.*[@$!%*?&])/.test(value)) {
          errors.password = 'Password must contain at least one special character (@$!%*?&)';
        } else {
          delete errors.password;
          // Re-validate confirm password if it exists
          if (formData.confirmPassword) {
            validateField('confirmPassword', formData.confirmPassword);
          }
        }
        break;
        
      case 'confirmPassword':
        if (!value?.trim()) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
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
        
      case 'licenseNumber':
        if (formData.role === 'customer') {
          if (!value?.trim()) {
            errors.licenseNumber = 'Driver\'s license number is required for customers';
          } else if (!/^[0-9]+$/.test(value.trim())) {
            errors.licenseNumber = 'License number can only contain numbers';
          } else if (value.trim().length < 5) {
            errors.licenseNumber = 'License number must be at least 5 characters';
          } else if (value.trim().length > 20) {
            errors.licenseNumber = 'License number must be less than 20 characters';
          } else {
            delete errors.licenseNumber;
          }
        } else {
          delete errors.licenseNumber;
        }
        break;
        
      case 'branchLocation':
        if (formData.role === 'branch-manager') {
          if (!value?.trim()) {
            errors.branchLocation = 'Branch location is required for branch managers';
          } else if (!/^[A-Za-z\s]+$/.test(value.trim())) {
            errors.branchLocation = 'Location can only contain letters and spaces';
          } else if (value.trim().length < 2) {
            errors.branchLocation = 'Location must be at least 2 characters';
          } else if (value.trim().length > 100) {
            errors.branchLocation = 'Location must be less than 100 characters';
          } else {
            delete errors.branchLocation;
          }
        } else {
          delete errors.branchLocation;
        }
        break;
        
      default:
        break;
    }
    
    setFieldErrors(errors);
  };

  // Block special characters on input
  const handleKeyPress = (e) => {
    const { name } = e.target;
    
    if (name === 'name') {
      // Allow only letters and spaces
      if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    } else if (name === 'email') {
      // Allow only letters, numbers, and specific email characters
      if (!/[a-zA-Z0-9._%+-@]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    } else if (name === 'phone') {
      // Allow only numbers
      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    } else if (name === 'password' || name === 'confirmPassword') {
      // Allow only letters, numbers, and specific password characters
      if (!/[a-zA-Z0-9@$!%*?&]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    } else if (name === 'address') {
      // Allow letters, numbers, spaces, and basic address characters
      if (!/[a-zA-Z0-9\s\-.,#/]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    } else if (name === 'licenseNumber') {
      // Allow only numbers
      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    } else if (name === 'branchLocation') {
      // Allow only letters and spaces
      if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    // Check if there are any field errors
    if (Object.keys(fieldErrors).length > 0) {
      enqueueSnackbar("Please fix all validation errors before submitting", { variant: "error" });
      setLoading(false);
      return;
    }

    // Final validation for required fields
    const requiredFields = ['name', 'email', 'password', 'confirmPassword', 'phone'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());
    
    if (missingFields.length > 0) {
      enqueueSnackbar(`Please fill in all required fields: ${missingFields.join(', ')}`, { variant: "error" });
      setLoading(false);
      return;
    }

    // Role-specific validation
    if (formData.role === 'customer' && !formData.licenseNumber?.trim()) {
      enqueueSnackbar("Driver's license number is required for customers", { variant: "error" });
      setLoading(false);
      return;
    }

    if (formData.role === 'branch-manager' && !formData.branchLocation?.trim()) {
      enqueueSnackbar("Branch location is required for branch managers", { variant: "error" });
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = formData;
      const result = await register(registrationData);

      if (result.success) {
        enqueueSnackbar('Registration successful!', { variant: 'success' });

        // Redirect based on user role
        switch (result.user.role) {
          case 'customer':
            navigate('/customer-dashboard');
            break;
          case 'seller':
            navigate('/seller-dashboard');
            break;
          case 'branch-manager':
            navigate('/branch-manager-dashboard');
            break;
          case 'admin':
            navigate('/admin-dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        enqueueSnackbar(result.message, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('An error occurred during registration', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                onBlur={(e) => validateField('name', e.target.value)}
                placeholder="Enter your full name"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 sm:text-sm ${
                  fieldErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                onBlur={(e) => validateField('email', e.target.value)}
                placeholder="Enter your email"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 sm:text-sm ${
                  fieldErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                onBlur={(e) => validateField('phone', e.target.value)}
                placeholder="Enter your phone number"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 sm:text-sm ${
                  fieldErrors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="customer">Customer</option>
                <option value="seller">Vehicle Owner/Seller</option>
                <option value="branch-manager">Branch Manager</option>
              </select>
            </div>

            {/* Customer License */}
            {formData.role === 'customer' && (
              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                  Driver's License Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  onBlur={(e) => validateField('licenseNumber', e.target.value)}
                  placeholder="Enter your license number"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 sm:text-sm ${
                    fieldErrors.licenseNumber ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {fieldErrors.licenseNumber && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.licenseNumber}</p>
                )}
              </div>
            )}

            {/* Branch Manager Location */}
            {formData.role === 'branch-manager' && (
              <div>
                <label htmlFor="branchLocation" className="block text-sm font-medium text-gray-700">
                  Branch Location <span className="text-red-500">*</span>
                </label>
                <input
                  id="branchLocation"
                  name="branchLocation"
                  type="text"
                  required
                  value={formData.branchLocation}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  onBlur={(e) => validateField('branchLocation', e.target.value)}
                  placeholder="Enter branch location"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 sm:text-sm ${
                    fieldErrors.branchLocation ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {fieldErrors.branchLocation && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.branchLocation}</p>
                )}
              </div>
            )}

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                onBlur={(e) => validateField('address', e.target.value)}
                placeholder="Enter your address"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 sm:text-sm ${
                  fieldErrors.address ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {fieldErrors.address && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  onBlur={(e) => validateField('password', e.target.value)}
                  placeholder="Create a password"
                  className={`block w-full px-3 py-2 border rounded-md pr-10 focus:ring-blue-500 sm:text-sm ${
                    fieldErrors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible className="h-5 w-5 text-gray-400" />
                  ) : (
                    <AiOutlineEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  onBlur={(e) => validateField('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className={`block w-full px-3 py-2 border rounded-md pr-10 focus:ring-blue-500 sm:text-sm ${
                    fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <AiOutlineEyeInvisible className="h-5 w-5 text-gray-400" />
                  ) : (
                    <AiOutlineEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading || Object.keys(fieldErrors).length > 0}
                className={`w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white focus:ring-2 focus:ring-offset-2 ${
                  loading || Object.keys(fieldErrors).length > 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

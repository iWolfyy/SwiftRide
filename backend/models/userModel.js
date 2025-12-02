import mongoose from 'mongoose';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['customer', 'seller', 'branch-manager', 'admin'],
      default: 'customer',
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    licenseNumber: {
      type: String,
      required: function() {
        return this.role === 'customer';
      }
    },
    branchLocation: {
      type: String,
      required: function() {
        return this.role === 'branch-manager';
      }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stripeCustomerId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
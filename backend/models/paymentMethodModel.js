import mongoose from 'mongoose';

const paymentMethodSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stripeCustomerId: { type: String, required: true, index: true },
    stripePaymentMethodId: { type: String, required: true, unique: true },
    brand: { type: String },
    last4: { type: String },
    expMonth: { type: Number },
    expYear: { type: Number },
    country: { type: String },
    funding: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paymentMethodSchema.index({ user: 1, isDefault: 1 });

export const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);






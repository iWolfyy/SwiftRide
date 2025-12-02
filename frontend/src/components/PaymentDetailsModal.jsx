import React, { useState } from 'react';
import { XMarkIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { AiOutlineCar } from 'react-icons/ai';
import { generatePaymentPDF } from '../utils/paymentPdfGenerator';
import { useSnackbar } from 'notistack';

const PaymentDetailsModal = ({ isOpen, onClose, payment }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isDownloading, setIsDownloading] = useState(false);
  
  if (!isOpen || !payment) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatCardNumber = (last4) => {
    return `•••• •••• •••• ${last4}`;
  };

  const handleDownloadPDF = async () => {
    await generatePaymentPDF(payment, enqueueSnackbar, setIsDownloading);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCardIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                <p className="text-gray-600">Transaction ID: {payment._id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Status & Amount */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Status</h3>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  payment.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  payment.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  payment.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {payment.paymentStatus?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(payment.totalAmount || 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {payment.totalDays || 0} days × {formatCurrency(payment.pricePerDay || 0)}/day
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h3>
            
            <div className="flex items-start gap-4">
              {payment.vehicle?.images && payment.vehicle.images.length > 0 ? (
                <img
                  src={payment.vehicle.images[0]}
                  alt={`${payment.vehicle?.make} ${payment.vehicle?.model}`}
                  className="w-24 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-24 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <AiOutlineCar className="h-8 w-8 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900">
                  {payment.vehicle?.year} {payment.vehicle?.make} {payment.vehicle?.model}
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">License Plate:</span>
                    <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                      {payment.vehicle?.licensePlate || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <span className="ml-2 capitalize">{payment.vehicle?.type || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          {payment.paymentMethod && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
              
              <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5" />
                    <span className="font-bold text-lg">
                      {payment.paymentMethod.brand?.toUpperCase() || 'CARD'}
                    </span>
                  </div>
                </div>
                
                <div className="text-2xl font-mono tracking-wider mb-2">
                  {formatCardNumber(payment.paymentMethod.last4 || '0000')}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>Expires: {String(payment.paymentMethod.expMonth || 0).padStart(2, '0')}/{payment.paymentMethod.expYear || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Daily Rate × Days</span>
                <span className="font-medium">
                  {formatCurrency(payment.pricePerDay || 0)} × {payment.totalDays || 0} days
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency((payment.pricePerDay || 0) * (payment.totalDays || 0))}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Tax (5%)</span>
                <span className="font-medium">{formatCurrency(((payment.pricePerDay || 0) * (payment.totalDays || 0)) * 0.05)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Service Fee (5%)</span>
                <span className="font-medium">{formatCurrency(((payment.pricePerDay || 0) * (payment.totalDays || 0)) * 0.05)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4">
                <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(payment.totalAmount || 0)}</span>
              </div>
            </div>
          </div>

          {/* Rental Details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rental Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Pickup Location</div>
                  <div className="font-medium">{payment.pickupLocation || 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Drop-off Location</div>
                  <div className="font-medium">{payment.dropoffLocation || 'Not specified'}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Start Date</div>
                  <div className="font-medium">
                    {payment.startDate ? new Date(payment.startDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">End Date</div>
                  <div className="font-medium">
                    {payment.endDate ? new Date(payment.endDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Information */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Transaction Date</div>
                  <div className="font-medium">
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Booking Status</div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    payment.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                    payment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {payment.paymentIntentId && (
                  <div>
                    <div className="text-sm text-gray-600">Payment Intent ID</div>
                    <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {payment.paymentIntentId}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex justify-between">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7h-4V3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;

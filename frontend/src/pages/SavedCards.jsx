import React from 'react';
import PropTypes from 'prop-types';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import { 
  CreditCardIcon, 
  PlusIcon, 
  CheckIcon, 
  PencilIcon, 
  TrashIcon, 
  StarIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const AddCardForm = ({ onAdded }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { enqueueSnackbar } = useSnackbar();
  const { token } = useAuth();
  const [saving, setSaving] = React.useState(false);
  const [setDefault, setSetDefault] = React.useState(true);

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSaving(true);
    try {
      const siRes = await axios.post('http://localhost:5556/payments/setup-intent', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clientSecret = siRes.data.clientSecret;

      const cardElement = elements.getElement(CardElement);
      const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        enqueueSnackbar(error.message || 'Failed to confirm card', { variant: 'error' });
        return;
      }

      await axios.post('http://localhost:5556/payments/add-card', {
        paymentMethodId: setupIntent.payment_method,
        setDefault,
      }, { headers: { Authorization: `Bearer ${token}` } });

      enqueueSnackbar('Card added successfully', { variant: 'success' });
      if (onAdded) onAdded();
      elements.getElement(CardElement).clear();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to add card', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 p-8'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='p-3 bg-blue-100 rounded-xl'>
          <PlusIcon className='h-6 w-6 text-blue-600' />
        </div>
        <div>
          <h3 className='text-xl font-bold text-gray-900'>Add New Card</h3>
          <p className='text-gray-600 text-sm'>Securely add a payment method to your account</p>
        </div>
      </div>
      
      <form onSubmit={handleAddCard} className='space-y-6'>
        <div className='space-y-2'>
          <label className='text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
            <CreditCardIcon className='h-4 w-4' />
            Card Details
          </label>
          <div className='relative'>
            <div className='border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200'>
              <CardElement 
                options={{ 
                  hidePostalCode: true,
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#374151',
                      fontFamily: 'system-ui, sans-serif',
                      '::placeholder': {
                        color: '#9CA3AF',
                      },
                    },
                  },
                }} 
              />
            </div>
          </div>
        </div>
        
        <div className='flex items-center space-x-3 p-4 bg-gray-50 rounded-xl'>
          <input 
            type='checkbox' 
            id='setDefault'
            className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded' 
            checked={setDefault} 
            onChange={(e) => setSetDefault(e.target.checked)} 
          />
          <label htmlFor='setDefault' className='text-sm font-medium text-gray-700 flex items-center gap-2'>
            <StarIcon className='h-4 w-4 text-yellow-500' />
            Set as default payment method
          </label>
        </div>
        
        <button 
          type='submit' 
          disabled={!stripe || saving} 
          className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2'
        >
          {saving ? (
            <>
              <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
              Adding Card...
            </>
          ) : (
            <>
              <CheckIcon className='h-4 w-4' />
              Add Card
            </>
          )}
        </button>
      </form>
    </div>
  );
};

AddCardForm.propTypes = {
  onAdded: PropTypes.func
};

const SavedCardsInner = () => {
  const { token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [cards, setCards] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const loadCards = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5556/payments/cards', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards(res.data.paymentMethods || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load cards', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token, enqueueSnackbar]);

  React.useEffect(() => { loadCards(); }, [loadCards]);

  const setDefault = async (pmId) => {
    try {
      await axios.post(`http://localhost:5556/payments/cards/${pmId}/default`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      enqueueSnackbar('Default card updated', { variant: 'success' });
      loadCards();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to set default', { variant: 'error' });
    }
  };

  const remove = async (pmId) => {
    try {
      await axios.delete(`http://localhost:5556/payments/cards/${pmId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      enqueueSnackbar('Card deleted', { variant: 'success' });
      loadCards();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete card', { variant: 'error' });
    }
  };

  const [editingId, setEditingId] = React.useState(null);
  const [editForm, setEditForm] = React.useState({ expMonth: '', expYear: '' });

  const startEdit = (c) => {
    setEditingId(c.stripePaymentMethodId);
    setEditForm({
      expMonth: c.expMonth || '',
      expYear: c.expYear || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ expMonth: '', expYear: '' });
  };

  const saveEdit = async (pmId) => {
    try {
      const body = {};
      if (!editForm.expMonth || !editForm.expYear) {
        enqueueSnackbar('All fields are required', { variant: 'error' });
        return;
      }
      if (editForm.expMonth && !/^\d+$/.test(editForm.expMonth)) {
        enqueueSnackbar('Month must be a number', { variant: 'error' });
        return;
      }
      if (editForm.expYear && !/^\d+$/.test(editForm.expYear)) {
        enqueueSnackbar('Year must be a number', { variant: 'error' });
        return;
      }

      if (editForm.expMonth) body.expMonth = Number(editForm.expMonth);
      if (editForm.expYear) body.expYear = Number(editForm.expYear);
      if (Object.keys(body).length === 0) {
        enqueueSnackbar('Nothing to update', { variant: 'info' });
        return;
      }

      // ✅ Confirmation dialog
      const confirm = window.confirm(
        `Are you sure you want to update the expiry date to ${String(editForm.expMonth).padStart(2,'0')}/${editForm.expYear}?`
      );
      if (!confirm) return;

      await axios.patch(`http://localhost:5556/payments/cards/${pmId}`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      enqueueSnackbar('Expiry updated', { variant: 'success' });
      cancelEdit();
      loadCards();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update card', { variant: 'error' });
    }
  };


  const getCardBrandGradient = (brand) => {
    const gradients = {
      visa: 'from-blue-500 to-blue-700',
      mastercard: 'from-red-400 to-yellow-400',
      amex: 'from-blue-400 to-green-400',
      discover: 'from-orange-400 to-red-400',
      default: 'from-gray-500 to-gray-700'
    };
    return gradients[brand?.toLowerCase()] || gradients.default;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4'>
      <div className='max-w-6xl mx-auto space-y-8'>
        {/* Header Section */}
        <div className='text-center space-y-4'>
          <div className='flex items-center justify-center gap-3'>
            <div className='p-3 bg-blue-100 rounded-2xl'>
              <CreditCardIcon className='h-8 w-8 text-blue-600' />
            </div>
            <h1 className='text-4xl font-bold text-gray-900'>Payment Methods</h1>
          </div>
          <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
            Manage your saved payment methods securely. Add, edit, or remove cards as needed.
          </p>
        </div>

        {/* Add Card Form */}
        <div className='max-w-2xl mx-auto'>
          <AddCardForm onAdded={loadCards} />
        </div>

        {/* Cards List */}
        <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
          <div className='bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200'>
            <div className='flex items-center gap-3'>
              <ShieldCheckIcon className='h-6 w-6 text-green-600' />
              <h2 className='text-2xl font-bold text-gray-900'>Your Cards</h2>
              <span className='bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full'>
                {cards.length} {cards.length === 1 ? 'card' : 'cards'}
              </span>
            </div>
          </div>

          <div className='p-8'>
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='flex flex-col items-center gap-4'>
                  <div className='animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600'></div>
                  <p className='text-gray-600 font-medium'>Loading your cards...</p>
                </div>
              </div>
            ) : cards.length === 0 ? (
              <div className='text-center py-12'>
                <div className='mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                  <CreditCardIcon className='h-12 w-12 text-gray-400' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>No cards saved yet</h3>
                <p className='text-gray-600 mb-6'>Add your first payment method to get started</p>
              </div>
            ) : (
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {cards.map((c, index) => (
                  <div 
                    key={c.stripePaymentMethodId} 
                    className={`group relative bg-gradient-to-br ${getCardBrandGradient(c.brand)} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Card Header */}
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center'>
                          <CreditCardIcon className='h-5 w-5' />
                        </div>
                        <span className='font-bold text-lg'>{(c.brand || 'Card').toUpperCase()}</span>
                      </div>
                      {c.isDefault && (
                        <div className='bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1'>
                          <StarIcon className='h-3 w-3' />
                          DEFAULT
                        </div>
                      )}
                    </div>

                    {/* Card Number */}
                    <div className='mb-4'>
                      <div className='text-2xl font-mono tracking-wider'>
                        •••• •••• •••• {c.last4}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <CalendarIcon className='h-4 w-4' />
                        <span className='text-sm font-medium'>
                          {String(c.expMonth).padStart(2,'0')}/{c.expYear}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <div className='w-2 h-2 bg-white/60 rounded-full'></div>
                        <div className='w-2 h-2 bg-white/40 rounded-full'></div>
                        <div className='w-2 h-2 bg-white/20 rounded-full'></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                      <div className='flex gap-1'>
                        {!c.isDefault && (
                          <button 
                            onClick={() => setDefault(c.stripePaymentMethodId)} 
                            className='p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200'
                            title='Set as default'
                          >
                            <StarIcon className='h-4 w-4' />
                          </button>
                        )}
                        <button 
                          onClick={() => startEdit(c)} 
                          className='p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200'
                          title='Edit card'
                        >
                          <PencilIcon className='h-4 w-4' />
                        </button>
                        <button 
                          onClick={() => remove(c.stripePaymentMethodId)} 
                          className='p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors duration-200'
                          title='Delete card'
                        >
                          <TrashIcon className='h-4 w-4' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Form Modal */}
        {editingId && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-8'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <PencilIcon className='h-5 w-5 text-blue-600' />
                </div>
                <h3 className='text-xl font-bold text-gray-900'>Update Card Details</h3>
              </div>
              
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>Expiry Month</label>
                  <input 
                    value={editForm.expMonth} 
                    onChange={(e)=>setEditForm(f=>({...f,expMonth:e.target.value}))} 
                    type='number' 
                    min='1' 
                    max='12' 
                    className='w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200' 
                    placeholder='MM'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>Expiry Year</label>
                  <input 
                    value={editForm.expYear} 
                    onChange={(e)=>setEditForm(f=>({...f,expYear:e.target.value}))} 
                    type='number' 
                    min='2025' 
                    className='w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200' 
                    placeholder='YYYY'
                  />
                </div>
              </div>
              
              <div className='flex gap-3 mt-8'>
                <button 
                  onClick={()=>saveEdit(editingId)} 
                  className='flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2'
                >
                  <CheckIcon className='h-4 w-4' />
                  Save Changes
                </button>
                <button 
                  onClick={cancelEdit} 
                  className='px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SavedCards = () => {
  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4'>
        <div className='max-w-md w-full'>
          <div className='bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center'>
            <div className='mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4'>
              <ExclamationTriangleIcon className='h-8 w-8 text-yellow-600' />
            </div>
            <h3 className='text-xl font-bold text-gray-900 mb-2'>Configuration Required</h3>
            <p className='text-gray-600 mb-6'>
              Please set VITE_STRIPE_PUBLISHABLE_KEY in your frontend/.env file and restart the development server.
            </p>
            <div className='bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl text-sm'>
              <code className='font-mono'>VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key_here</code>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <Elements stripe={stripePromise}>
      <SavedCardsInner />
    </Elements>
  );
};

export default SavedCards;

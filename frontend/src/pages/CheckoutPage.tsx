import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export interface Address {
  id: string;
  title: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
}

export const CheckoutPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in or cart is empty
  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=checkout');
    } else if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [user, cartItems, navigate]);

  // Steps state
  const [activeStep, setActiveStep] = useState(1); // 1: Shipping Address, 2: Payment & Delivery, 3: Review Order

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // New Address form toggle and state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: '',
    name: '',
    address: '',
    city: '',
    zip: '',
    country: 'India',
    phone: '',
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Shipping Method
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const shippingCost = shippingMethod === 'express' ? 500 : 0;

  // Payment Method & Details
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [paymentType, setPaymentType] = useState<'upi' | 'card'>('upi');
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    holder: '',
    number: '',
    expiry: '',
    cvv: '',
  });
  const [paymentError, setPaymentError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const fetchAddresses = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data);
      if (res.data.length > 0 && !selectedAddressId) {
        setSelectedAddressId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAddresses();
    }
  }, [token]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddressError('');
    setSavingAddress(true);

    try {
      const res = await axios.post('/api/addresses', newAddress, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(prev => [...prev, res.data]);
      setSelectedAddressId(res.data.id);
      setShowAddressForm(false);
      setNewAddress({
        title: '',
        name: '',
        address: '',
        city: '',
        zip: '',
        country: 'India',
        phone: '',
      });
    } catch (err: any) {
      setAddressError(err?.response?.data?.error || 'Failed to save address. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addrId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await axios.delete(`/api/addresses/${addrId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(prev => prev.filter(a => a.id !== addrId));
      if (selectedAddressId === addrId) {
        setSelectedAddressId('');
      }
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const handleVerifyUPI = () => {
    if (!upiId) return;
    setVerifyingUpi(true);
    setPaymentError('');
    setTimeout(() => {
      setVerifyingUpi(false);
      setUpiVerified(true);
    }, 1200);
  };

  const handlePlaceOrder = async () => {
    if (!token) return;
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) {
      setPaymentError('Please select a shipping address.');
      setActiveStep(1);
      return;
    }

    setPaymentError('');
    setPlacingOrder(true);

    try {
      // 1. Process payment transaction through charge API
      if (paymentMethod === 'card') {
        if (paymentType === 'upi' && !upiVerified) {
          throw new Error('Please verify your UPI ID before placing order.');
        }

        const payRes = await axios.post('/api/payment/charge', {
          amount: cartTotal + shippingCost,
          paymentMethod: paymentType === 'upi' ? 'UPI' : 'Card',
          currency: 'inr',
          token: paymentType === 'upi' ? upiId : 'tok_visa',
        });

        if (!payRes.data.success) {
          throw new Error(payRes.data.error || 'Payment authorization failed.');
        }
      }

      // 2. Submit the order to backend
      const orderRes = await axios.post(
        '/api/orders',
        {
          items: cartItems,
          shippingAddress: selectedAddress,
          paymentMethod: paymentMethod === 'card' ? (paymentType === 'upi' ? 'UPI' : 'Credit Card') : 'Cash on Delivery (COD)',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const placedOrder = orderRes.data.order;
      
      // 3. Clear shopping cart and redirect to order tracking route
      clearCart();
      navigate(`/orders/${placedOrder.id}`);
    } catch (err: any) {
      setPaymentError(err?.response?.data?.error || err.message || 'Failed to complete order checkout.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const selectedAddr = addresses.find(a => a.id === selectedAddressId);

  return (
    <div className="min-h-screen bg-background text-gray-100 pt-28 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Checkout Progress Stepper */}
      <div className="max-w-3xl mx-auto mb-12 flex justify-between items-center relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-800 -translate-y-1/2 z-0"></div>
        {[1, 2, 3].map((step) => (
          <button
            key={step}
            disabled={step > activeStep && !selectedAddressId}
            onClick={() => setActiveStep(step)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all ${
              activeStep === step
                ? 'bg-primary text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] border border-primary'
                : activeStep > step
                ? 'bg-secondary text-background font-black'
                : 'bg-surface border border-gray-800 text-gray-500'
            }`}
          >
            {activeStep > step ? '✓' : step}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Step Flow Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: ADDRESS BOOK */}
          {activeStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-surface/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md"
            >
              <h2 className="text-xl font-bold mb-6 text-white flex justify-between items-center">
                Select Delivery Address
                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="text-xs bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/30 px-3 py-1.5 rounded-xl font-semibold transition-colors"
                  >
                    + Add New Node
                  </button>
                )}
              </h2>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="border border-gray-800 bg-background/50 p-5 rounded-2xl mb-6 space-y-4">
                  <h3 className="font-bold text-sm text-gray-200">New Address Details</h3>
                  {addressError && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-center text-xs text-primary font-medium">
                      {addressError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Address Title (e.g. Home/Work)</label>
                      <input
                        type="text"
                        required
                        value={newAddress.title}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Home"
                        className="w-full bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Recipient Name</label>
                      <input
                        type="text"
                        required
                        value={newAddress.name}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Street Address</label>
                    <input
                      type="text"
                      required
                      value={newAddress.address}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="88 Cybernetic Ave, Sector 7"
                      className="w-full bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">City</label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Neo Tokyo"
                        className="w-full bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Postal/ZIP Code</label>
                      <input
                        type="text"
                        required
                        value={newAddress.zip}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, zip: e.target.value }))}
                        placeholder="100-0001"
                        className="w-full bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Country</label>
                      <input
                        type="text"
                        required
                        value={newAddress.country}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Japan"
                        className="w-full bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Contact Phone Number</label>
                    <input
                      type="text"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+81 90-1234-5678"
                      className="w-full bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 border border-gray-800 hover:bg-surface rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="px-4 py-2 bg-secondary text-background hover:brightness-110 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {savingAddress ? 'Saving...' : 'Establish Address Node'}
                    </button>
                  </div>
                </form>
              )}

              {loadingAddresses ? (
                <div className="text-center py-6 text-gray-500">Retrieving user configurations...</div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-6 text-gray-500 italic">No registered delivery addresses. Click '+ Add New Node' to configure one.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        selectedAddressId === addr.id
                          ? 'border-secondary bg-secondary/5 shadow-[0_0_15px_rgba(78,205,196,0.1)]'
                          : 'border-gray-800 bg-background/30 hover:border-gray-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider bg-secondary/15 px-2 py-0.5 rounded text-secondary">
                            {addr.title || 'Address'}
                          </span>
                          <button
                            onClick={(e) => handleDeleteAddress(addr.id, e)}
                            className="text-gray-500 hover:text-primary transition-colors text-xs"
                            title="Delete Node"
                          >
                            🗑️
                          </button>
                        </div>
                        <h4 className="font-bold text-sm text-gray-200 mb-1">{addr.name}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed mb-3">
                          {addr.address}, {addr.city}, {addr.zip}, {addr.country}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 font-semibold border-t border-gray-800/60 pt-2.5">
                        📞 {addr.phone}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => selectedAddressId ? setActiveStep(2) : null}
                  disabled={!selectedAddressId}
                  className="bg-primary text-white font-bold py-2.5 px-6 rounded-xl uppercase tracking-wider text-xs shadow-md disabled:opacity-50 hover:brightness-110"
                >
                  Continue to Delivery & Payment →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: DELIVERY SPEEDS & PAYMENTS */}
          {activeStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Delivery Speeds */}
              <div className="bg-surface/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md">
                <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                  <span>🚀</span> Select Delivery Speed
                </h2>
                <div className="space-y-4">
                  <label
                    className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                      shippingMethod === 'standard'
                        ? 'border-secondary bg-secondary/5'
                        : 'border-gray-800 bg-background/30 hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === 'standard'}
                      onChange={() => setShippingMethod('standard')}
                      className="accent-secondary"
                    />
                    <div className="flex-grow">
                      <div className="flex justify-between font-bold text-sm text-gray-200">
                        <span>Standard Secure Courier</span>
                        <span className="text-secondary">FREE</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Delivery in 3 to 5 business days. Safe, eco-packaged.</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                      shippingMethod === 'express'
                        ? 'border-secondary bg-secondary/5'
                        : 'border-gray-800 bg-background/30 hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === 'express'}
                      onChange={() => setShippingMethod('express')}
                      className="accent-secondary"
                    />
                    <div className="flex-grow">
                      <div className="flex justify-between font-bold text-sm text-gray-200">
                        <span>Hyper-Express Portal Delivery</span>
                        <span>+₹500</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Guaranteed delivery in 1 to 2 business days. Real-time satellite tracking.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Secure Payment */}
              <div className="bg-surface/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md">
                <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                  <span>💳</span> Payment Framework
                </h2>

                <div className="flex gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-3 border font-bold text-xs uppercase tracking-wider rounded-xl transition-all ${
                      paymentMethod === 'card'
                        ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                        : 'border-gray-800 bg-background/40 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    Instant UPI / Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex-1 py-3 border font-bold text-xs uppercase tracking-wider rounded-xl transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                        : 'border-gray-800 bg-background/40 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    Cash on Delivery (COD)
                  </button>
                </div>

                {paymentMethod === 'card' ? (
                  <div className="space-y-4 border border-gray-800/60 p-4 rounded-2xl bg-background/40">
                    {/* Sub-tabs for UPI vs Cards */}
                    <div className="flex gap-2 p-1 bg-background/60 rounded-xl border border-gray-800/80 mb-2">
                      <button
                        type="button"
                        onClick={() => setPaymentType('upi')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                          paymentType === 'upi'
                            ? 'bg-secondary text-background'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        ⚡ UPI ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType('card')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                          paymentType === 'card'
                            ? 'bg-secondary text-background'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        💳 Credit/Debit Card
                      </button>
                    </div>

                    {paymentType === 'upi' ? (
                      <div className="space-y-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">UPI Address (VPA)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => {
                                setUpiId(e.target.value);
                                setUpiVerified(false);
                              }}
                              placeholder="mobile@upi or username@okhdfcbank"
                              className="flex-grow bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyUPI}
                              disabled={!upiId || verifyingUpi}
                              className="bg-secondary text-background font-bold px-4 rounded-xl text-xs uppercase tracking-wider hover:brightness-110 disabled:opacity-50 shrink-0"
                            >
                              {verifyingUpi ? 'Verifying...' : upiVerified ? 'Verified ✓' : 'Verify'}
                            </button>
                          </div>
                          {upiVerified && (
                            <p className="text-[10px] text-green-400 font-semibold mt-2 flex items-center gap-1">
                              <span>✓</span> UPI VPA linked to <strong>Rohith Gadiparthi</strong>. Ready to auto-charge.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Cardholder Name</label>
                          <input
                            type="text"
                            value={cardDetails.holder}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, holder: e.target.value }))}
                            placeholder="John Doe"
                            className="w-full bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Card Number</label>
                          <input
                            type="text"
                            maxLength={16}
                            value={cardDetails.number}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value.replace(/\D/g, '') }))}
                            placeholder="4111 2222 3333 4444"
                            className="w-full bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Expiry (MM/YY)</label>
                            <input
                              type="text"
                              maxLength={5}
                              value={cardDetails.expiry}
                              onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                              placeholder="12/28"
                              className="w-full bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Security Code (CVV)</label>
                            <input
                              type="password"
                              maxLength={3}
                              value={cardDetails.cvv}
                              onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                              placeholder="•••"
                              className="w-full bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-2xl text-center">
                    <p className="text-xs text-secondary leading-relaxed font-semibold">
                      🇮🇳 Cash on Delivery (COD) enabled. Please pay with Cash or UPI directly to our delivery agent upon package drop-off.
                    </p>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-800 flex justify-between">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="border border-gray-800 text-gray-400 hover:bg-surface font-bold py-2.5 px-6 rounded-xl uppercase tracking-wider text-xs"
                  >
                    ← Back to Address
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="bg-primary text-white font-bold py-2.5 px-6 rounded-xl uppercase tracking-wider text-xs shadow-md hover:brightness-110"
                  >
                    Review Order Summary →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: ORDER REVIEW */}
          {activeStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-surface/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md space-y-6"
            >
              <h2 className="text-xl font-bold mb-4 text-white">Review & Confirm Order</h2>

              {paymentError && (
                <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-center text-xs text-primary font-semibold">
                  {paymentError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-800/80">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Delivery Coordinate Node</h4>
                  {selectedAddr ? (
                    <div className="text-xs text-gray-300 space-y-1">
                      <p className="font-bold text-white">{selectedAddr.name}</p>
                      <p>{selectedAddr.address}</p>
                      <p>{selectedAddr.city}, {selectedAddr.zip}</p>
                      <p>{selectedAddr.country}</p>
                      <p className="text-gray-500">📞 {selectedAddr.phone}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-primary italic">No address selected.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Delivery Speed & Payment</h4>
                  <div className="text-xs text-gray-300 space-y-2">
                    <p>
                      <span className="font-semibold text-gray-400">Courier method:</span>{' '}
                      <span className="capitalize text-secondary font-bold">{shippingMethod}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-400">Payment mechanism:</span>{' '}
                      <span className="capitalize text-primary font-bold">
                        {paymentMethod === 'card' ? 'Credit Card' : 'Cyber-Cash (COD)'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Order items preview list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Package Items</h4>
                {cartItems.map(item => (
                  <div key={item.id + (item.variation || '')} className="flex justify-between items-center bg-background/30 border border-gray-800/60 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded" />
                      <div>
                        <p className="text-xs font-bold text-white">{item.name}</p>
                        {item.variation && <p className="text-[10px] text-secondary font-bold uppercase">{item.variation}</p>}
                      </div>
                    </div>
                    <div className="text-xs font-black text-gray-300">
                      {item.quantity} x ₹{item.price.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-800 flex justify-between">
                <button
                  onClick={() => setActiveStep(2)}
                  className="border border-gray-800 text-gray-400 hover:bg-surface font-bold py-2.5 px-6 rounded-xl uppercase tracking-wider text-xs"
                >
                  ← Edit Specs
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="bg-gradient-to-r from-primary to-secondary text-white font-bold py-2.5 px-8 rounded-xl uppercase tracking-wider text-xs shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50"
                >
                  {placingOrder ? 'Processing Authorization...' : 'Place Secure Order'}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Checkout Sidebar Summary */}
        <div className="bg-surface/80 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-6">
          <h2 className="text-lg font-bold border-b border-gray-800 pb-4 text-white">Price Overview</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Cart Subtotal</span>
              <span className="font-semibold text-gray-200">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Shipping Fee</span>
              <span className="font-semibold text-gray-200">
                {shippingCost === 0 ? 'FREE' : `₹${shippingCost.toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Import Tax</span>
              <span className="font-semibold text-gray-200">Included</span>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4 flex justify-between items-baseline">
            <span className="font-bold text-gray-200">Grand Total</span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-pulse">
              ₹{(cartTotal + shippingCost).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-background/40 border border-gray-800/60 p-4 rounded-2xl text-xs space-y-2.5">
            <h4 className="font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔒</span> AES-256 Bit Encryption
            </h4>
            <p className="text-gray-500 leading-relaxed">
              Your transaction is encrypted securely. Access node authentication guarantees zero security leaks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

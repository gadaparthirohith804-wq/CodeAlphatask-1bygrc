import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const CartPage: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, cartCount, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    if (user) {
      navigate('/checkout');
    } else {
      // Redirect to login and specify return path
      navigate('/login?redirect=checkout');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background text-gray-100 pt-32 pb-16 px-4 md:px-8 flex flex-col items-center justify-center max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center p-8 bg-surface/50 border border-gray-800 rounded-3xl backdrop-blur-md max-w-md w-full shadow-2xl"
        >
          <div className="text-6xl mb-6">🛒</div>
          <h2 className="text-2xl font-black mb-3 text-white">Your Cart is Empty</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Looks like you haven't added any high-tech gear to your cart yet. Explore our futuristic catalog and claim yours today!
          </p>
          <Link
            to="/catalog"
            className="inline-block w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3.5 px-8 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.25)] hover:brightness-110 uppercase tracking-wider text-xs"
          >
            Explore Catalog
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-gray-100 pt-28 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 flex items-center gap-3">
        <span className="w-8 h-1 bg-primary rounded-full"></span>
        Shopping Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {cartItems.map((item) => (
              <motion.div
                key={item.id + (item.variation || '')}
                variants={itemVariants}
                exit={{ opacity: 0, x: -50 }}
                layout
                className="flex flex-col sm:flex-row items-center gap-4 bg-surface/60 border border-gray-800/80 p-4 rounded-2xl backdrop-blur-sm"
              >
                {/* Product Thumbnail */}
                <div className="w-20 h-20 bg-black/20 rounded-xl overflow-hidden flex items-center justify-center p-1 border border-gray-800">
                  <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                </div>

                {/* Info */}
                <div className="flex-grow text-center sm:text-left">
                  <h3 className="font-bold text-white text-base hover:text-secondary transition-colors">
                    <Link to={`/product/${item.id}`}>{item.name}</Link>
                  </h3>
                  {item.variation && (
                    <span className="inline-block text-[11px] text-secondary font-bold uppercase tracking-wider bg-secondary/10 px-2 py-0.5 rounded-md mt-1">
                      {item.variation}
                    </span>
                  )}
                  <div className="text-sm font-semibold text-gray-400 mt-1 sm:hidden">
                    ₹{item.price.toLocaleString('en-IN')} each
                  </div>
                </div>

                {/* Price (desktop) */}
                <div className="hidden sm:block text-right font-semibold text-gray-300 w-24">
                  ₹{item.price.toLocaleString('en-IN')}
                </div>

                {/* Quantity Control */}
                <div className="flex items-center bg-background border border-gray-800 rounded-xl px-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.variation)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    -
                  </button>
                  <span className="px-3 text-sm font-bold w-10 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.variation)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal & Action */}
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary w-24">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeFromCart(item.id, item.variation)}
                    className="p-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-xl transition-colors"
                    title="Remove Item"
                  >
                    🗑️
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Right Column: Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-surface/80 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-6"
        >
          <h2 className="text-xl font-bold border-b border-gray-800 pb-4 text-white">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-200">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Estimated Shipping</span>
              <span className="text-secondary font-bold uppercase text-xs bg-secondary/10 px-2 py-0.5 rounded">FREE</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Tax (GST)</span>
              <span className="font-semibold text-gray-200">Included</span>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4 flex justify-between items-baseline">
            <span className="font-bold text-gray-200">Total Price</span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              ₹{cartTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="pt-4 space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckoutClick}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3.5 px-8 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.25)] hover:brightness-110 uppercase tracking-wider text-xs flex items-center justify-center gap-2"
            >
              Proceed to Secure Checkout
            </motion.button>
            <Link
              to="/catalog"
              className="block w-full text-center text-xs font-bold text-gray-400 hover:text-secondary uppercase tracking-widest transition-colors py-2"
            >
              ← Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CartPage;

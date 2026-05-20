import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export interface Product {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  stock: number;
  rating: number;
  ratingsCount: number;
  assured: boolean;
  specs: string[];
  variations?: Record<string, string[]>;
}

export interface Review {
  id: number;
  productId: number;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const { t } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [successMsg, setSuccessMsg] = useState(false);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Price modifier helper
  const getPriceModifier = (key: string, value: string): number => {
    const k = key.toLowerCase();
    const v = value.toLowerCase();
    if (k === 'storage') {
      if (v.includes('256gb')) return 10000;
      if (v.includes('512gb')) return 20000;
      if (v.includes('1tb')) return 40000;
      if (v.includes('64gb')) return -2000;
    }
    if (k === 'size') {
      if (v === '55 inch') return 15000;
      if (v === '65 inch') return 30000;
      if (v === 'king') return 10000;
      if (v === 'l' || v === 'us 9') return 500;
      if (v === 'xl' || v === 'us 10') return 1000;
      if (v === 'xxl' || v === 'us 11') return 1500;
      if (v.includes('44mm')) return 3000;
    }
    if (k === 'ram') {
      if (v.includes('16gb')) return 8000;
      if (v.includes('24gb')) return 16000;
      if (v.includes('32gb')) return 24000;
    }
    if (k === 'combo') {
      if (v.includes('fly more')) return 8000;
    }
    if (k === 'capacity') {
      if (v === '4.0l') return 1000;
      if (v === '6.0l') return 2000;
    }
    if (k === 'version') {
      if (v.includes('collector')) return 3000;
    }
    if (k === 'grip') {
      if (v === '4 3/8') return 200;
      if (v === '4 1/2') return 400;
    }
    return 0;
  };

  const getCalculatedPrice = () => {
    if (!product) return 0;
    let base = product.price;
    Object.entries(selectedVariations).forEach(([key, val]) => {
      base += getPriceModifier(key, val);
    });
    return base;
  };

  const getCalculatedOriginalPrice = () => {
    if (!product) return 0;
    let base = product.originalPrice;
    Object.entries(selectedVariations).forEach(([key, val]) => {
      base += getPriceModifier(key, val);
    });
    return base;
  };

  const currentPrice = getCalculatedPrice();
  const currentOriginalPrice = getCalculatedOriginalPrice();

  const getColorFilter = (colorStr?: string) => {
    if (!colorStr) return 'none';
    const c = colorStr.toLowerCase();
    if (c.includes('blue') || c.includes('cyan') || c.includes('sky')) {
      return 'hue-rotate(185deg) saturate(1.2) contrast(1.05)';
    }
    if (c.includes('green') || c.includes('mint')) {
      return 'hue-rotate(90deg) saturate(1.1) brightness(0.95)';
    }
    if (c.includes('red') || c.includes('rose') || c.includes('pink') || c.includes('coral')) {
      return 'hue-rotate(300deg) saturate(1.3)';
    }
    if (c.includes('gold') || c.includes('yellow') || c.includes('orange')) {
      return 'hue-rotate(40deg) brightness(1.15) saturate(1.3) contrast(1.05)';
    }
    if (c.includes('black') || c.includes('grey') || c.includes('gray') || c.includes('graphite') || c.includes('dark') || c.includes('charcoal')) {
      return 'grayscale(100%) brightness(0.55) contrast(1.1)';
    }
    if (c.includes('white') || c.includes('silver') || c.includes('platinum') || c.includes('starlight')) {
      return 'grayscale(100%) brightness(1.3) contrast(1.05)';
    }
    return 'none';
  };

  const selectedColor = selectedVariations['colors'] || selectedVariations['color'] || selectedVariations['palette'] || selectedVariations['type'];

  const fetchProductDetails = async () => {
    try {
      const [prodRes, reviewsRes] = await Promise.all([
        axios.get(`/api/products/${id}`),
        axios.get(`/api/products/${id}/reviews`),
      ]);
      setProduct(prodRes.data);
      setReviews(reviewsRes.data);

      // Set default variations
      if (prodRes.data.variations) {
        const defaults: Record<string, string> = {};
        Object.entries(prodRes.data.variations as Record<string, string[]>).forEach(([key, values]) => {
          if (values && values.length > 0) {
            defaults[key] = values[0];
          }
        });
        setSelectedVariations(defaults);
      }
    } catch (err) {
      console.error('Failed to load product details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const varString = Object.entries(selectedVariations)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: currentPrice,
        image: product.image,
        variation: varString || undefined,
      },
      quantity
    );

    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;
    setReviewError('');
    setSubmittingReview(true);

    try {
      await axios.post(
        `/api/products/${product.id}/reviews`,
        {
          name: user.name,
          rating: newRating,
          comment: newComment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewComment('');
      // Reload reviews and product stats
      fetchProductDetails();
    } catch (err: any) {
      setReviewError(err?.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pt-32 text-center text-gray-400">
        <h2 className="text-2xl font-bold mb-4">{t('productNotFound')}</h2>
        <Link to="/catalog" className="text-secondary hover:underline">{t('returnToCatalog')}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-gray-100 pt-28 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <Link
        to="/catalog"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-secondary mb-8 transition-colors uppercase tracking-wider"
      >
        ← {t('backToCatalog')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Product Image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-surface border border-gray-800 rounded-3xl overflow-hidden shadow-2xl h-[450px] md:h-[550px] flex items-center justify-center p-4"
        >
          <img
            src={product.image}
            alt={product.name}
            style={{ filter: getColorFilter(selectedColor) }}
            className="max-h-full max-w-full object-contain rounded-2xl transition-all duration-500 ease-out"
          />
          {product.assured && (
            <span className="absolute top-4 left-4 bg-secondary text-background font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(78,205,196,0.3)]">
              {t('assuredOnly').split(' ')[0]}
            </span>
          )}
          {product.stock <= 0 ? (
            <span className="absolute top-4 right-4 bg-primary text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              {t('soldOut')}
            </span>
          ) : product.stock <= 5 ? (
            <span className="absolute top-4 right-4 bg-accent text-background font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              Only {product.stock} left!
            </span>
          ) : null}
        </motion.div>

        {/* Right Column: Product Info & Actions */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col justify-between"
        >
          <div>
            <span className="text-secondary text-xs font-bold uppercase tracking-widest bg-secondary/10 px-3 py-1 rounded-full">
              {product.brand} • {product.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold mt-4 text-white leading-tight">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center text-accent">
                {'★'.repeat(Math.round(product.rating))}
                {'☆'.repeat(5 - Math.round(product.rating))}
              </div>
              <span className="text-sm font-semibold text-gray-300">
                {product.rating} / 5.0
              </span>
              <span className="text-xs text-gray-500">
                ({product.ratingsCount} {t('ratings')})
              </span>
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-4 mt-6">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {currentOriginalPrice > currentPrice && (
                <>
                  <span className="text-lg text-gray-500 line-through">
                    ₹{currentOriginalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-extrabold text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded">
                    {Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-400 leading-relaxed mt-6 text-sm">
              {product.description}
            </p>

            {/* Variations Selection */}
            {product.variations && Object.keys(product.variations).length > 0 && (
              <div className="mt-8 space-y-6">
                {Object.entries(product.variations).map(([key, options]) => (
                  <div key={key}>
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      {t('selectVariation')} {key}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setSelectedVariations(prev => ({ ...prev, [key]: opt }))}
                          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                            selectedVariations[key] === opt
                              ? 'border-secondary bg-secondary/10 text-secondary'
                              : 'border-gray-800 bg-surface/50 text-gray-400 hover:border-gray-700'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add to Cart Section */}
          <div className="mt-8 pt-8 border-t border-gray-800/80">
            {product.stock > 0 ? (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Quantity selector */}
                <div className="flex items-center bg-surface border border-gray-800 rounded-xl px-2">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    -
                  </button>
                  <span className="px-4 font-bold text-sm w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    +
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3.5 px-8 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.2)] uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:brightness-110"
                >
                  {t('addToCart')}
                </motion.button>
              </div>
            ) : (
              <button
                disabled
                className="w-full bg-gray-800 text-gray-600 font-bold py-3.5 px-8 rounded-xl uppercase tracking-wider text-sm cursor-not-allowed"
              >
                {t('soldOut')}
              </button>
            )}

            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3 bg-secondary/15 border border-secondary/30 rounded-xl text-center text-sm font-semibold text-secondary"
                >
                  ✓ {t('successAddedToCart')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Specifications Details Grid */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="w-8 h-1 bg-secondary rounded-full"></span>
          {t('technicalSpecs')}
        </h2>
        <div className="bg-surface/50 border border-gray-800/80 backdrop-blur-md rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.specs.map((spec, index) => (
              <div key={index} className="flex gap-4 p-3 border-b border-gray-800/40 text-sm">
                <span className="text-secondary font-semibold min-w-[24px]">0{index + 1}.</span>
                <span className="text-gray-300">{spec}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews & Submission Form */}
      <section className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Review list */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-8 h-1 bg-primary rounded-full"></span>
            {t('customerReviews')}
          </h2>
          {reviews.length === 0 ? (
            <p className="text-gray-500 italic">No reviews submitted yet. Be the first to share your thoughts!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-surface/40 border border-gray-800/60 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-200">{rev.name}</span>
                    <span className="text-xs text-gray-500">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-accent mb-2 text-sm">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                  <p className="text-gray-400 text-sm">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review submission */}
        <div>
          <h2 className="text-xl font-bold mb-6">Write a Review</h2>
          {user ? (
            <form onSubmit={handleReviewSubmit} className="bg-surface/60 border border-gray-800/80 p-6 rounded-2xl space-y-4">
              {reviewError && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-center text-xs text-primary font-semibold">
                  {reviewError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Rating</label>
                <select
                  value={newRating}
                  onChange={(e) => setNewRating(parseInt(e.target.value))}
                  className="w-full bg-background border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                >
                  <option value="5">5 Stars - Excellent</option>
                  <option value="4">4 Stars - Very Good</option>
                  <option value="3">3 Stars - Average</option>
                  <option value="2">2 Stars - Poor</option>
                  <option value="1">1 Star - Terrible</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Comments</label>
                <textarea
                  required
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience with this tech..."
                  className="w-full bg-background border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-secondary placeholder-gray-600 focus:ring-1 focus:ring-secondary/40 shadow-inner"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submittingReview}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-2.5 rounded-xl uppercase tracking-wider text-xs shadow-lg hover:brightness-110 disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Feed'}
              </motion.button>
            </form>
          ) : (
            <div className="bg-surface/30 border border-gray-800/40 p-6 rounded-2xl text-center">
              <p className="text-sm text-gray-500 mb-4">You must be logged in to leave reviews.</p>
              <Link
                to="/login"
                className="inline-block bg-secondary text-background font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider hover:bg-opacity-95"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetailsPage;

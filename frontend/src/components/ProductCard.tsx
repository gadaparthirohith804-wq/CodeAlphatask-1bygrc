import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  brand: string;
  rating: number;
  ratingsCount: number;
  stock: number;
  assured: boolean;
  specs?: Record<string, string>;
  variations?: Record<string, string[]>;
}

export default function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t } = useLanguage();

  const priceSpring = useSpring({
    scale: isHovered ? 1.02 : 1,
    color: isHovered ? 'hsl(190, 70%, 45%)' : '#fff',
    config: { tension: 300, friction: 10 },
  });

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to details
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleCardClick}
      className="bg-surface/80 rounded-2xl overflow-hidden border border-gray-800/80 hover:border-secondary/40 cursor-pointer transition-all duration-300 flex flex-col h-full backdrop-blur-sm"
    >
      {/* Image container */}
      <div className="h-52 overflow-hidden relative bg-black/40 flex items-center justify-center p-4">
        <motion.img
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain rounded-lg"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
        />
        {product.assured && (
          <span className="absolute top-3 left-3 bg-secondary text-background font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(78,205,196,0.3)]">
            {t('assuredOnly').split(' ')[0]}
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute top-3 right-3 bg-primary text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
            {t('soldOut')}
          </span>
        )}
      </div>

      {/* Product info */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Brand & Category */}
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
          {product.brand}
        </div>

        {/* Product Name */}
        <h3 className="text-sm font-bold text-gray-200 line-clamp-2 hover:text-secondary transition-colors leading-snug mb-1.5 h-10">
          {product.name}
        </h3>

        {/* Rating Capsule */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
            {product.rating.toFixed(1)} <span className="ml-0.5">★</span>
          </div>
          <span className="text-[10px] text-gray-500">
            ({product.ratingsCount.toLocaleString('en-IN')})
          </span>
        </div>

        {/* Price Block */}
        <div className="mt-auto pt-3 border-t border-gray-800/40">
          <div className="flex items-baseline gap-2 flex-wrap mb-3">
            <animated.div style={priceSpring} className="text-base font-black tracking-tight text-white">
              ₹{product.price.toLocaleString('en-IN')}
            </animated.div>
            {discount > 0 && (
              <>
                <span className="text-[11px] text-gray-500 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-extrabold text-secondary">
                  ({discount}% OFF)
                </span>
              </>
            )}
          </div>

          {/* Card footer details & Add button */}
          <div className="flex justify-between items-center gap-2">
            <span className="text-[9px] text-gray-400 font-medium">
              {t('freeDelivery')}
            </span>
            {product.stock > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className="bg-primary hover:bg-primary/95 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-colors shadow-[0_0_10px_rgba(244,63,94,0.15)] shrink-0"
              >
                {t('addToCart')}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

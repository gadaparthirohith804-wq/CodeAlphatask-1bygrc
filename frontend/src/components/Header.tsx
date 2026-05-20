import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

export default function Header() {
  const { user, token, logout } = useAuth();
  const { cartCount } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Search state
  const [headerSearch, setHeaderSearch] = useState('');
  const [headerCategory, setHeaderCategory] = useState('all');

  // Address/Location state
  const [address, setAddress] = useState<{ city: string; zip: string; name: string } | null>(null);

  // Fetch address for Deliver to display
  useEffect(() => {
    if (user && token) {
      axios.get('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const primary = data[0];
          setAddress({
            city: primary.city,
            zip: primary.zip,
            name: primary.name.split(' ')[0] // Just first name to keep UI clean
          });
        } else {
          setAddress(null);
        }
      })
      .catch(() => setAddress(null));
    } else {
      setAddress(null);
    }
  }, [user, token]);

  const [springProps, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 10 },
  }));

  const handleLogout = () => {
    api.start({ scale: 0.9 });
    setTimeout(() => {
      api.start({ scale: 1 });
      logout();
      setIsMenuOpen(false);
      navigate('/');
    }, 150);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (headerSearch) params.set('q', headerSearch);
    if (headerCategory !== 'all') params.set('category', headerCategory);
    navigate(`/catalog?${params.toString()}`);
  };

  const subCategories = [
    { label: `${t('catalog')} ⚡`, path: '/catalog?category=all' },
    { label: 'Mobiles 📱', path: '/catalog?category=Mobiles' },
    { label: 'Laptops 💻', path: '/catalog?category=Laptops' },
    { label: 'Audio 🎧', path: '/catalog?category=Audio' },
    { label: 'Wearables ⌚', path: '/catalog?category=Wearables' },
    { label: 'Home 🏠', path: '/catalog?category=Home%20%26%20Kitchen' },
    { label: 'Sports 🏋️', path: '/catalog?category=Sports%20%26%20Fitness' },
    { label: 'Fashion 👕', path: '/catalog?category=Fashion' },
    { label: 'Groceries 🍞', path: '/catalog?category=Groceries' },
    { label: 'Books 📚', path: '/catalog?category=Books' },
  ];

  return (
    <header className="bg-surface/95 fixed w-full top-0 z-50 backdrop-blur-md border-b border-gray-800/80 shadow-lg">
      
      {/* ROW 1: Main Header bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left: Brand logo & Deliver Location widget */}
        <div className="flex items-center gap-6 shrink-0">
          <Link
            to="/"
            className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-secondary tracking-widest flex items-center gap-1.5"
          >
            <span>AETHERIA</span>
            <span className="text-[10px] bg-secondary/15 text-secondary border border-secondary/35 font-bold px-1.5 py-0.5 rounded uppercase tracking-normal">
              Tech
            </span>
          </Link>

          {/* Amazon-style Location selector */}
          <div className="hidden md:flex items-center gap-1.5 cursor-pointer hover:border-gray-700 border border-transparent px-2 py-1 rounded transition-all">
            <span className="text-secondary text-sm">📍</span>
            <div className="text-left leading-none">
              <span className="text-[9px] text-gray-500 block">
                {address ? `${t('deliverTo')} ${address.name}` : t('deliverTo')}
              </span>
              <span className="text-[11px] font-extrabold text-gray-200">
                {address ? `${address.city} ${address.zip}` : 'India'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Flipkart-style Search Bar */}
        <form 
          onSubmit={handleSearchSubmit} 
          className="flex-grow max-w-xl mx-2 md:mx-4 flex items-center bg-background border border-gray-850 rounded-xl overflow-hidden focus-within:border-secondary transition-all"
        >
          <select
            value={headerCategory}
            onChange={(e) => setHeaderCategory(e.target.value)}
            className="bg-surface text-gray-400 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 outline-none border-r border-gray-800 cursor-pointer hover:text-white transition-colors"
          >
            <option value="all">All</option>
            <option value="Mobiles">Mobiles</option>
            <option value="Laptops">Laptops</option>
            <option value="Audio">Audio</option>
            <option value="Wearables">Wearables</option>
            <option value="Home & Kitchen">Home</option>
            <option value="Fashion">Fashion</option>
          </select>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            className="flex-grow bg-transparent text-xs text-white px-3.5 py-2.5 outline-none placeholder-gray-500"
          />
          <button 
            type="submit" 
            className="bg-secondary text-background hover:brightness-105 px-4.5 py-2.5 flex items-center justify-center font-bold text-xs"
          >
            🔍
          </button>
        </form>

        {/* Right: Nav items */}
        <div className="flex gap-4 md:gap-6 items-center shrink-0">
          <Link 
            to="/catalog" 
            className="text-xs font-bold text-gray-300 hover:text-white uppercase tracking-wider hidden sm:block transition-colors"
          >
            {t('catalog')}
          </Link>
          
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => {
                setIsLangOpen(!isLangOpen);
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-1.5 hover:text-secondary text-gray-300 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer select-none"
            >
              <span>🌐</span>
              <span>{language}</span>
              <motion.span animate={{ rotate: isLangOpen ? 180 : 0 }} className="text-[8px]">▼</motion.span>
            </button>
            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-36 bg-surface border border-gray-800 rounded-xl shadow-2xl py-1 z-50 backdrop-blur-md"
                >
                  {[
                    { code: 'EN', label: 'English (EN)' },
                    { code: 'HI', label: 'हिन्दी (HI)' },
                    { code: 'TE', label: 'తెలుగు (TE)' },
                    { code: 'TA', label: 'தமிழ் (TA)' },
                    { code: 'KN', label: 'ಕನ್ನಡ (KN)' }
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLanguage(item.code as any);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-background cursor-pointer transition-colors ${
                        language === item.code ? 'text-secondary bg-secondary/5' : 'text-gray-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Cart item with count badge */}
          <Link 
            to="/cart" 
            className="hover:text-secondary text-gray-300 transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <span>{t('cart')}</span>
            {cartCount > 0 ? (
              <motion.span
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="bg-primary text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              >
                {cartCount}
              </motion.span>
            ) : (
              <span className="text-[11px] text-gray-500">🛒</span>
            )}
          </Link>
          
          {/* User profile / login panel */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setIsLangOpen(false);
                }}
                className="flex items-center gap-1.5 hover:text-secondary text-gray-300 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                <span className="hidden md:inline">{user.name.split(' ')[0]}</span>
                <span className="md:hidden">👤</span>
                <motion.span animate={{ rotate: isMenuOpen ? 180 : 0 }} className="text-[8px]">▼</motion.span>
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-44 bg-surface border border-gray-800 rounded-xl shadow-2xl py-1.5 backdrop-blur-md"
                  >
                    <Link 
                      to="/profile" 
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-background text-xs font-semibold text-gray-300 hover:text-white"
                    >
                      {t('profile')}
                    </Link>
                    <Link 
                      to="/profile" 
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-background text-xs font-semibold text-gray-300 hover:text-white"
                    >
                      {t('orders')}
                    </Link>
                    <hr className="border-gray-800 my-1" />
                    <animated.button
                      style={springProps}
                      onMouseDown={() => api.start({ scale: 0.95 })}
                      onMouseUp={() => api.start({ scale: 1 })}
                      onMouseLeave={() => api.start({ scale: 1 })}
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-primary hover:bg-background text-xs font-bold"
                    >
                      {t('signOut')}
                    </animated.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              {t('signIn')}
            </Link>
          )}
        </div>
      </div>

      {/* ROW 2: Flipkart/Amazon style Category sub-navigation ribbon */}
      <div className="bg-background border-t border-gray-950 py-1.5 px-4 overflow-x-auto scrollbar-none shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 md:gap-8 text-[11px] font-bold tracking-wide uppercase whitespace-nowrap px-4">
          {subCategories.map((sub, index) => (
            <Link
              key={index}
              to={sub.path}
              className={`text-gray-400 hover:text-secondary transition-colors ${
                sub.label.includes('Deals') || sub.label.includes('⚡') ? 'text-primary hover:text-primary' : ''
              }`}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

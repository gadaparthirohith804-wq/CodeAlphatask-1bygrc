import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import type { Product } from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debounced.cancel = () => {
    if (timeout !== null) clearTimeout(timeout);
  };
  return debounced;
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('q') || '';

  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState('price-asc');

  // Sync URL search parameters back to state when they change
  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const catParam = searchParams.get('category') || 'all';
    setSearch(qParam);
    setCategory(catParam);
  }, [searchParams]);

  // Sync state to URL search parameters on filter change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.q = search;
    if (category !== 'all') params.category = category;
    setSearchParams(params, { replace: true });
  }, [search, category, setSearchParams]);

  // View state: 'grid' | 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Refinement filter states
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [assuredOnly, setAssuredOnly] = useState(false);
  const [excludeOutOfStock, setExcludeOutOfStock] = useState(false);

  // Active Promo Banner Slide
  const [activeSlide, setActiveSlide] = useState(0);

  const banners = [
    {
      title: "CYBER DEALS WEEK",
      subtitle: "Up to 40% off on Next-Gen Mobiles & Laptops",
      highlight: "Shop Now",
      categoryLink: "Mobiles",
      bgClass: "from-purple-900 via-indigo-900 to-slate-900 border-purple-500/20"
    },
    {
      title: "AETHERIA ASSURED QUALITY",
      subtitle: "100% Tested Devices • Fast Courier Delivery across India",
      highlight: "Explore Assured",
      categoryLink: "all",
      bgClass: "from-teal-900 via-emerald-950 to-slate-900 border-teal-500/20"
    },
    {
      title: "PREMIUM SOUND REVOLUTION",
      subtitle: "Experience audio with 24-bit spatial tracking systems",
      highlight: "Shop Audio",
      categoryLink: "Audio",
      bgClass: "from-rose-950 via-slate-900 to-slate-950 border-rose-500/20"
    }
  ];

  // Auto rotate banners
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Memoized debounced fetch to prevent recreation on every render
  const fetchProducts = useMemo(() => {
    return debounce(async (searchQuery: string, catQuery: string, sortQuery: string) => {
      setLoading(true);
      try {
        const params = {
          q: searchQuery || undefined,
          category: catQuery !== 'all' ? catQuery : undefined,
          sort: sortQuery,
        };
        const { data } = await axios.get<Product[]>('/api/products', { params });
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  // Trigger search/category/sort fetch
  useEffect(() => {
    fetchProducts(search, category, sort);
    return () => fetchProducts.cancel();
  }, [search, category, sort, fetchProducts]);

  // Extract unique brands dynamically from products loaded
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(p => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands);
  }, [products]);

  // Reset refinement filters when main category changes
  useEffect(() => {
    setPriceRange({ min: '', max: '' });
    setSelectedRating(null);
    setSelectedBrands([]);
    setAssuredOnly(false);
    setExcludeOutOfStock(false);
  }, [category]);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // Perform client-side refinement filters on products array
  const refinedProducts = useMemo(() => {
    let result = [...products];

    // Min Price Filter
    if (priceRange.min) {
      const min = parseFloat(priceRange.min);
      if (!isNaN(min)) {
        result = result.filter(p => p.price >= min);
      }
    }

    // Max Price Filter
    if (priceRange.max) {
      const max = parseFloat(priceRange.max);
      if (!isNaN(max)) {
        result = result.filter(p => p.price <= max);
      }
    }

    // Rating Filter
    if (selectedRating !== null) {
      result = result.filter(p => p.rating >= selectedRating);
    }

    // Brand Filter
    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }

    // Assured Filter
    if (assuredOnly) {
      result = result.filter(p => p.assured);
    }

    // Stock Filter
    if (excludeOutOfStock) {
      result = result.filter(p => p.stock > 0);
    }

    return result;
  }, [products, priceRange, selectedRating, selectedBrands, assuredOnly, excludeOutOfStock]);

  const clearAllFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSelectedRating(null);
    setSelectedBrands([]);
    setAssuredOnly(false);
    setExcludeOutOfStock(false);
    setSearch('');
  };

  const hasActiveFilters = useMemo(() => {
    return (
      priceRange.min !== '' ||
      priceRange.max !== '' ||
      selectedRating !== null ||
      selectedBrands.length > 0 ||
      assuredOnly ||
      excludeOutOfStock ||
      search !== ''
    );
  }, [priceRange, selectedRating, selectedBrands, assuredOnly, excludeOutOfStock, search]);

  const categories = [
    { id: 'all', label: 'All Categories', icon: '🛍️' },
    { id: 'Mobiles', label: 'Mobiles', icon: '📱' },
    { id: 'Laptops', label: 'Laptops', icon: '💻' },
    { id: 'Audio', label: 'Audio', icon: '🎧' },
    { id: 'Wearables', label: 'Wearables', icon: '⌚' },
    { id: 'Home & Kitchen', label: 'Home & Kitchen', icon: '🏠' },
    { id: 'Sports & Fitness', label: 'Sports & Fitness', icon: '🏋️' },
    { id: 'Fashion', label: 'Fashion', icon: '👕' },
    { id: 'Groceries', label: 'Groceries', icon: '🍞' },
    { id: 'Beauty & Grooming', label: 'Beauty & Grooming', icon: '💄' },
    { id: 'Toys & Games', label: 'Toys & Games', icon: '🎮' },
    { id: 'Books', label: 'Books', icon: '📚' }
  ];

  return (
    <div className="pt-28 pb-16 px-4 md:px-8 max-w-7xl mx-auto min-h-screen bg-background text-gray-100">
      
      {/* 1. Promotional Deals Banner (Amazon/Flipkart Carousel style) */}
      <div className="relative rounded-3xl overflow-hidden mb-10 h-40 md:h-56 border border-gray-800 shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className={`w-full h-full bg-gradient-to-r ${banners[activeSlide].bgClass} p-6 md:p-10 flex flex-col justify-center border-b`}
          >
            <div className="max-w-xl">
              <span className="text-[9px] md:text-xs font-black bg-primary/25 border border-primary/40 text-primary px-3 py-1 rounded-full uppercase tracking-widest">
                Promotional Node
              </span>
              <h2 className="text-xl md:text-3xl font-black text-white mt-2 leading-tight">
                {banners[activeSlide].title}
              </h2>
              <p className="text-xs md:text-sm text-gray-300 mt-1 md:mt-2 line-clamp-1">
                {banners[activeSlide].subtitle}
              </p>
              <button
                onClick={() => setCategory(banners[activeSlide].categoryLink)}
                className="mt-3 md:mt-4 bg-white text-black font-extrabold text-[10px] uppercase tracking-wider py-1.5 px-4 rounded-xl hover:bg-secondary hover:text-background transition-all"
              >
                {banners[activeSlide].highlight} &rarr;
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel indicators */}
        <div className="absolute bottom-4 right-6 flex gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                activeSlide === idx ? 'bg-secondary w-6' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* 2. Left Filters Sidebar (Amazon/Flipkart Sidebar filters) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface/60 border border-gray-800/80 p-5 rounded-3xl backdrop-blur-sm sticky top-28 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
              <h3 className="font-bold text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <span>⚡</span> {t('refineNode')}
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[10px] font-extrabold text-secondary hover:underline uppercase tracking-wider"
                >
                  {t('clearAll')}
                </button>
              )}
            </div>

            {/* Categories Selection List */}
            <div className="space-y-2">
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                {t('categories')}
              </span>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                      category === cat.id
                        ? 'bg-secondary/15 text-secondary font-bold border border-secondary/20 shadow-[0_0_15px_rgba(78,205,196,0.1)]'
                        : 'text-gray-400 hover:bg-surface hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.id === 'all' ? t('allCategories') : cat.label}</span>
                    </span>
                    {category === cat.id && <span className="text-[10px]">●</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Ranges */}
            <div className="space-y-3 pt-4 border-t border-gray-800/40">
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {t('priceBudget')} (₹)
              </span>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full bg-background border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-secondary"
                />
                <span className="text-gray-600 text-xs">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full bg-background border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-secondary"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: "Under 5K", min: "0", max: "5000" },
                  { label: "5K-20K", min: "5000", max: "20000" },
                  { label: "20K-50K", min: "20000", max: "50000" },
                  { label: "50K+", min: "50000", max: "" }
                ].map((range) => (
                  <button
                    key={range.label}
                    onClick={() => setPriceRange({ min: range.min, max: range.max })}
                    className="text-[9px] font-extrabold uppercase px-2 py-1 rounded bg-background hover:bg-secondary/15 hover:text-secondary border border-gray-800 transition-all"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands Selection */}
            {availableBrands.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-gray-800/40">
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  {t('brandsFilter')}
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                  {availableBrands.map((brand) => (
                    <label key={brand} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandToggle(brand)}
                        className="accent-secondary h-3.5 w-3.5 rounded border-gray-800 bg-background"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Ratings */}
            <div className="space-y-2 pt-4 border-t border-gray-800/40">
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {t('customerRating')}
              </span>
              <div className="space-y-1.5">
                {[4, 3, 2].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedRating(selectedRating === num ? null : num)}
                    className={`w-full text-left text-xs flex items-center gap-1.5 transition-all ${
                      selectedRating === num ? 'text-secondary font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center text-accent">
                      {'★'.repeat(num)}
                      {'☆'.repeat(5 - num)}
                    </span>
                    <span className="text-[10px] text-gray-500">& Up</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle badges (Stock/Assured) */}
            <div className="space-y-2.5 pt-4 border-t border-gray-800/40">
              <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={assuredOnly}
                  onChange={(e) => setAssuredOnly(e.target.checked)}
                  className="accent-secondary h-3.5 w-3.5 rounded border-gray-800 bg-background"
                />
                <span className="flex items-center gap-1">
                  🛡️ <strong className="text-secondary">{t('assuredOnly')}</strong>
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeOutOfStock}
                  onChange={(e) => setExcludeOutOfStock(e.target.checked)}
                  className="accent-secondary h-3.5 w-3.5 rounded border-gray-800 bg-background"
                />
                <span>{t('excludeOutOfStock')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* 3. Right Product Listings Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Toolbar and Settings */}
          <div className="bg-surface/50 border border-gray-800/80 p-4 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 backdrop-blur-sm">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-secondary"
              />
              <span className="absolute left-3.5 top-2.5 text-gray-500 text-xs">🔍</span>
            </div>

            {/* Grid vs List toggling & sorting */}
            <div className="flex gap-4 items-center w-full md:w-auto justify-end">
              {/* Toggles */}
              <div className="flex bg-background p-1 rounded-xl border border-gray-800 shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'grid' ? 'bg-secondary text-background font-bold' : 'text-gray-400'
                  }`}
                  title="Grid view"
                >
                  {t('grid')}
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'list' ? 'bg-secondary text-background font-bold' : 'text-gray-400'
                  }`}
                  title="List view"
                >
                  {t('list')}
                </button>
              </div>

              {/* Sorting options */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-background border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-secondary cursor-pointer shrink-0"
              >
                <option value="price-asc">{t('priceLowHigh')}</option>
                <option value="price-desc">{t('priceHighLow')}</option>
                <option value="rating">{t('topRated')}</option>
              </select>
            </div>
          </div>

          {/* Active pills summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest mr-1">
                {t('refinements')}:
              </span>
              {search && (
                <span className="bg-surface border border-gray-800 text-[10px] text-gray-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  {t('searchPlaceholder').split('...')[0]}: "{search}"
                  <button onClick={() => setSearch('')} className="text-secondary font-black hover:text-white">×</button>
                </span>
              )}
              {(priceRange.min || priceRange.max) && (
                <span className="bg-surface border border-gray-800 text-[10px] text-gray-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  ₹{priceRange.min || '0'} - ₹{priceRange.max || '∞'}
                  <button onClick={() => setPriceRange({ min: '', max: '' })} className="text-secondary font-black hover:text-white">×</button>
                </span>
              )}
              {selectedRating && (
                <span className="bg-surface border border-gray-800 text-[10px] text-gray-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  {selectedRating}★ & Up
                  <button onClick={() => setSelectedRating(null)} className="text-secondary font-black hover:text-white">×</button>
                </span>
              )}
              {selectedBrands.map(brand => (
                <span key={brand} className="bg-surface border border-gray-800 text-[10px] text-gray-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  {brand}
                  <button onClick={() => handleBrandToggle(brand)} className="text-secondary font-black hover:text-white">×</button>
                </span>
              ))}
              {assuredOnly && (
                <span className="bg-surface border border-gray-800 text-[10px] text-gray-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  {t('assuredOnly')}
                  <button onClick={() => setAssuredOnly(false)} className="text-secondary font-black hover:text-white">×</button>
                </span>
              )}
              {excludeOutOfStock && (
                <span className="bg-surface border border-gray-800 text-[10px] text-gray-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  {t('excludeOutOfStock')}
                  <button onClick={() => setExcludeOutOfStock(false)} className="text-secondary font-black hover:text-white">×</button>
                </span>
              )}
            </div>
          )}

          {/* Results statement */}
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>
              {t('showing')} {refinedProducts.length} {t('of')} {products.length} {t('products')}
            </span>
          </div>

          {/* Product grid / list display */}
          {loading ? (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`bg-surface/50 border border-gray-800/60 rounded-3xl animate-pulse ${
                    viewMode === 'grid' ? 'h-96' : 'h-48'
                  }`}
                />
              ))}
            </div>
          ) : refinedProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-surface/30 border border-gray-800/80 rounded-3xl p-6"
            >
              <span className="text-4xl">🤖</span>
              <h3 className="text-lg font-bold text-gray-300 mt-4">No Products Match Your Refinement Matrix</h3>
              <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
                No items match the filters you have configured. Try removing active filters or tweaking your budget coordinates.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-6 bg-secondary text-background font-extrabold text-xs uppercase tracking-wider py-2 px-6 rounded-xl hover:brightness-110 transition-all"
              >
                Reset Catalog Filters
              </button>
            </motion.div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW (Standard Card displays) */
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {refinedProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* LIST VIEW (Amazon/Flipkart search row details style) */
            <div className="space-y-5">
              {refinedProducts.map((product) => {
                const discount = product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-surface/50 border border-gray-800/80 rounded-3xl p-5 hover:border-secondary/40 transition-all duration-300 flex flex-col md:flex-row gap-6 relative group"
                  >
                    {/* Left: Product Image */}
                    <div className="w-full md:w-48 h-48 bg-black/40 rounded-2xl flex items-center justify-center shrink-0 p-3 relative">
                      <Link to={`/product/${product.id}`} className="w-full h-full flex items-center justify-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain rounded-xl transition-all duration-300 group-hover:scale-105"
                        />
                      </Link>
                      {product.assured && (
                        <span className="absolute top-3 left-3 bg-secondary text-background font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Assured
                        </span>
                      )}
                    </div>

                    {/* Center: Specifications & Details */}
                    <div className="flex-grow flex flex-col">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                        {product.brand} • {product.category}
                      </div>
                      
                      <Link to={`/product/${product.id}`} className="hover:text-secondary transition-colors">
                        <h3 className="text-base font-black text-white leading-tight">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Ratings */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex items-center bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {product.rating.toFixed(1)} ★
                        </div>
                        <span className="text-[10px] text-gray-500">
                          ({product.ratingsCount.toLocaleString('en-IN')} global ratings)
                        </span>
                      </div>

                      {/* Bullet Specs preview */}
                      {product.specs && Object.keys(product.specs).length > 0 && (
                        <ul className="mt-3.5 space-y-1 text-[11px] text-gray-400">
                          {Object.entries(product.specs).slice(0, 3).map(([key, val]) => (
                            <li key={key} className="flex gap-1.5">
                              <span className="text-secondary font-black">•</span>
                              <span><strong>{key}:</strong> {val}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <p className="text-xs text-gray-500 line-clamp-2 mt-3 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Right: Pricing & Cart actions */}
                    <div className="w-full md:w-48 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-800/80 pt-4 md:pt-0 md:pl-6 shrink-0 text-right md:text-left">
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-end md:justify-start gap-2">
                          <span className="text-xl font-black text-white">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                          {discount > 0 && (
                            <span className="text-xs text-secondary font-extrabold bg-secondary/15 px-1.5 py-0.5 rounded">
                              {discount}% OFF
                            </span>
                          )}
                        </div>
                        {discount > 0 && (
                          <div className="text-[10px] text-gray-500">
                            M.R.P: <span className="line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-gray-400 font-medium pt-1">
                          Free Courier Delivery
                        </div>
                        {product.stock <= 3 && product.stock > 0 && (
                          <div className="text-[10px] text-primary font-bold uppercase mt-1">
                            Only {product.stock} items left!
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col gap-2 mt-6 justify-end md:justify-start">
                        <Link
                          to={`/product/${product.id}`}
                          className="flex-1 text-center bg-surface border border-gray-800 text-gray-300 font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider hover:bg-surface/80"
                        >
                          View Specs
                        </Link>
                        {product.stock > 0 ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              addToCart({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image,
                              });
                            }}
                            className="flex-1 bg-primary hover:bg-primary/95 text-white font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider shadow-[0_0_10px_rgba(244,63,94,0.1)] transition-all"
                          >
                            Add to Cart
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex-1 bg-gray-900 border border-gray-800 text-gray-600 font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider cursor-not-allowed"
                          >
                            Sold Out
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

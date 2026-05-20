import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../contexts/LanguageContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const dummyProducts = [
    {
      id: 1,
      name: 'Cyberpunk Leather Jacket (Neon-Infused)',
      description: 'A neon-infused jacket designed for the modern netrunner. Water-resistant with premium dynamic RGB LED piping.',
      price: 14999,
      originalPrice: 19999,
      image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&q=80',
      brand: 'Aetheria Wear',
      category: 'Fashion',
      rating: 4.6,
      ratingsCount: 231,
      stock: 12,
      assured: true
    },
    {
      id: 2,
      name: 'Neural Audio Buds Pro (Active Noise Isolation)',
      description: 'Direct brain-to-computer link, latest generation audio transducers with adaptive spatial sound mapping.',
      price: 4999,
      originalPrice: 7999,
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80',
      brand: 'boAt',
      category: 'Audio',
      rating: 4.4,
      ratingsCount: 1542,
      stock: 45,
      assured: true
    },
    {
      id: 3,
      name: 'Anti-Gravity Hoverboard X1 (LED Underglow)',
      description: 'Anti-gravity magnetic suspension board with custom neon programmable LED underglow and remote control.',
      price: 34999,
      originalPrice: 44999,
      image: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=500&q=80',
      brand: 'HoverTech',
      category: 'Sports & Fitness',
      rating: 4.8,
      ratingsCount: 89,
      stock: 5,
      assured: false
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="pt-28 pb-12 px-6 max-w-7xl mx-auto">
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center py-20 bg-gradient-to-br from-surface to-background rounded-3xl border border-gray-800 shadow-2xl mb-16 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-primary opacity-5 blur-3xl"></div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary relative z-10">
          {t('welcome')}
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto relative z-10">
          {t('subWelcome')}
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/catalog')}
          className="bg-secondary text-background px-8 py-3 rounded-full text-lg font-bold shadow-[0_0_15px_rgba(78,205,196,0.5)] relative z-10 cursor-pointer"
        >
          {t('exploreCatalog')}
        </motion.button>
      </motion.section>

      <section>
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <span className="w-8 h-1 bg-primary rounded-full"></span>
          {t('featuredProducts')}
        </h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {dummyProducts.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}

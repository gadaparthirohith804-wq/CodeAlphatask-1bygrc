import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSpring, animated } from '@react-spring/web';
import { motion } from 'framer-motion';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  variation?: string;
}

interface Order {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  items: OrderItem[];
}

const ProfilePage: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Spring animation for the logout button
  const logoutSpring = useSpring({
    from: { scale: 1 },
    to: { scale: 1.02 },
    config: { tension: 300, friction: 12 },
    reset: true,
    reverse: true,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, navigate, token]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'out for delivery':
        return 'bg-secondary/15 text-secondary border-secondary/30';
      case 'shipped':
      case 'packed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-gray-100 pt-28 pb-16 px-4 md:px-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 flex items-center gap-3">
        <span className="w-8 h-1 bg-primary rounded-full"></span>
        Identity Hub
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* User Account Info Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary"></div>
          
          <div className="flex flex-col items-center text-center pb-6 border-b border-gray-800/60 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-3xl font-black text-white shadow-[0_0_15px_rgba(244,63,94,0.3)] mb-4">
              {user?.name.slice(0, 2).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-semibold uppercase">Authorized Role</span>
              <span className="text-secondary font-bold uppercase tracking-wider">Level 1 Netrunner</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-semibold uppercase">Total Order Nodes</span>
              <span className="text-gray-200 font-mono font-bold">{orders.length} Nodes</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800/60">
            <animated.button
              style={logoutSpring}
              onClick={handleLogout}
              className="w-full py-2.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              Sign Out Session
            </animated.button>
          </div>
        </motion.div>

        {/* Order History List Panel */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🗂️</span> Sync Order Nodes
          </h2>

          {orders.length === 0 ? (
            <div className="bg-surface/30 border border-gray-800/50 rounded-3xl p-8 text-center">
              <p className="text-sm text-gray-500 italic">No order nodes synced yet.</p>
              <Link
                to="/catalog"
                className="inline-block mt-4 bg-secondary text-background font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:brightness-110"
              >
                Initiate Catalog Sync
              </Link>
            </div>
          ) : (
            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  className="bg-surface/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between"
                  variants={itemVariants}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-800/40 mb-4">
                    <div>
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Order Node</span>
                      <span className="text-sm font-mono font-black text-gray-200 mt-0.5 block">{order.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border rounded-full ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Order items preview */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id + (item.variation || '')} className="flex justify-between items-center text-xs">
                        <div className="text-gray-300">
                          <span>{item.name}</span>
                          {item.variation && (
                            <span className="text-[9px] text-secondary font-bold uppercase tracking-widest bg-secondary/10 px-1.5 py-0.5 rounded ml-2">
                              {item.variation}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500 font-mono shrink-0 ml-4">
                          {item.quantity} x ₹{item.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-gray-800/40">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-gray-400 font-semibold uppercase">Grand Total:</span>
                      <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        ₹{order.total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <Link
                      to={`/orders/${order.id}`}
                      className="bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider text-center transition-all shadow-[0_0_15px_rgba(78,205,196,0.05)]"
                    >
                      Track Satellite Route
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

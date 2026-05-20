import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', {
        name: form.username,
        email: form.email,
        password: form.password,
      });
      const { user, token } = res.data;
      login(token, user);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Registration failed. Please check fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center px-4 overflow-hidden">
      {/* Dynamic Cyberpunk Auras */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[6s]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8s]"></div>

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Glow border wrapper */}
        <div className="bg-surface/50 border border-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary"></div>

          <div className="text-center mb-8">
            <Link to="/" className="inline-block text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-widest mb-2 uppercase">
              Aetheria
            </Link>
            <h2 className="text-xl font-bold text-gray-200">INITIALIZE INTERFACE</h2>
            <p className="text-sm text-gray-500 mt-1">Configure profile coordinates</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-xl text-center text-sm text-primary font-medium"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Operator Alias (Username)
              </label>
              <input
                type="text"
                name="username"
                required
                value={form.username}
                onChange={handleChange}
                placeholder="cyber_netrunner"
                className="w-full bg-background/60 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/40 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Neural Link (Email)
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="identity@netrunner.net"
                className="w-full bg-background/60 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/40 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Cipher Code (Password)
              </label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full bg-background/60 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/40 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Verify Cipher
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full bg-background/60 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/40 transition-all shadow-inner"
              />
            </div>

            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(78,205,196,0.25)] hover:shadow-[0_0_30px_rgba(78,205,196,0.45)] hover:brightness-110 active:brightness-95 transition-all uppercase tracking-wider text-sm disabled:opacity-50"
              >
                {loading ? 'Compiling Credentials...' : 'Establish Coordinates'}
              </motion.button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800/60 text-center">
            <p className="text-sm text-gray-400">
              Already synced?   {' '}
              <Link to="/login" className="text-secondary hover:text-secondary/80 font-semibold hover:underline transition-colors">
                Authorize Session
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export interface TrackingDetails {
  status: 'Placed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered';
  description: string;
  activeHub: string;
  progress: number;
  elapsedSec: number;
  currentLocation: [number, number];
  warehouseLocation: [number, number];
  destinationLocation: [number, number];
  carrier: string;
  trackingNumber: string;
  weatherCondition: {
    temp: string;
    condition: string;
    delayHours: number;
  };
}

export interface Order {
  id: string;
  userId: number;
  items: Array<{
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
    variation?: string;
  }>;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    phone: string;
  };
  paymentMethod: string;
  status: string;
  createdAt: string;
  tracking?: TrackingDetails;
}

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrackingDetails = async () => {
    if (!token || !id) return;
    try {
      const res = await axios.get<Order>(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
      setError('');
    } catch (err: any) {
      console.error('Failed to load tracking data:', err);
      setError(err?.response?.data?.error || 'Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchTrackingDetails();

      // Poll every 3 seconds for live simulation tracking
      const interval = setInterval(fetchTrackingDetails, 3000);
      return () => clearInterval(interval);
    }
  }, [token, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background pt-32 text-center text-gray-400">
        <h2 className="text-2xl font-bold mb-4">{error || 'Order Not Found'}</h2>
        <Link to="/profile" className="text-secondary hover:underline">View My Profile & Orders</Link>
      </div>
    );
  }

  const tracking = order.tracking;
  const currentProgress = tracking ? tracking.progress : 10;
  const currentStatus = tracking ? tracking.status : 'Placed';

  const steps = [
    { label: 'Placed', icon: '📝', minProgress: 10 },
    { label: 'Packed', icon: '📦', minProgress: 25 },
    { label: 'Shipped', icon: '🚚', minProgress: 50 },
    { label: 'Out for Delivery', icon: '🛵', minProgress: 75 },
    { label: 'Delivered', icon: '🏁', minProgress: 100 },
  ];

  return (
    <div className="min-h-screen bg-background text-gray-100 pt-28 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
            Real-Time Courier Tracking
          </span>
          <h1 className="text-3xl font-black text-white mt-3">
            Satellite Order Link: <span className="text-secondary font-mono text-2xl">{order.id}</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Registered on Node: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Link
          to="/profile"
          className="border border-gray-800 hover:bg-surface font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all"
        >
          ← Return to Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns (2): Live Map & Stepper */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SATELLITE RADAR VISUALIZATION */}
          <div className="bg-surface/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
            {/* Top scanning animation line */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-secondary to-transparent animate-[pulse_2s_infinite]"></div>
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                </span>
                LIVE Satellite Routing Map
              </h3>
              {tracking && (
                <div className="text-[10px] font-mono text-gray-500">
                  Drone Lat: {tracking.currentLocation[0].toFixed(5)} Lng: {tracking.currentLocation[1].toFixed(5)}
                </div>
              )}
            </div>

            {/* Custom Interactive Vector Map */}
            <div className="h-64 md:h-80 bg-black/40 rounded-2xl border border-gray-800 relative overflow-hidden flex items-center justify-center select-none">
              
              {/* Tactical grid background overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px]"></div>
              
              <svg className="w-full h-full absolute inset-0 p-8" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Dotted route path */}
                <line
                  x1="50"
                  y1="100"
                  x2="450"
                  y2="100"
                  stroke="#374151"
                  strokeWidth="2"
                  strokeDasharray="4 6"
                />
                
                {/* Active progress path */}
                <line
                  x1="50"
                  y1="100"
                  x2={50 + (400 * currentProgress) / 100}
                  y2="100"
                  stroke="hsl(190, 70%, 45%)"
                  strokeWidth="2.5"
                  className="transition-all duration-1000"
                />

                {/* Warehouse Dot */}
                <circle cx="50" cy="100" r="6" fill="#f43f5e" className="shadow-lg" />
                <text x="35" y="80" fill="#a1a1aa" fontSize="9" fontWeight="bold">TOKYO FACILITY</text>

                {/* Destination Dot */}
                <circle cx="450" cy="100" r="6" fill="#10b981" />
                <text x="410" y="80" fill="#a1a1aa" fontSize="9" fontWeight="bold">DESTINATION</text>

                {/* Courier pulsing marker */}
                {currentProgress < 100 ? (
                  <g transform={`translate(${50 + (400 * currentProgress) / 100}, 100)`} className="transition-all duration-1000">
                    <circle cx="0" cy="0" r="14" fill="rgba(78, 205, 196, 0.15)" className="animate-ping" />
                    <circle cx="0" cy="0" r="7" fill="#4ecdc4" className="shadow-[0_0_10px_#4ecdc4]" />
                  </g>
                ) : (
                  <g transform="translate(450, 100)">
                    <circle cx="0" cy="0" r="14" fill="rgba(16, 185, 129, 0.2)" className="animate-ping" />
                  </g>
                )}
              </svg>

              {/* HUD Telemetry Panels */}
              <div className="absolute bottom-4 left-4 bg-surface/90 border border-gray-800 rounded-xl p-3 text-[10px] space-y-1 font-mono">
                <p className="text-gray-400">Carrier: {tracking?.carrier || 'Express Service'}</p>
                <p className="text-gray-400">Tracking: {tracking?.trackingNumber || 'Pending'}</p>
              </div>

              <div className="absolute top-4 right-4 bg-surface/90 border border-gray-800 rounded-xl p-3 text-[10px] space-y-1 font-mono text-right">
                <p className="text-secondary font-bold">STATUS: {currentStatus}</p>
                <p className="text-gray-400">PROGRESS: {currentProgress}%</p>
              </div>
            </div>
          </div>

          {/* COURIER STATE STEPPER */}
          <div className="bg-surface/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md">
            <div className="relative mb-8 pt-4">
              {/* Stepper bar */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-800 -translate-y-1/2 z-0"></div>
              <div
                className="absolute top-1/2 left-0 h-0.5 bg-secondary -translate-y-1/2 z-0 transition-all duration-1000"
                style={{ width: `${currentProgress}%` }}
              ></div>

              <div className="flex justify-between items-center relative z-10">
                {steps.map((st) => {
                  const isActive = currentProgress >= st.minProgress;
                  return (
                    <div key={st.label} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-base border transition-all duration-500 ${
                          isActive
                            ? 'bg-secondary border-secondary text-background font-black shadow-[0_0_15px_rgba(78,205,196,0.4)]'
                            : 'bg-surface border-gray-800 text-gray-500'
                        }`}
                      >
                        {st.icon}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider mt-3 transition-colors duration-500 ${
                          isActive ? 'text-gray-200' : 'text-gray-600'
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated Live description */}
            <div className="bg-background/40 border border-gray-800/60 p-4 rounded-2xl flex items-start gap-4">
              <span className="text-2xl mt-0.5">ℹ️</span>
              <div>
                <h4 className="font-bold text-sm text-gray-200">{tracking?.activeHub || 'Tokyo Hub'}</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{tracking?.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Weather conditions & Order Package breakdown */}
        <div className="space-y-6">
          {/* Simulated Weather Module */}
          {tracking?.weatherCondition && (
            <div className="bg-surface/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <span>🌦️</span> Atmospheric Telemetry
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/40 border border-gray-800/60 p-3 rounded-xl text-center">
                  <span className="block text-[10px] text-gray-500 uppercase font-semibold">Temperature</span>
                  <span className="text-lg font-bold text-gray-200 mt-1 block">{tracking.weatherCondition.temp}</span>
                </div>
                <div className="bg-background/40 border border-gray-800/60 p-3 rounded-xl text-center">
                  <span className="block text-[10px] text-gray-500 uppercase font-semibold">Condition</span>
                  <span className="text-xs font-bold text-secondary mt-1.5 block truncate">{tracking.weatherCondition.condition}</span>
                </div>
              </div>
              {tracking.weatherCondition.delayHours > 0 && (
                <div className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 p-2.5 rounded-xl text-center">
                  ⚠️ Environment Delay: +{tracking.weatherCondition.delayHours} Hours Estimated
                </div>
              )}
            </div>
          )}

          {/* Package summary breakdown */}
          <div className="bg-surface/80 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 pb-3 border-b border-gray-800">
              Package Inventory
            </h3>
            
            <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
              {order.items.map((item) => (
                <div key={item.id + (item.variation || '')} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-gray-300 block">{item.name}</span>
                    {item.variation && (
                      <span className="text-[9px] text-secondary font-bold uppercase mt-0.5 block">{item.variation}</span>
                    )}
                  </div>
                  <span className="font-mono text-gray-500 shrink-0 ml-4">
                    {item.quantity} x ₹{item.price.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-800 pt-4 flex justify-between items-baseline text-sm">
              <span className="font-bold text-gray-400">Total Charged</span>
              <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                ₹{order.total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Destination Delivery address book */}
          <div className="bg-surface/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Destination Coordinate</h3>
            <div className="text-xs text-gray-300 space-y-1 pt-2">
              <p className="font-bold text-white">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.zip}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="text-gray-500 font-semibold mt-1">📞 {order.shippingAddress.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;

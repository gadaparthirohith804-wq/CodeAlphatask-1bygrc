const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
let PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'aetheria-super-secret-key-2026';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// Config Endpoint - Exposes key configurations and tells front-end if live/mock integrations are running
app.get('/api/config', (req, res) => {
  res.json({
    googleMapsActive: !!process.env.GOOGLE_MAPS_API_KEY,
    weatherActive: !!process.env.WEATHER_API_KEY,
    stripeActive: !!process.env.STRIPE_SECRET_KEY,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_aetheria_default_51P123XYZ',
    googleMapsPublicKey: process.env.GOOGLE_MAPS_PUBLIC_KEY || ''
  });
});

// --- Authentication Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.createUser({
      name,
      email,
      password: hashedPassword
    });

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
  } catch (err) {
    console.error('Registration error details:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error retrieving profile.' });
  }
});

// --- Address Book Routes ---
app.get('/api/addresses', authenticateToken, async (req, res) => {
  try {
    const addresses = await db.getAddresses(req.user.id);
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve addresses.' });
  }
});

app.post('/api/addresses', authenticateToken, async (req, res) => {
  try {
    const { title, name, address, city, zip, country, phone } = req.body;
    if (!address || !city || !zip) {
      return res.status(400).json({ error: 'Address details, city, and zip code are required.' });
    }
    const newAddress = await db.addAddress(req.user.id, { title, name, address, city, zip, country, phone });
    res.status(201).json(newAddress);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to save address.' });
  }
});

app.delete('/api/addresses/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await db.deleteAddress(req.user.id, req.params.id);
    if (deleted) {
      res.json({ message: 'Address deleted successfully' });
    } else {
      res.status(404).json({ error: 'Address not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete address.' });
  }
});

// --- Product Catalog Routes ---
app.get('/api/products', async (req, res) => {
  try {
    let products = await db.getProducts();

    // Search filter
    if (req.query.q) {
      const q = req.query.q.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      products = products.filter(p => p.category.toLowerCase() === req.query.category.toLowerCase());
    }

    // Sorting
    if (req.query.sort) {
      if (req.query.sort === 'price-asc') {
        products.sort((a, b) => a.price - b.price);
      } else if (req.query.sort === 'price-desc') {
        products.sort((a, b) => b.price - a.price);
      } else if (req.query.sort === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
      }
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve product details.' });
  }
});

// --- Product Review Routes ---
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const reviews = await db.getProductReviews(parseInt(req.params.id));
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load reviews.' });
  }
});

app.post('/api/products/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = parseInt(req.params.id);
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1 to 5 stars) is required.' });
    }

    const user = await db.getUserById(req.user.id);
    const review = await db.addProductReview(productId, {
      name: user ? user.name : 'Anonymous Buyer',
      rating,
      comment
    });
    
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save review.' });
  }
});

// --- Shipping & Weather Integration Estimates ---
app.post('/api/shipping/estimate', async (req, res) => {
  try {
    const { zip, city, country } = req.body;
    if (!zip) {
      return res.status(400).json({ error: 'ZIP / Postal Code is required.' });
    }

    // Dynamic weather querying: If WEATHER_API_KEY env is set, use it. Otherwise call realistic simulation
    let weather = { temp: '20°C', condition: 'Clear Skies', delayHours: 0 };
    
    if (process.env.WEATHER_API_KEY) {
      try {
        const query = encodeURIComponent(`${city || 'Tokyo'},${country || 'Japan'}`);
        // Fetch weather from OpenWeatherMap API
        const fetch = require('node-fetch'); // Standard utility
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${process.env.WEATHER_API_KEY}`);
        if (weatherRes.ok) {
          const wData = await weatherRes.json();
          const temp = `${Math.round(wData.main.temp)}°C`;
          const cond = wData.weather[0].main;
          let delay = 0;
          if (cond.includes('Rain') || cond.includes('Drizzle')) delay = 1.0;
          if (cond.includes('Thunderstorm') || cond.includes('Snow')) delay = 3.0;
          weather = { temp, condition: cond, delayHours: delay };
        }
      } catch (err) {
        console.warn('Weather API connection failed, falling back to mock weather simulation.');
      }
    } else {
      // Mock Weather patterns depending on city name length or letters
      const code = zip.charCodeAt(0) || 65;
      if (code % 3 === 0) {
        weather = { temp: '14°C', condition: 'Overcast Rain', delayHours: 1.0 };
      } else if (code % 3 === 1) {
        weather = { temp: '6°C', condition: 'Moderate Snowstorm', delayHours: 4.0 };
      }
    }

    // Distance calculation: Bangalore Logistics Hub (origin) to user location
    let distanceKm = 15; // default local
    const cityLower = (city || '').toLowerCase();
    if (cityLower.includes('bangalore') || cityLower.includes('bengaluru')) {
      distanceKm = 12;
    } else if (cityLower.includes('khammam')) {
      distanceKm = 530;
    } else if (cityLower.includes('mumbai')) {
      distanceKm = 980;
    } else if (cityLower.includes('delhi')) {
      distanceKm = 2060;
    } else if (cityLower.includes('hyderabad')) {
      distanceKm = 570;
    } else {
      const codeVal = parseInt(zip.replace(/\D/g, '')) || 560001;
      distanceKm = Math.max(15, (codeVal % 1200) + 50);
    }

    const shippingCharge = distanceKm > 100 ? Math.round(150 + (distanceKm * 0.15)) : 0;
    const baseDays = Math.ceil(distanceKm / 600);
    const totalDays = Math.max(1, baseDays + Math.ceil(weather.delayHours / 24));
    
    // Estimate delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + totalDays);

    res.json({
      estimatedDays: totalDays,
      estimatedDate: deliveryDate.toISOString(),
      distanceKm: parseFloat(distanceKm.toFixed(1)),
      shippingCharge,
      weather
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate shipping metrics.' });
  }
});

// --- Secure Payments (Stripe) Routes ---
app.post('/api/payment/charge', async (req, res) => {
  try {
    const { token, amount, paymentMethod, currency } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Transaction amount is required.' });
    }

    // Stripe Integration: If STRIPE_SECRET_KEY is set, make standard Stripe charge
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // Create charge
        const charge = await stripe.charges.create({
          amount: Math.round(amount * 100), // in paisa (100 paisa = 1 Rupee)
          currency: currency || 'inr',
          source: token || 'tok_visa', // card token
          description: `Aetheria secure transaction: Charge for ₹${amount}`
        });
        return res.json({
          success: true,
          transactionId: charge.id,
          receiptUrl: charge.receipt_url,
          gateway: 'Stripe API Gateway'
        });
      } catch (err) {
        return res.status(400).json({ error: `Stripe Authorization Failed: ${err.message}` });
      }
    }

    // Mock Stripe response (Fallback)
    res.json({
      success: true,
      transactionId: 'ch_' + Math.random().toString(36).substr(2, 24).toUpperCase(),
      receiptUrl: 'https://stripe.com/receipts/mock-aetheria-transaction',
      gateway: 'Stripe Sandbox (Mock)'
    });
  } catch (err) {
    res.status(500).json({ error: 'Payment authorization failed.' });
  }
});

// --- Checkout & Orders Routes ---
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in order payload.' });
    }

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.zip) {
      return res.status(400).json({ error: 'Incomplete shipping delivery details.' });
    }

    // Place order
    const newOrder = await db.createOrder({
      userId: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      total: items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
    });

    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to place order.' });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const userOrders = await db.getOrdersByUserId(req.user.id);
    // Sort orders by date descending
    userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userOrders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve order history.' });
  }
});

app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this order.' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load order tracker details.' });
  }
});

// Fallback to index.html for single-page routing or static paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server with auto-fallback for occupied ports
const server = require('http').createServer(app);

function startServer(port) {
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[Warning] Port ${PORT} is already occupied. Retrying on port ${PORT + 1}...`);
    PORT++;
    startServer(PORT);
  } else {
    console.error('Server error:', err);
  }
});

startServer(PORT);

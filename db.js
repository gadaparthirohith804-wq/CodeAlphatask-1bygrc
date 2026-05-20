const mysql = require('mysql2/promise');
require('dotenv').config();

class MySQLDatabase {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'aetheria_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  // Helper parser for JSON fields
  parseJson(val) {
    if (val === null || val === undefined) return val;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (err) {
        return val;
      }
    }
    return val;
  }

  // Row formatters to ensure createdAt returns ISO strings matching the client expectations
  formatUser(row) {
    if (!row) return null;
    return {
      ...row,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt
    };
  }

  formatReview(row) {
    if (!row) return null;
    return {
      ...row,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt
    };
  }

  formatOrder(row) {
    if (!row) return null;
    return {
      ...row,
      items: this.parseJson(row.items),
      shippingAddress: this.parseJson(row.shippingAddress),
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt
    };
  }

  async getUsers() {
    const [rows] = await this.pool.execute('SELECT * FROM users');
    const users = [];
    for (const row of rows) {
      const addresses = await this.getAddresses(row.id);
      users.push({ ...this.formatUser(row), addresses });
    }
    return users;
  }

  async getUserById(id) {
    const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const user = this.formatUser(rows[0]);
    const addresses = await this.getAddresses(user.id);
    return { ...user, addresses };
  }

  async getUserByEmail(email) {
    const [rows] = await this.pool.execute('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (rows.length === 0) return null;
    const user = this.formatUser(rows[0]);
    const addresses = await this.getAddresses(user.id);
    return { ...user, addresses };
  }

  async createUser(user) {
    const userId = Date.now();
    const now = new Date();
    await this.pool.execute(
      'INSERT INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, user.name, user.email.toLowerCase(), user.password, 'user', now]
    );

    // Create default address
    const addressId = 'addr-' + Math.random().toString(36).substr(2, 9);
    const defaultAddress = {
      id: addressId,
      title: 'Default Address',
      name: user.name,
      address: '88 Cybernetic Ave, Sector 7',
      city: 'Neo Tokyo',
      zip: '100-0001',
      country: 'Japan',
      phone: '+81 90-1234-5678'
    };
    
    await this.pool.execute(
      'INSERT INTO addresses (id, userId, title, name, address, city, zip, country, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        defaultAddress.id,
        userId,
        defaultAddress.title,
        defaultAddress.name,
        defaultAddress.address,
        defaultAddress.city,
        defaultAddress.zip,
        defaultAddress.country,
        defaultAddress.phone
      ]
    );

    return {
      id: userId,
      name: user.name,
      email: user.email.toLowerCase(),
      role: 'user',
      addresses: [defaultAddress],
      createdAt: now.toISOString()
    };
  }

  async getAddresses(userId) {
    const [rows] = await this.pool.execute('SELECT * FROM addresses WHERE userId = ?', [userId]);
    return rows;
  }

  async addAddress(userId, addressData) {
    const addressId = 'addr-' + Math.random().toString(36).substr(2, 9);
    const user = await this.getUserById(userId);
    const userName = user ? user.name : '';
    
    const newAddress = {
      id: addressId,
      title: addressData.title || 'Other',
      name: addressData.name || userName,
      address: addressData.address,
      city: addressData.city,
      zip: addressData.zip,
      country: addressData.country || 'Japan',
      phone: addressData.phone || ''
    };

    await this.pool.execute(
      'INSERT INTO addresses (id, userId, title, name, address, city, zip, country, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newAddress.id,
        userId,
        newAddress.title,
        newAddress.name,
        newAddress.address,
        newAddress.city,
        newAddress.zip,
        newAddress.country,
        newAddress.phone
      ]
    );

    return newAddress;
  }

  async deleteAddress(userId, addressId) {
    const [result] = await this.pool.execute('DELETE FROM addresses WHERE id = ? AND userId = ?', [addressId, userId]);
    return result.affectedRows > 0;
  }

  async getProducts() {
    // Dynamically calculate rating averages from reviews
    const [rows] = await this.pool.execute(`
      SELECT p.*, 
             COALESCE(
               (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.productId = p.id),
               p.rating
             ) as calculatedRating
      FROM products p
    `);
    
    return rows.map(prod => ({
      ...prod,
      rating: parseFloat(prod.calculatedRating || prod.rating),
      specs: this.parseJson(prod.specs),
      variations: this.parseJson(prod.variations),
      assured: !!prod.assured
    }));
  }

  async getProductById(id) {
    const [rows] = await this.pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const prod = rows[0];
    
    // Recalculate average rating from reviews specifically for this product
    const [ratingRow] = await this.pool.execute('SELECT ROUND(AVG(rating), 1) as avgRating FROM reviews WHERE productId = ?', [id]);
    const calculatedRating = ratingRow[0] && ratingRow[0].avgRating ? parseFloat(ratingRow[0].avgRating) : parseFloat(prod.rating);

    return {
      ...prod,
      rating: calculatedRating,
      specs: this.parseJson(prod.specs),
      variations: this.parseJson(prod.variations),
      assured: !!prod.assured
    };
  }

  async updateProductStock(id, quantityToDeduct) {
    const [result] = await this.pool.execute(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [quantityToDeduct, id, quantityToDeduct]
    );
    return result.affectedRows > 0;
  }

  async getProductReviews(productId) {
    const [rows] = await this.pool.execute('SELECT * FROM reviews WHERE productId = ? ORDER BY createdAt DESC', [productId]);
    return rows.map(r => this.formatReview(r));
  }

  async addProductReview(productId, reviewData) {
    const id = Date.now();
    const now = new Date();
    const newReview = {
      id,
      productId: parseInt(productId),
      name: reviewData.name || 'Anonymous User',
      rating: parseInt(reviewData.rating) || 5,
      comment: reviewData.comment || '',
      createdAt: now.toISOString()
    };

    await this.pool.execute(
      'INSERT INTO reviews (id, productId, name, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [newReview.id, newReview.productId, newReview.name, newReview.rating, newReview.comment, now]
    );

    return newReview;
  }

  async getOrders() {
    const [rows] = await this.pool.execute('SELECT * FROM orders');
    return rows.map(order => this.formatOrder(order));
  }

  async getOrdersByUserId(userId) {
    const [rows] = await this.pool.execute('SELECT * FROM orders WHERE userId = ?', [userId]);
    const orders = rows.map(order => this.formatOrder(order));
    return orders.map(order => this.simulateOrderTracking(order));
  }

  async getOrderById(id) {
    const [rows] = await this.pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const order = this.formatOrder(rows[0]);
    return this.simulateOrderTracking(order);
  }

  simulateOrderTracking(order) {
    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    const elapsedSec = Math.floor(elapsedMs / 1000);
    
    let status = 'Placed';
    let description = 'Order placed successfully. Awaiting dispatch.';
    let activeHub = 'Main Dispatch Warehouse (Neo Tokyo)';
    let progress = 10;
    
    if (elapsedSec >= 120) {
      status = 'Delivered';
      description = 'Package successfully handed over to recipient.';
      activeHub = 'Destination Residence';
      progress = 100;
    } else if (elapsedSec >= 75) {
      status = 'Out for Delivery';
      description = 'Courier agent is currently on route to your location.';
      activeHub = 'Local Distribution Hub';
      progress = 75;
    } else if (elapsedSec >= 40) {
      status = 'Shipped';
      description = 'In transit between facilities.';
      activeHub = 'Regional Sorting Facility';
      progress = 50;
    } else if (elapsedSec >= 15) {
      status = 'Packed';
      description = 'Package sealed and loaded onto courier transport.';
      activeHub = 'Main Dispatch Warehouse (Neo Tokyo)';
      progress = 25;
    }

    const warehouseCoord = [35.6762, 139.6503];
    let destinationCoord = [35.6895, 139.6917]; // Tokyo Gov Building
    
    if (order.shippingAddress && order.shippingAddress.country && order.shippingAddress.country.toLowerCase() === 'india') {
      destinationCoord = [12.9716, 77.5946]; // Bangalore Tech Park
    }

    const pct = progress / 100;
    const currentLat = warehouseCoord[0] + (destinationCoord[0] - warehouseCoord[0]) * pct;
    const currentLng = warehouseCoord[1] + (destinationCoord[1] - warehouseCoord[1]) * pct;

    return {
      ...order,
      status,
      tracking: {
        status,
        description,
        activeHub,
        progress,
        elapsedSec,
        currentLocation: [currentLat, currentLng],
        warehouseLocation: warehouseCoord,
        destinationLocation: destinationCoord,
        carrier: 'Aetheria Express Courier',
        trackingNumber: 'AE-' + order.id.replace('ORD-', '') + '-JP',
        weatherCondition: this.generateWeatherSimulation(activeHub)
      }
    };
  }

  generateWeatherSimulation(hub) {
    if (hub.includes('Warehouse')) {
      return { temp: '18°C', condition: 'Clear Skies', delayHours: 0 };
    } else if (hub.includes('Sorting')) {
      return { temp: '16°C', condition: 'Moderate Fog', delayHours: 0.5 };
    } else if (hub.includes('Distribution')) {
      return { temp: '22°C', condition: 'Heavy Rain', delayHours: 1.5 };
    } else {
      return { temp: '20°C', condition: 'Light Cloud Coverage', delayHours: 0 };
    }
  }

  async createOrder(orderData) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Deduct stock for all items
      for (const item of orderData.items) {
        const [prodRows] = await connection.execute('SELECT stock, name FROM products WHERE id = ? FOR UPDATE', [item.id]);
        if (prodRows.length === 0) {
          throw new Error(`Product not found: ${item.id}`);
        }
        const product = prodRows[0];
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        await connection.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
      }

      const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      const now = new Date();
      const newOrder = {
        id: orderId,
        userId: orderData.userId,
        items: orderData.items,
        total: orderData.total,
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        status: 'Placed',
        createdAt: now.toISOString()
      };

      await connection.execute(
        'INSERT INTO orders (id, userId, items, total, shippingAddress, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          newOrder.id,
          newOrder.userId,
          JSON.stringify(newOrder.items),
          newOrder.total,
          JSON.stringify(newOrder.shippingAddress),
          newOrder.paymentMethod,
          newOrder.status,
          now
        ]
      );

      await connection.commit();
      return newOrder;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = new MySQLDatabase();

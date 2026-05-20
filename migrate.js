require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'aetheria_db';

async function migrate() {
  console.log('=== Starting MySQL Schema Migration & Seeding ===');
  
  let connection;
  try {
    // 1. Connect to MySQL without specifying a database to create the database first
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD
    });
    console.log(`Successfully connected to MySQL at ${DB_HOST}:${DB_PORT}`);
  } catch (err) {
    console.error(`\n[CONNECTION ERROR] Could not connect to MySQL server.`);
    console.error(`Please verify that:`);
    console.error(`1. MySQL server is running on port ${DB_PORT}.`);
    console.error(`2. Your credentials in the .env file are correct.`);
    console.error(`Error details: ${err.message}\n`);
    process.exit(1);
  }

  try {
    // 2. Create database
    console.log(`Creating database "${DB_NAME}" if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await connection.changeUser({ database: DB_NAME });
    console.log(`Switched context to database "${DB_NAME}".`);

    // 3. Drop existing tables in correct order to avoid constraint violations
    console.log('Dropping any existing tables to ensure a clean slate...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS orders');
    await connection.query('DROP TABLE IF EXISTS reviews');
    await connection.query('DROP TABLE IF EXISTS addresses');
    await connection.query('DROP TABLE IF EXISTS products');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 4. Create Tables
    console.log('Creating table schema layout...');
    
    // Users table
    await connection.query(`
      CREATE TABLE users (
        id BIGINT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Addresses table
    await connection.query(`
      CREATE TABLE addresses (
        id VARCHAR(50) NOT NULL,
        userId BIGINT NOT NULL,
        title VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(255) NOT NULL,
        zip VARCHAR(50) NOT NULL,
        country VARCHAR(100) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        PRIMARY KEY (id, userId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Products table
    await connection.query(`
      CREATE TABLE products (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        originalPrice DECIMAL(10, 2) NOT NULL,
        image VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        stock INT NOT NULL,
        rating DECIMAL(2, 1) NOT NULL,
        ratingsCount INT NOT NULL,
        assured TINYINT(1) NOT NULL DEFAULT 0,
        specs JSON NOT NULL,
        variations JSON NOT NULL
      )
    `);

    // Reviews table
    await connection.query(`
      CREATE TABLE reviews (
        id BIGINT PRIMARY KEY,
        productId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        rating INT NOT NULL,
        comment TEXT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Orders table
    await connection.query(`
      CREATE TABLE orders (
        id VARCHAR(50) PRIMARY KEY,
        userId BIGINT NOT NULL,
        items JSON NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        shippingAddress JSON NOT NULL,
        paymentMethod VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Placed',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Tables created successfully.');

    // 5. Seed Data from db.json
    const dbJsonPath = path.join(__dirname, 'db.json');
    if (!fs.existsSync(dbJsonPath)) {
      console.warn('Warning: db.json not found. Skipping seeding phase.');
      await connection.end();
      return;
    }

    console.log('Reading seed data from db.json...');
    const rawData = fs.readFileSync(dbJsonPath, 'utf8');
    const data = JSON.parse(rawData);

    // Seed Users & Addresses
    console.log(`Seeding ${data.users ? data.users.length : 0} users...`);
    if (data.users && data.users.length > 0) {
      for (const user of data.users) {
        // Insert User
        await connection.query(
          'INSERT INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
          [user.id, user.name, user.email, user.password, user.role || 'user', new Date(user.createdAt)]
        );

        // Insert User's Addresses
        if (user.addresses && user.addresses.length > 0) {
          for (const addr of user.addresses) {
            await connection.query(
              'INSERT INTO addresses (id, userId, title, name, address, city, zip, country, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [addr.id, user.id, addr.title, addr.name, addr.address, addr.city, addr.zip, addr.country, addr.phone]
            );
          }
        }
      }
    }

    // Seed Products
    console.log(`Seeding ${data.products ? data.products.length : 0} products...`);
    if (data.products && data.products.length > 0) {
      for (const prod of data.products) {
        await connection.query(
          'INSERT INTO products (id, name, brand, description, price, originalPrice, image, category, stock, rating, ratingsCount, assured, specs, variations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            prod.id,
            prod.name,
            prod.brand,
            prod.description,
            prod.price,
            prod.originalPrice,
            prod.image,
            prod.category,
            prod.stock,
            prod.rating,
            prod.ratingsCount,
            prod.assured ? 1 : 0,
            JSON.stringify(prod.specs || []),
            JSON.stringify(prod.variations || {})
          ]
        );
      }
    }

    // Seed Reviews
    console.log(`Seeding ${data.reviews ? data.reviews.length : 0} reviews...`);
    if (data.reviews && data.reviews.length > 0) {
      for (const rev of data.reviews) {
        await connection.query(
          'INSERT INTO reviews (id, productId, name, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
          [rev.id, rev.productId, rev.name, rev.rating, rev.comment, new Date(rev.createdAt)]
        );
      }
    }

    // Seed Orders
    console.log(`Seeding ${data.orders ? data.orders.length : 0} orders...`);
    if (data.orders && data.orders.length > 0) {
      for (const ord of data.orders) {
        await connection.query(
          'INSERT INTO orders (id, userId, items, total, shippingAddress, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            ord.id,
            ord.userId,
            JSON.stringify(ord.items || []),
            ord.total,
            JSON.stringify(ord.shippingAddress || {}),
            ord.paymentMethod,
            ord.status,
            new Date(ord.createdAt)
          ]
        );
      }
    }

    console.log('\n=== MIGRATION AND SEEDING COMPLETED SUCCESSFULLY ===\n');
    await connection.end();
  } catch (err) {
    console.error('Migration failed during database initialization:', err);
    if (connection) await connection.end();
    process.exit(1);
  }
}

migrate();

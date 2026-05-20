const http = require('http');

const PORT = process.argv[2] ? parseInt(process.argv[2]) : 3000;
const email = `tester_${Date.now()}@aetheria.io`;
const password = 'securepassword123';
const name = 'Test Astronaut';
let token = '';

function request(path, method, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (body) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== Starting E-Commerce API Automated Verification Tests ===\n');

  try {
    // Test 1: Register User
    console.log('Test 1: Registering a new account...');
    const regRes = await request('/api/auth/register', 'POST', { name, email, password });
    if (regRes.status === 201 && regRes.data.token) {
      console.log('✅ Registration Successful!');
      token = regRes.data.token;
    } else {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    }

    // Test 2: Login User
    console.log('\nTest 2: Logging in with registered credentials...');
    const loginRes = await request('/api/auth/login', 'POST', { email, password });
    if (loginRes.status === 200 && loginRes.data.token) {
      console.log('✅ Login Successful!');
    } else {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
    }

    // Test 3: Get Products
    console.log('\nTest 3: Fetching products catalog...');
    const prodRes = await request('/api/products', 'GET');
    if (prodRes.status === 200 && Array.isArray(prodRes.data)) {
      console.log(`✅ Products fetched. Count: ${prodRes.data.length} products found.`);
      prodRes.data.forEach(p => console.log(`  - [ID: ${p.id}] ${p.name} ($${p.price}) | Stock: ${p.stock}`));
    } else {
      throw new Error(`Fetch products failed: ${JSON.stringify(prodRes.data)}`);
    }

    const aetherLight = prodRes.data.find(p => p.id === 1);
    const initialStock = aetherLight ? aetherLight.stock : 0;
    console.log(`\nInitial stock of Aether Aura Light: ${initialStock}`);

    // Test 4: Place Order
    console.log('\nTest 4: Placing order for Aether Aura Light (Qty: 1)...');
    const orderPayload = {
      items: [{ id: 1, quantity: 1 }],
      shippingAddress: {
        name: 'Aiden Mercer',
        address: '88 Cybernetic Ave, Sector 7',
        city: 'Neo Tokyo',
        zip: '100-0001',
        country: 'Japan'
      },
      paymentMethod: 'credit-card'
    };

    const orderRes = await request('/api/orders', 'POST', orderPayload, {
      'Authorization': `Bearer ${token}`
    });

    if (orderRes.status === 201 && orderRes.data.order) {
      console.log(`✅ Order Placed Successfully! Order ID: ${orderRes.data.order.id}`);
      console.log(`   Total billing: $${orderRes.data.order.total}`);
    } else {
      throw new Error(`Order placement failed: ${JSON.stringify(orderRes.data)}`);
    }

    // Test 5: Verify Stock Decrement
    console.log('\nTest 5: Checking stock decrement of ordered item...');
    const prodRes2 = await request('/api/products', 'GET');
    const aetherLightAfter = prodRes2.data.find(p => p.id === 1);
    const finalStock = aetherLightAfter ? aetherLightAfter.stock : 0;
    console.log(`Final stock of Aether Aura Light: ${finalStock}`);
    if (finalStock === initialStock - 1) {
      console.log('✅ Stock properly decremented!');
    } else {
      throw new Error(`Stock mismatch! Expected ${initialStock - 1}, got ${finalStock}`);
    }

    // Test 6: Verify Order History
    console.log('\nTest 6: Fetching user order history...');
    const historyRes = await request('/api/orders', 'GET', null, {
      'Authorization': `Bearer ${token}`
    });

    if (historyRes.status === 200 && Array.isArray(historyRes.data)) {
      console.log(`✅ Order history fetched. Orders found: ${historyRes.data.length}`);
      historyRes.data.forEach(o => {
        console.log(`  - [Order: ${o.id}] Date: ${o.createdAt} | Total: $${o.total} | Status: ${o.status}`);
      });
      console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! API is 100% functional.');
    } else {
      throw new Error(`Order history fetch failed: ${JSON.stringify(historyRes.data)}`);
    }

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
  }
}

// Wait a bit to ensure server is ready, then run
setTimeout(runTests, 1000);

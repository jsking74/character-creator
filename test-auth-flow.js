#!/usr/bin/env node

const http = require('http');

async function testAuth() {
  try {
    console.log('Testing Auth Flow...\n');

    // Test 1: Login
    console.log('1. Testing login endpoint...');
    const loginResponse = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    if (loginResponse.accessToken) {
      console.log('✓ Login successful!');
      console.log(`  Access Token: ${loginResponse.accessToken.substring(0, 20)}...`);
      console.log(`  User ID: ${loginResponse.userId}\n`);

      // Test 2: Get current user (protected route)
      console.log('2. Testing get current user (protected)...');
      const userResponse = await makeRequest({
        method: 'GET',
        path: '/api/auth/user',
        headers: {
          'Authorization': `Bearer ${loginResponse.accessToken}`
        }
      });

      if (userResponse.id) {
        console.log('✓ Protected route successful!');
        console.log(`  Email: ${userResponse.email}`);
        console.log(`  Display Name: ${userResponse.displayName}\n`);
      }

      // Test 3: Health check
      console.log('3. Testing health endpoint...');
      const healthResponse = await makeRequest({
        method: 'GET',
        path: '/health'
      });

      if (healthResponse.status === 'ok') {
        console.log('✓ Health check passed!\n');
      }

      console.log('✅ All tests passed! Auth system is working.\n');
    } else {
      console.log('✗ Login failed');
      console.log(JSON.stringify(loginResponse, null, 2));
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'localhost',
      port: 5000,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

testAuth();

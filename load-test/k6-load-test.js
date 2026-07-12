// k6 Load Test for Financia - PR-05 QA-06
// Target: 100 concurrent users, 2 minutes, error rate < 1%, p95 < 3s

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const syncDuration = new Trend('sync_duration');
const stripeOverviewDuration = new Trend('stripe_overview_duration');
const authDuration = new Trend('auth_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '60s', target: 100 }, // Ramp up to 100 users
    { duration: '30s', target: 100 }, // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],     // p95 < 3s
    http_req_failed: ['rate<0.01'],        // error rate < 1%
    error_rate: ['rate<0.01'],             // custom error rate < 1%
    checks: ['rate>0.99'],                 // 99% checks pass
  },
  // Cloud/local configuration
  ext: {
    loadimpact: {
      projectID: 123456,
      name: 'Financia PR-05 QA Load Test',
    },
  },
};

// Environment variables - configure for your environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const API_BASE = __ENV.API_BASE || 'http://localhost:54321/functions/v1';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'loadtest@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'LoadTest123!';

// Helper to generate unique test user emails
function getTestEmail(vu, iter) {
  return `loadtest_${vu}_${iter}_${Date.now()}@example.com`;
}

// Helper for auth headers
function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'apikey': __ENV.SUPABASE_ANON_KEY || 'test-anon-key',
  };
}

// Store auth tokens per VU
const authTokens = new Map();

export function setup() {
  // Verify endpoints are reachable
  const healthRes = http.get(`${API_BASE}/health`);
  check(healthRes, { 'health endpoint reachable': (r) => r.status === 200 });
  console.log('Setup complete - health check:', healthRes.status);
  return { baseUrl: BASE_URL, apiBase: API_BASE };
}

export default function (data) {
  const vu = __VU;
  const iter = __ITER;
  
  // Scenario selection (weighted)
  const scenario = Math.random();
  
  if (scenario < 0.25) {
    // 25% - Auth flow
    runAuthFlow(vu, iter);
  } else if (scenario < 0.5) {
    // 25% - Transaction CRUD
    runTransactionCRUD(vu, iter);
  } else if (scenario < 0.7) {
    // 20% - Product CRUD
    runProductCRUD(vu, iter);
  } else if (scenario < 0.9) {
    // 20% - Sync operation
    runSyncOperation(vu, iter);
  } else {
    // 10% - Admin Stripe Overview
    runAdminStripeOverview(vu, iter);
  }
  
  // Think time between requests
  sleep(Math.random() * 2 + 0.5);
}

function runAuthFlow(vu, iter) {
  const email = getTestEmail(vu, iter);
  const password = TEST_PASSWORD;
  
  // 1. Sign up
  const signupRes = http.post(`${data.apiBase}/auth/signup`, JSON.stringify({
    email,
    password,
    company_name: `LoadTest Co ${vu}-${iter}`,
  }), {
    headers: { 'Content-Type': 'application/json', 'apikey': __ENV.SUPABASE_ANON_KEY || 'test' },
  });
  
  const signupSuccess = check(signupRes, {
    'signup status 200': (r) => r.status === 200,
    'signup has user_id': (r) => r.json('user_id') !== undefined,
  });
  errorRate.add(!signupSuccess);
  authDuration.add(signupRes.timings.duration);
  
  if (!signupSuccess) return;
  
  // 2. Sign in
  const signinRes = http.post(`${data.apiBase}/auth/signin`, JSON.stringify({
    email,
    password,
  }), {
    headers: { 'Content-Type': 'application/json', 'apikey': __ENV.SUPABASE_ANON_KEY || 'test' },
  });
  
  const signinSuccess = check(signinRes, {
    'signin status 200': (r) => r.status === 200,
    'signin has access_token': (r) => r.json('access_token') !== undefined,
  });
  errorRate.add(!signinSuccess);
  authDuration.add(signinRes.timings.duration);
  
  if (signinSuccess) {
    const token = signinRes.json('access_token');
    authTokens.set(vu, token);
  }
}

function runTransactionCRUD(vu, iter) {
  const token = authTokens.get(vu);
  if (!token) {
    // Try to auth first
    runAuthFlow(vu, iter);
    return;
  }
  
  const headers = getAuthHeaders(token);
  
  // Create transaction
  const createRes = http.post(`${data.apiBase}/transactions`, JSON.stringify({
    description: `Load test tx ${vu}-${iter}-${Date.now()}`,
    amount: Math.floor(Math.random() * 10000) + 100,
    type: Math.random() > 0.5 ? 'income' : 'expense',
    category: 'test',
    date: new Date().toISOString().split('T')[0],
  }), { headers });
  
  const createSuccess = check(createRes, {
    'create tx status 200/201': (r) => r.status === 200 || r.status === 201,
    'create tx has id': (r) => r.json('id') !== undefined,
  });
  errorRate.add(!createSuccess);
  
  const txId = createSuccess ? createRes.json('id') : null;
  if (!txId) return;
  
  // Read transaction
  const readRes = http.get(`${data.apiBase}/transactions/${txId}`, { headers });
  const readSuccess = check(readRes, { 'read tx status 200': (r) => r.status === 200 });
  errorRate.add(!readSuccess);
  
  // Update transaction
  const updateRes = http.patch(`${data.apiBase}/transactions/${txId}`, JSON.stringify({
    description: `Updated ${Date.now()}`,
  }), { headers });
  const updateSuccess = check(updateRes, { 'update tx status 200': (r) => r.status === 200 });
  errorRate.add(!updateSuccess);
  
  // Delete transaction
  const deleteRes = http.del(`${data.apiBase}/transactions/${txId}`, null, { headers });
  const deleteSuccess = check(deleteRes, { 'delete tx status 200/204': (r) => r.status === 200 || r.status === 204 });
  errorRate.add(!deleteSuccess);
}

function runProductCRUD(vu, iter) {
  const token = authTokens.get(vu);
  if (!token) {
    runAuthFlow(vu, iter);
    return;
  }
  
  const headers = getAuthHeaders(token);
  
  // Create product
  const createRes = http.post(`${data.apiBase}/products`, JSON.stringify({
    name: `Load Test Product ${vu}-${iter}-${Date.now()}`,
    price: Math.floor(Math.random() * 50000) + 1000,
    stock: Math.floor(Math.random() * 100) + 1,
    category: 'test',
  }), { headers });
  
  const createSuccess = check(createRes, {
    'create product status 200/201': (r) => r.status === 200 || r.status === 201,
    'create product has id': (r) => r.json('id') !== undefined,
  });
  errorRate.add(!createSuccess);
  
  const productId = createSuccess ? createRes.json('id') : null;
  if (!productId) return;
  
  // Read product
  const readRes = http.get(`${data.apiBase}/products/${productId}`, { headers });
  errorRate.add(!check(readRes, { 'read product 200': (r) => r.status === 200 }));
  
  // List products
  const listRes = http.get(`${data.apiBase}/products?limit=20`, { headers });
  errorRate.add(!check(listRes, { 'list products 200': (r) => r.status === 200 }));
  
  // Delete product
  const deleteRes = http.del(`${data.apiBase}/products/${productId}`, null, { headers });
  errorRate.add(!check(deleteRes, { 'delete product 200/204': (r) => r.status === 200 || r.status === 204 }));
}

function runSyncOperation(vu, iter) {
  const token = authTokens.get(vu);
  if (!token) {
    runAuthFlow(vu, iter);
    return;
  }
  
  const headers = getAuthHeaders(token);
  const startTime = Date.now();
  
  // Call sync function (uses the sync.js logic via edge function or direct)
  const syncRes = http.post(`${data.apiBase}/sync`, JSON.stringify({
    full_sync: iter % 5 === 0, // Full sync every 5th iteration
  }), { headers });
  
  const duration = Date.now() - startTime;
  syncDuration.add(duration);
  
  const syncSuccess = check(syncRes, {
    'sync status 200': (r) => r.status === 200,
    'sync has result': (r) => r.json('synced') !== undefined || r.json('result') !== undefined,
  });
  errorRate.add(!syncSuccess);
  
  console.log(`VU ${vu} sync duration: ${duration}ms`);
}

function runAdminStripeOverview(vu, iter) {
  const token = authTokens.get(vu);
  if (!token) {
    runAuthFlow(vu, iter);
    return;
  }
  
  const headers = getAuthHeaders(token);
  const startTime = Date.now();
  
  // Test with cursor pagination
  const cursor = iter % 3 === 0 ? 'test_cursor_' + iter : null;
  const limit = 50;
  
  let url = `${data.apiBase}/admin-stripe-overview?limit=${limit}`;
  if (cursor) url += `&cursor=${cursor}`;
  
  const res = http.get(url, { headers });
  const duration = Date.now() - startTime;
  stripeOverviewDuration.add(duration);
  
  const success = check(res, {
    'stripe overview status 200': (r) => r.status === 200,
    'has mrr_cents': (r) => r.json('mrr_cents') !== undefined,
    'has active_count': (r) => r.json('active_count') !== undefined,
    'has pagination': (r) => r.json('pagination') !== undefined,
  });
  errorRate.add(!success);
  
  console.log(`VU ${vu} stripe overview duration: ${duration}ms`);
}

export function teardown(data) {
  console.log('Load test completed');
  console.log('Results will be in k6 output');
}

import axios from 'axios';
import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:9005/api';
const SOCKET_URL = 'http://localhost:9005';

const STAFF_EMAIL = 'prakashbudha2003@gmail.com';
const STAFF_PASSWORD = 'Pr@kash1234';

const TRIALS = 20;              
const POLL_INTERVAL_MS = 7500;  
const GAP_BETWEEN_TRIALS_MS = 800;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeTestOrder(tag) {
  return {
    tableNumber: '1',
    items: [{ name: `BenchmarkItem-${tag}`, quantity: 1, price: 100 }],
  };
}

async function getStaffToken() {
  const { data } = await axios.post(`${BASE_URL}/auth/login`, {
    email: STAFF_EMAIL,
    password: STAFF_PASSWORD,
    cfToken: 'bench-script-bypass',
  });
  const token = data?.data?.accessToken;
  if (!token) throw new Error('Login did not return an accessToken - check credentials/response shape.');
  return token;
}

async function measureSocketLatency(n) {
  const results = [];
  const socket = io(SOCKET_URL, { transports: ['websocket'] });
  await new Promise((resolve) => socket.on('connect', resolve));
  console.log('Socket connected:', socket.id);

  for (let i = 0; i < n; i++) {
    const tag = `s${i}-${Date.now()}`;
    const expectedName = `BenchmarkItem-${tag}`;

    const latency = await new Promise((resolve) => {
      let t0;
      const handler = (order) => {
        const items = order?.items || [];
        if (items.some((it) => it.name === expectedName)) {
          socket.off('kitchen_new_order', handler);
          resolve(Date.now() - t0);
        }
      };
      socket.on('kitchen_new_order', handler);

      t0 = Date.now();
      axios.post(`${BASE_URL}/order/`, makeTestOrder(tag)).catch((err) => {
        console.error('Order creation failed (socket trial):', err.message);
      });
    });

    console.log(`  [socket] trial ${i + 1}/${n}: ${latency} ms`);
    results.push(latency);
    await sleep(GAP_BETWEEN_TRIALS_MS);
  }

  socket.disconnect();
  return results;
}

async function measurePollingLatency(n, token) {
  const results = [];
  const headers = { Authorization: `Bearer ${token}` };

  for (let i = 0; i < n; i++) {
    const tag = `p${i}-${Date.now()}`;
    const expectedName = `BenchmarkItem-${tag}`;

    const t0 = Date.now();
    await axios.post(`${BASE_URL}/order/`, makeTestOrder(tag)).catch((err) => {
      console.error('Order creation failed (polling trial):', err.message);
    });

    await sleep(POLL_INTERVAL_MS);
    const { data } = await axios.get(`${BASE_URL}/order/kitchen`, { headers });
    const orders = data?.data || [];
    const found = orders.some((o) => (o.items || []).some((it) => it.name === expectedName));

    const latency = Date.now() - t0;
    console.log(`  [poll]   trial ${i + 1}/${n}: ${latency} ms (found: ${found})`);
    results.push(latency);
  }

  return results;
}

function stats(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = arr.reduce((a, b) => a + b, 0);
  return {
    n: arr.length,
    mean: Math.round(sum / arr.length),
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

(async () => {
  try {
    console.log(`\n=== Socket.IO latency (${TRIALS} trials) ===`);
    const socketResults = await measureSocketLatency(TRIALS);
    console.log('Socket.IO stats (ms):', stats(socketResults));

    console.log(`\nLogging in as staff for the polling comparison...`);
    const token = await getStaffToken();

    console.log(`\n=== Simulated polling latency, ${POLL_INTERVAL_MS}ms interval (${TRIALS} trials) ===`);
    const pollResults = await measurePollingLatency(TRIALS, token);
    console.log('Polling stats (ms):', stats(pollResults));

    console.log('\n=== Summary (copy into report) ===');
    console.log('Socket.IO:', stats(socketResults));
    console.log('Polling  :', stats(pollResults));
  } catch (err) {
    console.error('\nBenchmark failed:', err.message);
    if (err.response?.data) {
      console.error('Server response:', JSON.stringify(err.response.data, null, 2));
    }
    console.error('Check: is docker compose up? is the port 9005:9005 mapping active? are STAFF_EMAIL/PASSWORD correct?');
  }
})();

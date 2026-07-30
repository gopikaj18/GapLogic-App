import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  try {
    const { pool } = await import('../src/lib/db');
    const { createSessionForUser } = await import('../src/lib/auth-server');

    // 1. Get a user
    const usersResult = await pool.query('SELECT * FROM users LIMIT 1');
    if (usersResult.rows.length === 0) {
      console.log('No users found in database. Create a user first.');
      await pool.end();
      return;
    }
    const userRow = usersResult.rows[0];
    const user = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      createdAt: userRow.created_at.toISOString(),
    };

    console.log('Authenticating as user:', user.email);

    // 2. Generate JWT token
    const token = await createSessionForUser(user);
    console.log('Generated Token:', token);

    // 3. Test GET /api/ai/insights
    console.log('\nTesting GET /api/ai/insights...');
    let start = Date.now();
    try {
      const res = await fetch('http://localhost:9002/api/ai/insights', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Insights Response Status:', res.status);
      console.log('Insights Response Time:', (Date.now() - start) / 1000, 'seconds');
      const data = await res.json();
      console.log('Insights Data (Keys):', Object.keys(data));
      if (data.error) {
        console.log('Insights Error:', data.error);
      }
    } catch (e) {
      console.error('Insights fetch failed:', e);
    }

    // 4. Test POST /api/ai/predict
    console.log('\nTesting POST /api/ai/predict...');
    start = Date.now();
    try {
      const res = await fetch('http://localhost:9002/api/ai/predict', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Review Analytics and Code',
          category: 'work',
          effortEstimate: 4,
          scheduledTime: '21:00',
          date: '2026-06-03'
        })
      });
      console.log('Predict Response Status:', res.status);
      console.log('Predict Response Time:', (Date.now() - start) / 1000, 'seconds');
      const data = await res.json();
      console.log('Predict Data (Keys):', Object.keys(data));
      if (data.error) {
        console.log('Predict Error:', data.error);
      } else {
        console.log('Predict Output:', JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.error('Predict fetch failed:', e);
    }

    await pool.end();
  } catch (err) {
    console.error('Main script failed:', err);
  }
}

main().catch(console.error);

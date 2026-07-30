import { format, subDays } from 'date-fns';

const API_BASE = 'http://127.0.0.1:9002';

async function testIntegration() {
  console.log('--- STARTING GAPLOGIC E2E INTEGRATION TEST ---');
  const email = `test-${Date.now()}@example.com`;
  const password = 'testpassword123';
  const name = 'Integration Test User';

  // 1. Register a test user
  console.log(`\n[1/5] Registering user: ${email}...`);
  const registerRes = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!registerRes.ok) {
    const errorText = await registerRes.text();
    throw new Error(`Registration failed: ${registerRes.status} - ${errorText}`);
  }

  const { token, user } = await registerRes.json();
  console.log(`Success! Registered User ID: ${user.id}`);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 2. Add some intentions and sync reality logs (we need 5+ logs to trigger insights)
  console.log('\n[2/5] Creating historical logs for behavioral analysis...');
  const categories = ['health', 'work', 'learning', 'personal'] as const;
  const mockTasks = [
    { title: 'Morning Jog', category: 'health', effort: 2, completed: true, friction: 'None, felt energized', daysAgo: 4 },
    { title: 'Write Project Proposal', category: 'work', effort: 4, completed: false, friction: 'Procrastinated, felt too tired after lunch', daysAgo: 3 },
    { title: 'Algorithm Study', category: 'learning', effort: 3, completed: true, friction: 'Focus was good', daysAgo: 2 },
    { title: 'Clean Apartment', category: 'personal', effort: 2, completed: true, friction: 'Quick session', daysAgo: 1 },
    { title: 'Review Database Design', category: 'work', effort: 5, completed: false, friction: 'Got distracted on social media, too complex', daysAgo: 1 },
  ];

  for (const task of mockTasks) {
    const dateStr = format(subDays(new Date(), task.daysAgo), 'yyyy-MM-dd');
    
    // Create Intention
    const intentionRes = await fetch(`${API_BASE}/api/intentions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: task.title,
        category: task.category,
        effortEstimate: task.effort,
        scheduledTime: '10:00',
        estimatedDuration: 45,
        date: dateStr,
      }),
    });

    if (!intentionRes.ok) {
      throw new Error(`Failed to create intention: ${intentionRes.statusText}`);
    }

    const { intention } = await intentionRes.json();

    // Create Reality Log
    const logRes = await fetch(`${API_BASE}/api/logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        intentionId: intention.id,
        completed: task.completed,
        actualEffort: task.effort,
        frictionNote: task.friction,
        contextNote: 'Testing integration framework',
        date: dateStr,
      }),
    });

    if (!logRes.ok) {
      throw new Error(`Failed to create log: ${logRes.statusText}`);
    }
  }
  console.log('Success! Created 5 historical intentions and reality logs.');

  // 3. Test Predictive behavioral audit endpoint
  console.log('\n[3/5] Requesting behavioral outcome prediction (/api/ai/predict)...');
  const predictionRes = await fetch(`${API_BASE}/api/ai/predict`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Study Advanced Next.js Features in Evening',
      category: 'learning',
      effortEstimate: 4,
      scheduledTime: '21:00',
      date: format(new Date(), 'yyyy-MM-dd'),
    }),
  });

  if (!predictionRes.ok) {
    const errText = await predictionRes.text();
    throw new Error(`Prediction failed: ${predictionRes.status} - ${errText}`);
  }

  const prediction = await predictionRes.json();
  console.log('Success! Prediction output:');
  console.log(JSON.stringify(prediction, null, 2));

  // 4. Test Discrepancy auditor and Recommendation insights endpoint
  console.log('\n[4/5] Requesting behavioral insights (/api/ai/insights)...');
  const insightsRes = await fetch(`${API_BASE}/api/ai/insights`, {
    method: 'GET',
    headers,
  });

  if (!insightsRes.ok) {
    const errText = await insightsRes.text();
    throw new Error(`Insights failed: ${insightsRes.status} - ${errText}`);
  }

  const insights = await insightsRes.json();
  console.log('Success! Insights output:');
  console.log(`Discrepancies found: ${insights.discrepancies?.length || 0}`);
  console.log(`Recommendations found: ${insights.recommendations?.length || 0}`);
  console.log(JSON.stringify(insights, null, 2));

  console.log('\n[5/5] All API integrations and ML model connections successfully verified.');
}

testIntegration().catch((e) => {
  console.error('\n❌ E2E Integration test failed:', e);
  process.exit(1);
});

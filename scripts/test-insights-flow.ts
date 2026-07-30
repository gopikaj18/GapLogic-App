import { config } from 'dotenv';
config({ path: '.env.local' });

async function diagnose() {
  try {
    console.log("Loading modules dynamically...");
    const { pool } = await import('../src/lib/db');
    const { analyzeBehavioralDiscrepancies } = await import('../src/ai/flows/analyze-behavioral-discrepancies');
    const { generatePersonalizedRecommendations } = await import('../src/ai/flows/generate-personalized-recommendations');
    const { BehavioralClassifier } = await import('../src/ai/models/behavioral-classifier');

    console.log("1. Fetching first user...");
    const userRes = await pool.query("SELECT id, name FROM users LIMIT 1");
    if (userRes.rows.length === 0) {
      console.error("No users found in database. Please register first!");
      return;
    }
    const user = userRes.rows[0];
    console.log(`Found user: ${user.name} (${user.id})`);

    // Ensure we have at least 5 intentions and logs
    const countRes = await pool.query("SELECT COUNT(*) FROM reality_logs WHERE user_id = $1", [user.id]);
    const logCount = parseInt(countRes.rows[0].count);
    console.log(`Current log count: ${logCount}`);

    if (logCount < 5) {
      console.log("Inserting mock intentions and logs to reach threshold of 5...");
      const mockTasks = [
        { title: "Morning Exercise Routine", category: "health", effort: 2, time: "07:30", duration: 30, completed: true, friction: "", context: "Energetic" },
        { title: "Code Refactoring session", category: "work", effort: 4, time: "10:00", duration: 90, completed: false, friction: "Interrupted by slack alerts", context: "Distracted" },
        { title: "Read habit loop chapter", category: "learning", effort: 3, time: "14:00", duration: 45, completed: true, friction: "", context: "Focused" },
        { title: "Organize home office desk", category: "personal", effort: 1, time: "17:00", duration: 20, completed: true, friction: "", context: "Calm" },
        { title: "Late night bug fixing", category: "work", effort: 5, time: "21:30", duration: 120, completed: false, friction: "Too tired to think straight", context: "Exhausted" }
      ];

      for (let i = 0; i < mockTasks.length; i++) {
        const t = mockTasks[i];
        const dateStr = new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        
        // Insert intention
        const intRes = await pool.query(
          `INSERT INTO intentions (user_id, title, category, effort_estimate, scheduled_time, estimated_duration, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [user.id, t.title, t.category, t.effort, t.time, t.duration, dateStr]
        );
        const intId = intRes.rows[0].id;

        // Insert log
        await pool.query(
          `INSERT INTO reality_logs (user_id, intention_id, completed, actual_effort, friction_note, context_note, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [user.id, intId, t.completed, t.effort, t.friction, t.context, dateStr]
        );
      }
      console.log("Mock data inserted successfully.");
    }

    console.log("2. Fetching intentions...");
    const intentionsResult = await pool.query(
      `SELECT * FROM intentions WHERE user_id = $1 ORDER BY date DESC, created_at DESC LIMIT 30`,
      [user.id]
    );
    const intentions = intentionsResult.rows;
    console.log(`Intentions fetched: ${intentions.length}`);

    console.log("3. Fetching reality logs...");
    const logsResult = await pool.query(
      `SELECT * FROM reality_logs WHERE user_id = $1 ORDER BY date DESC, created_at DESC LIMIT 30`,
      [user.id]
    );
    const logs = logsResult.rows;
    console.log(`Reality logs fetched: ${logs.length}`);

    // 4. Map for analyzeBehavioralDiscrepancies
    const plannedIntentions = intentions.map(i => ({
      id: String(i.id),
      description: String(i.title),
      expectedEffort: String(i.effort_estimate),
      category: String(i.category),
      dueDate: String(i.date),
    }));

    const actualBehaviors = logs.map(l => {
      const relatedIntention = intentions.find(i => i.id === l.intention_id);
      return {
        id: String(l.id),
        description: relatedIntention ? String(relatedIntention.title) : 'Unknown Intention',
        completionStatus: l.completed ? ('completed' as const) : ('not_started' as const),
        notes: String((l.friction_note || '') + ' ' + (l.context_note || '')).trim(),
        actualTimeSpent: String(l.actual_effort),
      };
    });

    console.log("5. Executing analyzeBehavioralDiscrepancies...");
    const discrepancyAnalysis = await analyzeBehavioralDiscrepancies({
      plannedIntentions,
      actualBehaviors,
      analysisContext: `Analyzing past behavioral data of user: ${user.name || 'User'}.`,
    });
    console.log("Discrepancy Analysis succeeded:", JSON.stringify(discrepancyAnalysis, null, 2));

    // Construct summaries for the Pivot Engine
    const discrepanciesSummary = discrepancyAnalysis.discrepancies.length > 0 
      ? discrepancyAnalysis.discrepancies.map(d => 
          `- Task: "${d.plannedItem.description}". Deviation: ${d.deviationExplanation}. Inconsistency: ${d.inconsistencyReason}`
        ).join('\n')
      : 'No significant behavioral discrepancies detected. The user is executing intentions consistently.';

    const plannedTasks = intentions.map(i => ({
      name: String(i.title),
      description: `Category: ${i.category}. Scheduled at: ${i.scheduled_time}.`,
      expectedEffortHours: Number(i.effort_estimate) || 3,
    }));

    const actualBehaviorsRec = logs.map(l => {
      const relatedIntention = intentions.find(i => i.id === l.intention_id);
      return {
        name: relatedIntention ? String(relatedIntention.title) : 'Unknown Intention',
        completed: Boolean(l.completed),
        actualEffortHours: Number(l.actual_effort) || null,
      };
    });

    console.log("6. Executing generatePersonalizedRecommendations...");
    const recommendationAnalysis = await generatePersonalizedRecommendations({
      userGoals: `Improve overall behavior integrity, consistency, and willpower alignment in categories: Health, Work, Learning, Personal.`,
      discrepanciesSummary,
      plannedTasks,
      actualBehaviors: actualBehaviorsRec,
    });
    console.log("Recommendation Analysis succeeded:", JSON.stringify(recommendationAnalysis, null, 2));

  } catch (error) {
    console.error("DIAGNOSIS ERROR:", error);
  } finally {
    const { pool } = await import('../src/lib/db');
    await pool.end();
  }
}

diagnose();

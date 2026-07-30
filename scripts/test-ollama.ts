import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function main() {
  const { predictBehavioralOutcome } = await import('../src/ai/flows/predict-behavioral-outcome');
  
  console.log('Testing gemma2:2b behavioral prediction via Ollama...');
  try {
    const start = Date.now();
    const result = await predictBehavioralOutcome({
      history: [
        {
          title: 'Morning Yoga',
          category: 'health',
          effort: 2,
          completed: true,
          friction: 'None, felt great',
          date: '2026-05-30'
        },
        {
          title: 'Work on Report',
          category: 'work',
          effort: 5,
          completed: false,
          friction: 'Too tired, got distracted by social media',
          date: '2026-05-30'
        }
      ],
      currentIntention: {
        title: 'Review Analytics in Evening',
        category: 'work',
        effort: 4,
        scheduledTime: '21:00',
        date: '2026-05-31'
      }
    });
    
    console.log('Success! Response received in', (Date.now() - start) / 1000, 'seconds.');
    console.log('Prediction Output:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Failed to run flow:', error);
  }
}

main().catch(console.error);

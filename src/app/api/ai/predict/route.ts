import { NextRequest, NextResponse } from 'next/server';
import { getLogs, getIntentions } from '@/lib/firebase-db';
import { getUserFromRequest } from '@/lib/auth-server';
import { predictBehavioralOutcome } from '@/ai/flows/predict-behavioral-outcome';
import { BehavioralClassifier } from '@/ai/models/behavioral-classifier';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, category, effortEstimate, scheduledTime, date } = body;

    if (!title || !category || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the user's historical logs and intentions to provide behavioral context for prediction
    const [logs, intentions] = await Promise.all([
      getLogs(user.id),
      getIntentions(user.id),
    ]);

    if (logs.length < 5) {
      return NextResponse.json({ error: 'Sufficient historical data is not available. Minimum 5 tasks required.' }, { status: 400 });
    }

    const history = logs.slice(0, 30).map((log) => {
      const relatedIntention = intentions.find((i) => i.id === log.intentionId);
      return {
        title: relatedIntention ? relatedIntention.title : 'Unknown Intention',
        category: relatedIntention ? relatedIntention.category : 'work',
        effort: relatedIntention ? Number(relatedIntention.effortEstimate) : 3,
        scheduledTime: relatedIntention ? relatedIntention.scheduledTime : '09:00',
        completed: Boolean(log.completed),
        friction: log.frictionNote || '',
        date: log.date,
      };
    });

    // Train and execute the local math-based ML model
    const classifier = new BehavioralClassifier();
    const chronologicalHistory = [...history].reverse();
    classifier.train(chronologicalHistory);

    const targetTask = {
      category,
      effort: Number(effortEstimate) || 3,
      scheduledTime: scheduledTime || '09:00',
    };
    const classifierPrediction = classifier.predict(targetTask, history);
    const modelInfo = classifier.getModelInfo();

    // Call the predictBehavioralOutcome flow using the configured gemma2:2b model
    let predictionOutput;
    try {
      predictionOutput = await predictBehavioralOutcome({
        history,
        currentIntention: {
          title,
          category,
          effort: Number(effortEstimate) || 3,
          scheduledTime: scheduledTime || '09:00',
          date,
        },
      });
    } catch (llmError) {
      console.warn('[predict API Route] Gemma predictBehavioralOutcome failed or timed out. Returning local fallback.', llmError);
      predictionOutput = {
        prediction: 'completed' as const,
        probability: 0.5,
        reasoning: 'Gemma forecast is currently offline or timed out. Your scheduling parameters are logged and ready.',
        suggestedAction: 'Break the task down into smaller increments and protect your focus block.',
      };
    }

    return NextResponse.json({
      ...predictionOutput,
      classifierPrediction,
      modelInfo,
    });
  } catch (error) {
    console.error('[predict API Route Error]', error);
    return NextResponse.json({ error: 'Failed to predict outcome' }, { status: 500 });
  }
}

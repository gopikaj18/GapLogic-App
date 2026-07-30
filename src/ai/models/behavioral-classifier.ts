/**
 * @fileOverview A self-contained Logistic Regression machine learning model in TypeScript.
 * It extracts behavioral features and trains online using the user's local history.
 */

export interface HistoricalTask {
  category: string;
  effort: number;
  scheduledTime: string;
  completed: boolean;
}

export interface PredictionInput {
  category: string;
  effort: number;
  scheduledTime: string;
}

export interface ClassifierPrediction {
  probability: number;
  prediction: 'completed' | 'missed';
  featuresUsed: {
    normalizedEffort: number;
    categoryCompletionRate: number;
    timeOfDayCompletionRate: number;
    previousTaskSuccess: number;
  };
}

export class BehavioralClassifier {
  private weights: number[];
  private bias: number;
  private lr: number = 0.1;
  private epochs: number = 100;

  constructor() {
    // 4 Features:
    // x0: Normalized task effort (1 to 5 maps to 0.0 to 1.0)
    // x1: Historical completion rate for this category
    // x2: Historical completion rate for this hour block (morning, afternoon, evening)
    // x3: Previous task outcome (0 = missed, 1 = completed)
    
    // Initialize weights with negative bias for effort, and positive for consistency features
    this.weights = [-0.3, 0.6, 0.4, 0.3];
    this.bias = -0.1;
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  /**
   * Determine the time-of-day block: Morning (6-12), Afternoon (12-18), Evening (18-24), Night (0-6)
   */
  private getTimeBlock(timeStr: string): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = parseInt(timeStr.split(':')[0]) || 12;
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  }

  /**
   * Pre-calculate completion rate aggregates to use as features
   */
  private calculateStats(history: HistoricalTask[]) {
    const categoryTotals: Record<string, number> = {};
    const categoryCompletions: Record<string, number> = {};
    
    const timeTotals: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const timeCompletions: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    for (const task of history) {
      // Category Stats
      categoryTotals[task.category] = (categoryTotals[task.category] || 0) + 1;
      if (task.completed) {
        categoryCompletions[task.category] = (categoryCompletions[task.category] || 0) + 1;
      }

      // Time Stats
      const block = this.getTimeBlock(task.scheduledTime);
      timeTotals[block]++;
      if (task.completed) {
        timeCompletions[block]++;
      }
    }

    return {
      categoryTotals,
      categoryCompletions,
      timeTotals,
      timeCompletions,
    };
  }

  /**
   * Extract input features for the classifier
   */
  private extractFeatures(
    task: { category: string; effort: number; scheduledTime: string },
    prevTask: { completed: boolean } | null,
    stats: any
  ): number[] {
    const x0 = (task.effort - 1) / 4; // Normalize effort to [0, 1]

    // Category rate feature
    const catTotal = stats.categoryTotals[task.category] || 0;
    const catComp = stats.categoryCompletions[task.category] || 0;
    const x1 = catTotal > 0 ? catComp / catTotal : 0.5;

    // Time block rate feature
    const block = this.getTimeBlock(task.scheduledTime);
    const timeTotal = stats.timeTotals[block] || 0;
    const timeComp = stats.timeCompletions[block] || 0;
    const x2 = timeTotal > 0 ? timeComp / timeTotal : 0.5;

    // Previous task status
    const x3 = prevTask ? (prevTask.completed ? 1 : 0) : 0.5;

    return [x0, x1, x2, x3];
  }

  /**
   * Train the Logistic Regression classifier on user history using gradient descent
   */
  public train(history: HistoricalTask[]) {
    if (history.length < 3) return; // Require at least 3 historical points to fit parameters

    const stats = this.calculateStats(history);
    const dataset: Array<{ x: number[]; y: number }> = [];

    // Construct training dataset of pairs (features at t, outcome at t)
    for (let i = 1; i < history.length; i++) {
      const task = history[i];
      const prevTask = history[i - 1];
      const x = this.extractFeatures(task, prevTask, stats);
      const y = task.completed ? 1 : 0;
      dataset.push({ x, y });
    }

    // Run Gradient Descent to minimize Binary Cross-Entropy Loss
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      for (const { x, y } of dataset) {
        const z = x.reduce((sum, val, idx) => sum + val * this.weights[idx], 0) + this.bias;
        const yHat = this.sigmoid(z);
        
        // Gradient = yHat - y
        const gradient = yHat - y;

        // Weights & Bias Updates
        for (let j = 0; j < this.weights.length; j++) {
          this.weights[j] -= this.lr * gradient * x[j];
        }
        this.bias -= this.lr * gradient;
      }
    }
  }

  /**
   * Predict completion outcome for a target task
   */
  public predict(target: PredictionInput, history: HistoricalTask[]): ClassifierPrediction {
    const stats = this.calculateStats(history);
    const prevTask = history.length > 0 ? history[0] : null; // Most recent task in sorted history

    const x = this.extractFeatures(target, prevTask, stats);
    const z = x.reduce((sum, val, idx) => sum + val * this.weights[idx], 0) + this.bias;
    const probability = this.sigmoid(z);

    return {
      probability,
      prediction: probability >= 0.5 ? 'completed' : 'missed',
      featuresUsed: {
        normalizedEffort: x[0],
        categoryCompletionRate: x[1],
        timeOfDayCompletionRate: x[2],
        previousTaskSuccess: x[3]
      }
    };
  }

  /**
   * Return the model's trained weights and bias parameters.
   */
  public getModelInfo() {
    return {
      weights: this.weights,
      bias: this.bias,
      featureNames: [
        'Normalized Effort',
        'Category Completion Rate',
        'Time-of-day Completion Rate',
        'Previous Task Success'
      ]
    };
  }
}

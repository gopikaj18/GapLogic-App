import numpy as np
import json

class BehavioralClassifier:
    """
    A standalone Logistic Regression machine learning model in Python.
    Replicates the exact feature extraction, gradient descent, and prediction
    logic used in the Next.js TypeScript application.
    """
    def __init__(self):
        # 4 Features:
        # x0: Normalized task effort (1 to 5 maps to 0.0 to 1.0)
        # x1: Historical completion rate for this category
        # x2: Historical completion rate for this hour block (morning, afternoon, evening, night)
        # x3: Previous task outcome (0 = missed, 1 = completed)
        self.weights = np.array([-0.3, 0.6, 0.4, 0.3])
        self.bias = -0.1
        self.lr = 0.1
        self.epochs = 100

    def sigmoid(self, z):
        return 1 / (1 + np.exp(-z))

    def get_time_block(self, time_str):
        try:
            hour = int(time_str.split(':')[0])
        except Exception:
            hour = 12
        
        if 6 <= hour < 12:
            return 'morning'
        elif 12 <= hour < 18:
            return 'afternoon'
        elif 18 <= hour < 24:
            return 'evening'
        else:
            return 'night'

    def calculate_stats(self, history):
        category_totals = {}
        category_completions = {}
        time_totals = {'morning': 0, 'afternoon': 0, 'evening': 0, 'night': 0}
        time_completions = {'morning': 0, 'afternoon': 0, 'evening': 0, 'night': 0}

        for task in history:
            cat = task['category']
            category_totals[cat] = category_totals.get(cat, 0) + 1
            if task['completed']:
                category_completions[cat] = category_completions.get(cat, 0) + 1

            block = self.get_time_block(task['scheduledTime'])
            time_totals[block] += 1
            if task['completed']:
                time_completions[block] += 1

        return {
            'category_totals': category_totals,
            'category_completions': category_completions,
            'time_totals': time_totals,
            'time_completions': time_completions
        }

    def extract_features(self, task, prev_task, stats):
        # Normalize effort from [1, 5] to [0.0, 1.0]
        x0 = (task['effort'] - 1) / 4.0

        # Category Completion Rate
        cat_total = stats['category_totals'].get(task['category'], 0)
        cat_comp = stats['category_completions'].get(task['category'], 0)
        x1 = cat_comp / cat_total if cat_total > 0 else 0.5

        # Time Block Completion Rate
        block = self.get_time_block(task['scheduledTime'])
        time_total = stats['time_totals'].get(block, 0)
        time_comp = stats['time_completions'].get(block, 0)
        x2 = time_comp / time_total if time_total > 0 else 0.5

        # Previous Task Outcome
        x3 = 1.0 if prev_task and prev_task['completed'] else 0.0 if prev_task else 0.5

        return np.array([x0, x1, x2, x3])

    def train(self, history):
        if len(history) < 3:
            print("Model requires at least 3 points to train parameters.")
            return

        stats = self.calculate_stats(history)
        dataset = []

        # Construct training dataset of pairs (features at t, outcome at t)
        for i in range(1, len(history)):
            task = history[i]
            prev_task = history[i - 1]
            x = self.extract_features(task, prev_task, stats)
            y = 1.0 if task['completed'] else 0.0
            dataset.append((x, y))

        # Run Gradient Descent to minimize Binary Cross-Entropy Loss
        for epoch in range(self.epochs):
            for x, y in dataset:
                z = np.dot(x, self.weights) + self.bias
                y_hat = self.sigmoid(z)
                
                # Gradient = prediction error
                gradient = y_hat - y

                # Weights & Bias Updates
                self.weights -= self.lr * gradient * x
                self.bias -= self.lr * gradient

    def predict(self, target, history):
        stats = self.calculate_stats(history)
        prev_task = history[0] if len(history) > 0 else None

        x = self.extract_features(target, prev_task, stats)
        z = np.dot(x, self.weights) + self.bias
        probability = self.sigmoid(z)

        return {
            'probability': float(probability),
            'prediction': 'completed' if probability >= 0.5 else 'missed',
            'featuresUsed': {
                'normalizedEffort': float(x[0]),
                'categoryCompletionRate': float(x[1]),
                'timeOfDayCompletionRate': float(x[2]),
                'previousTaskSuccess': float(x[3])
            }
        }

if __name__ == "__main__":
    # Test Data: historical logs
    mock_history = [
        {"category": "work", "effort": 3, "scheduledTime": "09:00", "completed": True},
        {"category": "work", "effort": 4, "scheduledTime": "10:30", "completed": False},
        {"category": "health", "effort": 2, "scheduledTime": "07:00", "completed": True},
        {"category": "learning", "effort": 5, "scheduledTime": "20:00", "completed": False},
        {"category": "work", "effort": 3, "scheduledTime": "14:00", "completed": True},
        {"category": "personal", "effort": 1, "scheduledTime": "18:00", "completed": True},
        {"category": "work", "effort": 3, "scheduledTime": "09:00", "completed": True},
    ]

    print("=== Behavioral Classifier ML Script (Python) ===")
    classifier = BehavioralClassifier()
    print("\nInitial parameters:")
    print(" - Weights:", classifier.weights)
    print(" - Bias:   ", classifier.bias)

    # Train model
    print("\nTraining on", len(mock_history), "historical logs...")
    classifier.train(mock_history)
    
    print("\nTrained parameters:")
    print(" - Weights:", classifier.weights)
    print(" - Bias:   ", classifier.bias)

    # Run a prediction
    target_task = {"category": "work", "effort": 3, "scheduledTime": "09:00"}
    prediction = classifier.predict(target_task, mock_history)
    print("\nPrediction for task:", target_task)
    print(json.dumps(prediction, indent=2))

'use server';
/**
 * @fileOverview A GenAI-powered recommendation tool, the "Pivot Engine", that suggests specific, actionable workflow adjustments to align habits with stated goals using local Ollama.
 */

import { z } from 'zod';
import { queryOllama, cleanAndParseJson, sanitizeNulls } from '@/ai/ollama';

const PlannedTaskSchema = z.object({
  name: z.string().describe('The name of the planned task.'),
  description: z.string().describe('A brief description of the task.'),
  expectedEffortHours: z
    .number()
    .describe('The estimated effort in hours for the task.'),
});

const ActualBehaviorSchema = z.object({
  name: z.string().describe('The name of the task as it was actually attempted.'),
  completed: z.boolean().describe('Whether the task was completed or not.'),
  actualEffortHours: z
    .number()
    .nullable()
    .describe('The actual effort in hours spent on the task, or null if not started.'),
});

const RecommendationSchema = z.object({
  title: z
    .string()
    .describe('A concise title for the personalized recommendation.'),
  description: z
    .string()
    .describe('Specific and actionable steps for the user to implement.'),
  category: z
    .enum([
      'Time Management',
      'Prioritization',
      'Environment Adjustment',
      'Cognitive Reframing',
      'Skill Development',
      'Task Breakdown',
      'Motivation',
    ])
    .describe('The category of the recommendation.'),
  rationale: z
    .string()
    .describe(
      'Explanation of why this recommendation is relevant based on the identified discrepancies.'
    ),
});

const GeneratePersonalizedRecommendationsInputSchema = z.object({
  userGoals: z
    .string()
    .describe('A summary of the user’s overall goals and intentions.'),
  discrepanciesSummary: z
    .string()
    .describe(
      'A detailed summary of identified behavioral leaks, inconsistencies, and why intentions were not fulfilled. This should include patterns of inconsistency.'
    ),
  plannedTasks: z
    .array(PlannedTaskSchema)
    .describe('A list of tasks the user planned to do.'),
  actualBehaviors: z
    .array(ActualBehaviorSchema)
    .describe('A list of tasks the user actually attempted or completed.'),
});
export type GeneratePersonalizedRecommendationsInput = z.infer<
  typeof GeneratePersonalizedRecommendationsInputSchema
>;

const GeneratePersonalizedRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(RecommendationSchema)
    .describe('A list of specific, actionable, and personalized recommendations.'),
});
export type GeneratePersonalizedRecommendationsOutput = z.infer<
  typeof GeneratePersonalizedRecommendationsOutputSchema
>;

function formatRecommendationPrompt(input: GeneratePersonalizedRecommendationsInput): string {
  const plannedText = input.plannedTasks.map(t => 
    `- Task Name: ${t.name}\n  Description: ${t.description}\n  Expected Effort: ${t.expectedEffortHours} hours`
  ).join('\n');

  const actualText = input.actualBehaviors.map(b => 
    `- Task Name: ${b.name}\n  Completed: ${b.completed}\n  Actual Effort: ${b.actualEffortHours !== null ? `${b.actualEffortHours} hours` : 'not started'}`
  ).join('\n');

  return `You are the "Pivot Engine", an AI-powered recommendation tool designed to help users align their actions with their intentions.
Your goal is to provide specific, actionable, and personalized recommendations based on the user's stated goals, planned tasks, actual behaviors, and identified discrepancies.

### User's Overall Goals:
${input.userGoals}

### Identified Discrepancies and Inconsistencies:
${input.discrepanciesSummary}

### Planned Tasks:
${plannedText}

### Actual Behaviors:
${actualText}

Based on the above information, generate a list of 3-5 specific, actionable, and personalized recommendations. Each recommendation should include a clear title, detailed steps, a category, and a rationale explaining how it addresses the identified discrepancies and helps the user achieve their goals.

### Output format:
Return a JSON object with the following fields:
{
  "recommendations": [
    {
      "title": "<string concise title>",
      "description": "<string actionable details and steps>",
      "category": "Time Management" | "Prioritization" | "Environment Adjustment" | "Cognitive Reframing" | "Skill Development" | "Task Breakdown" | "Motivation",
      "rationale": "<string explanation of why this works>"
    }
  ]
}
Do NOT return a JSON Schema wrapper (like "type", "properties", etc.). Just return the flat JSON object itself.`;
}

export async function generatePersonalizedRecommendations(
  input: GeneratePersonalizedRecommendationsInput
): Promise<GeneratePersonalizedRecommendationsOutput> {
  const prompt = formatRecommendationPrompt(input);
  const text = await queryOllama(prompt, 'json');
  
  let parsed: any;
  try {
    parsed = cleanAndParseJson(text);
  } catch (e) {
    console.error("[generatePersonalizedRecommendations] JSON Parsing Failed. Raw text was:", text);
    throw new Error('Failed to parse Gemma output as JSON: ' + (e as Error).message);
  }

  // Normalize structure and handle schema wrappers or key variants
  if (parsed && typeof parsed === 'object') {
    if ('properties' in parsed && typeof parsed.properties === 'object') {
      const props = parsed.properties;
      parsed = {
        recommendations: props.recommendations?.default ?? props.recommendations ?? [],
      };
    }

    // Ensure recommendations is an array
    if (!Array.isArray(parsed.recommendations)) {
      parsed.recommendations = parsed.recommendations ? [parsed.recommendations] : [];
    }

    // Normalize recommendation items and ensure correct categories
    const validCategories = [
      'Time Management',
      'Prioritization',
      'Environment Adjustment',
      'Cognitive Reframing',
      'Skill Development',
      'Task Breakdown',
      'Motivation'
    ];

    parsed.recommendations = parsed.recommendations.map((item: any) => {
      if (item && typeof item === 'object') {
        let cat = item.category ?? 'Time Management';
        // Capitalize category words to match schema exactly
        if (typeof cat === 'string') {
          // Find standard category matching case-insensitively
          const matched = validCategories.find(c => c.toLowerCase() === cat.toLowerCase());
          if (matched) {
            cat = matched;
          } else {
            cat = 'Time Management';
          }
        } else {
          cat = 'Time Management';
        }

        return {
          title: String(item.title ?? 'Recommendation'),
          description: String(item.description ?? 'Action step'),
          category: cat,
          rationale: String(item.rationale ?? ''),
        };
      }
      return item;
    });
  }

  parsed = sanitizeNulls(parsed);

  return GeneratePersonalizedRecommendationsOutputSchema.parse(parsed);
}

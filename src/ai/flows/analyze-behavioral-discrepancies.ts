'use server';
/**
 * @fileOverview This file implements a query for the Discrepancy Auditor feature.
 * It analyzes a user's planned intentions against their actual behaviors using local Ollama.
 */

import { z } from 'zod';
import { queryOllama, cleanAndParseJson, sanitizeNulls } from '@/ai/ollama';

const PlannedIntentionSchema = z.object({
  id: z.string(),
  description: z.string(),
  expectedEffort: z.string().optional(),
  category: z.string().optional(),
  dueDate: z.string().optional(),
});

const ActualBehaviorSchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  completionStatus: z.enum(['completed', 'partially_completed', 'not_started', 'deviated']),
  notes: z.string().optional(),
  actualTimeSpent: z.string().optional(),
});

const AnalyzeBehavioralDiscrepanciesInputSchema = z.object({
  plannedIntentions: z.array(PlannedIntentionSchema),
  actualBehaviors: z.array(ActualBehaviorSchema),
  analysisContext: z.string().optional(),
});
export type AnalyzeBehavioralDiscrepanciesInput = z.infer<typeof AnalyzeBehavioralDiscrepanciesInputSchema>;

const DiscrepancyDetailSchema = z.object({
  plannedItem: PlannedIntentionSchema.pick({id: true, description: true}),
  actualOutcome: ActualBehaviorSchema.partial().pick({id: true, description: true, completionStatus: true}).optional(),
  deviationExplanation: z.string().default(''),
  inconsistencyReason: z.string().default(''),
  suggestedInsight: z.string().default(''),
});

const AnalyzeBehavioralDiscrepanciesOutputSchema = z.object({
  discrepancies: z.array(DiscrepancyDetailSchema),
});
export type AnalyzeBehavioralDiscrepanciesOutput = z.infer<typeof AnalyzeBehavioralDiscrepanciesOutputSchema>;

function formatAnalyzePrompt(input: AnalyzeBehavioralDiscrepanciesInput): string {
  const plannedText = input.plannedIntentions.map(i => 
    `- ${i.description} (Effort: ${i.expectedEffort || 'N/A'})`
  ).join('\n');

  const actualText = input.actualBehaviors.map(b => 
    `- ${b.description} (Status: ${b.completionStatus})`
  ).join('\n');

  return `You are a diagnostic AI tool named "Discrepancy Auditor".
Compare a user's planned intentions with their actual recorded behaviors.
Identify deviations and explain *why* they occurred, focusing on root causes and inconsistency patterns.

**Planned Intentions:**
${plannedText}

**Actual Behaviors:**
${actualText}

**Context:**
${input.analysisContext || ''}

Return a JSON analysis focusing on empathy and insight.

### Output format:
Return a JSON object with the following fields:
{
  "discrepancies": [
    {
      "plannedItem": {
        "id": "<string intention id>",
        "description": "<string title>"
      },
      "actualOutcome": {
        "id": "<string log id optional>",
        "description": "<string title optional>",
        "completionStatus": "completed" | "partially_completed" | "not_started" | "deviated"
      },
      "deviationExplanation": "<string explanation of why the action deviated>",
      "inconsistencyReason": "<string root cause pattern>",
      "suggestedInsight": "<string tip or recommendation>"
    }
  ]
}
Do NOT return a JSON Schema wrapper (like "type", "properties", etc.). Just return the flat JSON object itself.`;
}

export async function analyzeBehavioralDiscrepancies(input: AnalyzeBehavioralDiscrepanciesInput): Promise<AnalyzeBehavioralDiscrepanciesOutput> {
  const prompt = formatAnalyzePrompt(input);
  const text = await queryOllama(prompt, 'json');
  
  let parsed: any;
  try {
    parsed = cleanAndParseJson(text);
  } catch (e) {
    console.error("[analyzeBehavioralDiscrepancies] JSON Parsing Failed. Raw text was:", text);
    throw new Error('Failed to parse Gemma output as JSON: ' + (e as Error).message);
  }

  // Normalize structure and handle schema wrappers or key variants
  if (parsed && typeof parsed === 'object') {
    if ('properties' in parsed && typeof parsed.properties === 'object') {
      const props = parsed.properties;
      parsed = {
        discrepancies: props.discrepancies?.default ?? props.discrepancies ?? [],
      };
    }

    // Ensure discrepancies is an array
    if (!Array.isArray(parsed.discrepancies)) {
      parsed.discrepancies = parsed.discrepancies ? [parsed.discrepancies] : [];
    }

    // Normalize discrepancy items
    parsed.discrepancies = parsed.discrepancies.map((item: any) => {
      if (item && typeof item === 'object') {
        const plannedItem = item.plannedItem ?? item.planned_item ?? {};
        const actualOutcome = item.actualOutcome ?? item.actual_outcome ?? {};
        return {
          plannedItem: {
            id: String(plannedItem.id ?? ''),
            description: String(plannedItem.description ?? ''),
          },
          actualOutcome: actualOutcome ? {
            id: actualOutcome.id ? String(actualOutcome.id) : undefined,
            description: actualOutcome.description ? String(actualOutcome.description) : undefined,
            completionStatus: actualOutcome.completionStatus ?? actualOutcome.completion_status ?? undefined,
          } : undefined,
          deviationExplanation: String(item.deviationExplanation ?? item.deviation_explanation ?? ''),
          inconsistencyReason: String(item.inconsistencyReason ?? item.inconsistency_reason ?? ''),
          suggestedInsight: String(item.suggestedInsight ?? item.suggested_insight ?? ''),
        };
      }
      return item;
    });
  }

  parsed = sanitizeNulls(parsed);

  return AnalyzeBehavioralDiscrepanciesOutputSchema.parse(parsed);
}

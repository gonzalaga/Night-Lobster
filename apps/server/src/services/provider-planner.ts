import { z } from "zod";
import { env } from "../config/env.js";

const impactSchema = z.enum(["low", "medium", "high"]);

export const providerAssumptionSchema = z.object({
  statement: z.string().min(1),
  confidence: z.number().min(0).max(1),
  impact_if_wrong: impactSchema,
  needs_confirmation: z.boolean().default(true)
});

const providerPlanSchema = z.object({
  plan_summary: z.string().min(1),
  execution_steps: z.array(z.string().min(1)).min(3).max(6),
  risks: z.array(z.string().min(1)).max(3),
  assumptions: z.array(providerAssumptionSchema).max(3)
});

const providerSynthesisSchema = z.object({
  objective_result: z.string().min(1),
  delta_summary: z.array(z.string().min(1)).min(1).max(3),
  recommendations: z
    .array(
      z.object({
        text: z.string().min(1),
        confidence: z.number().min(0).max(1),
        tradeoffs: z.array(z.string().min(1)).max(3)
      })
    )
    .min(1)
    .max(3),
  decisions: z.array(z.string().min(1)).min(1).max(3),
  assumptions: z.array(providerAssumptionSchema).max(3)
});

export type ProviderPlan = z.infer<typeof providerPlanSchema>;
export type ProviderSynthesis = z.infer<typeof providerSynthesisSchema>;

export type ProviderMode = "provider" | "fallback";

export type ProviderMeta = {
  mode: ProviderMode;
  planner_model: string;
  synthesizer_model: string;
  planner_source: "openai" | "fallback";
  synthesizer_source: "openai" | "fallback";
};

function extractJsonBlock(content: string): string {
  const fenced = content.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstCurly = content.indexOf("{");
  const lastCurly = content.lastIndexOf("}");
  if (firstCurly >= 0 && lastCurly > firstCurly) {
    return content.slice(firstCurly, lastCurly + 1);
  }

  return content;
}

async function callOpenAIJson(args: {
  system: string;
  user: string;
  model: string;
}): Promise<unknown> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: args.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user }
      ]
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI request failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = body.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("OpenAI response did not include message content");
  }

  const jsonText = extractJsonBlock(content);
  return JSON.parse(jsonText);
}

export function getProviderMeta(): ProviderMeta {
  const model = env.OPENAI_MODEL;
  return {
    mode: env.OPENAI_API_KEY ? "provider" : "fallback",
    planner_model: model,
    synthesizer_model: model,
    planner_source: env.OPENAI_API_KEY ? "openai" : "fallback",
    synthesizer_source: env.OPENAI_API_KEY ? "openai" : "fallback"
  };
}

export async function generateProviderPlan(input: {
  objective: string;
  goalLinks: string[];
  openQuestions: string[];
  successCriteria: string[];
}): Promise<{ data: ProviderPlan; meta: ProviderMeta }> {
  const fallback = {
    plan_summary: "Fallback plan: gather evidence, synthesize options, package decisions.",
    execution_steps: [
      "Gather repository and context evidence",
      "Score evidence quality and identify assumptions",
      "Draft recommendations with tradeoffs",
      "Package morning decisions"
    ],
    risks: ["Insufficient high-quality evidence", "Scope drift", "Ambiguous success criteria"],
    assumptions: [
      {
        statement: input.openQuestions[0] ?? "A single checkpoint will yield actionable insight",
        confidence: 0.6,
        impact_if_wrong: "high" as const,
        needs_confirmation: true
      }
    ]
  };

  if (!env.OPENAI_API_KEY) {
    return {
      data: providerPlanSchema.parse(fallback),
      meta: getProviderMeta()
    };
  }

  try {
    const payload = await callOpenAIJson({
      model: env.OPENAI_MODEL,
      system:
        "You are a product strategy planner. Return strict JSON only. No markdown. Keep output concise and executable.",
      user: JSON.stringify({
        objective: input.objective,
        goal_links: input.goalLinks,
        open_questions: input.openQuestions,
        success_criteria: input.successCriteria,
        required_json_schema: {
          plan_summary: "string",
          execution_steps: "string[3..6]",
          risks: "string[0..3]",
          assumptions: [
            {
              statement: "string",
              confidence: "number(0..1)",
              impact_if_wrong: "low|medium|high",
              needs_confirmation: "boolean"
            }
          ]
        }
      })
    });

    return {
      data: providerPlanSchema.parse(payload),
      meta: getProviderMeta()
    };
  } catch {
    return {
      data: providerPlanSchema.parse(fallback),
      meta: {
        ...getProviderMeta(),
        mode: "fallback",
        planner_source: "fallback"
      }
    };
  }
}

export async function generateProviderSynthesis(input: {
  objective: string;
  goalLinks: string[];
  evidence: Array<{ citation: string; qualityScore: number; excerpt: string }>;
  planSummary: string;
}): Promise<{ data: ProviderSynthesis; meta: ProviderMeta }> {
  const fallback = {
    objective_result: "Completed with bounded recommendations",
    delta_summary: [
      "Gathered repository/context evidence",
      "Synthesized recommendations with tradeoffs"
    ],
    recommendations: [
      {
        text: `Run a focused validation experiment for: ${input.objective}`,
        confidence: 0.73,
        tradeoffs: ["Requires instrumentation time", "Results need observation window"]
      },
      {
        text: "Ship scoped documentation + patch artifact for next implementation step",
        confidence: 0.69,
        tradeoffs: ["Documentation-first output", "Needs follow-up coding task"]
      },
      {
        text: "Prioritize one build slice with explicit success metric",
        confidence: 0.65,
        tradeoffs: ["Less parallel exploration", "Higher decision clarity"]
      }
    ],
    decisions: [
      "Choose experiment success threshold",
      "Approve documentation-backed patch scope",
      "Confirm next slice priority for tomorrow"
    ],
    assumptions: [
      {
        statement: "Most impact can be isolated to one checkpoint",
        confidence: 0.61,
        impact_if_wrong: "high" as const,
        needs_confirmation: true
      }
    ]
  };

  if (!env.OPENAI_API_KEY) {
    return {
      data: providerSynthesisSchema.parse(fallback),
      meta: getProviderMeta()
    };
  }

  try {
    const payload = await callOpenAIJson({
      model: env.OPENAI_MODEL,
      system:
        "You are a product synthesis assistant. Return strict JSON only. Prioritize decision-readiness and bounded recommendations.",
      user: JSON.stringify({
        objective: input.objective,
        goal_links: input.goalLinks,
        plan_summary: input.planSummary,
        evidence: input.evidence,
        required_json_schema: {
          objective_result: "string",
          delta_summary: "string[1..3]",
          recommendations: [
            {
              text: "string",
              confidence: "number(0..1)",
              tradeoffs: "string[0..3]"
            }
          ],
          decisions: "string[1..3]",
          assumptions: [
            {
              statement: "string",
              confidence: "number(0..1)",
              impact_if_wrong: "low|medium|high",
              needs_confirmation: "boolean"
            }
          ]
        }
      })
    });

    return {
      data: providerSynthesisSchema.parse(payload),
      meta: getProviderMeta()
    };
  } catch {
    return {
      data: providerSynthesisSchema.parse(fallback),
      meta: {
        ...getProviderMeta(),
        mode: "fallback",
        synthesizer_source: "fallback"
      }
    };
  }
}

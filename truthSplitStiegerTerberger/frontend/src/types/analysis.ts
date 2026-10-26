export type Position = "support" | "oppose" | "conditional";
export type Severity = "high" | "medium" | "low";
export type Worldview = "libertarian" | "religious_conservative" | "eco_justice" | "populist_nationalist" | "communist";

export interface DetailedConcern {
  concern: string;
  explanation: string;
  related_value?: string;
}

export interface AssumptionDetail {
  assumption: string;
  core_value: string;
  relevance: string;
}

export interface ReasoningStep {
  step_number: number;
  description: string;
  connects_to: "core_values" | "beliefs" | "interpretation" | "conclusion";
}

export interface WorldviewAnalysis {
  position: Position;
  interpretation?: string; // How the worldview interprets the claim
  reasoning: string;
  reasoning_chain?: ReasoningStep[]; // Step-by-step logical chain from core values to position
  key_assumptions: string[];
  assumption_details?: AssumptionDetail[]; // Full assumption objects with relevance
  detailed_concerns?: DetailedConcern[]; // Structured concerns with explanations
  alternative_approach?: string; // Alternative solution preferred by this worldview
  consistency_scores: {
    premise_claim: number;
    worldview_internal: number;
  };
  confidence: number;
}

export interface ValueConflict {
  worldview1: string;
  worldview2: string;
  conflicting_value1: string;
  conflicting_value2: string;
  conflict_type?: "zero-sum" | "priority" | "definition";
  detailed_explanation?: string;
  impact?: string;
}

export interface AssumptionConflict {
  worldview?: string;
  position?: string;
  assumptions?: string[];
  why_conflicting?: string;
  root_belief?: string;
}

export interface DisagreementDimension {
  dimension_name: string;
  wv1_position: string;
  wv2_position: string;
  gap_size: "large" | "medium" | "small";
  why_matters: string;
}

export interface CommonGround {
  shared_concerns: string;
  potential_bridge_points: string;
}

export interface DivergenceAnalysis {
  claim_id: string;
  severity: Severity;
  explanation: string;
  value_conflicts: Array<ValueConflict>;
  assumption_conflicts: Array<AssumptionConflict | string>; // Support both old (string) and new (object) formats
  disagreement_dimensions?: DisagreementDimension[];
  common_ground?: CommonGround;
}

export interface ConvergenceStep {
  step_number: number;
  step_name: string;
  convergence_type: "convergent" | "partial" | "divergent";
  explanation: string;
  worldview_positions: Array<{
    worldview_id: string;
    position: string;
  }>;
  shared_aspect?: string;
  divergent_aspect?: string;
}

export interface ConvergenceAnalysis {
  claim_id: string;
  steps: ConvergenceStep[];
  primary_divergence_point: number;
  key_insight: string;
}

export interface Claim {
  claim_id: string;
  claim_text: string;
  premises: string[];
  worldview_analyses: {
    [key in Worldview]?: WorldviewAnalysis;
  };
}

export interface AnalysisResult {
  claims: Claim[];
  divergence_analysis: DivergenceAnalysis[];
}

// Factor scores come from CSV - no hardcoded factor names
// This is a flexible type that accepts any factor keys from the CSV
export type WorldviewFactors = Record<string, number>;

export interface WorldviewInfo {
  id: Worldview;
  name: string;
  description: string;
  keyValues: string[];
  icon: string;
  color: string;
  factors: WorldviewFactors;
}

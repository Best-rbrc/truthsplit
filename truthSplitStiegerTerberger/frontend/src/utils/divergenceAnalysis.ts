import { DivergenceAnalysis, Claim, Worldview } from "@/types/analysis";

type ModelType = "local" | "llm";

/**
 * Analyze divergence using local models (rule-based with embeddings)
 */
const analyzeDivergenceLocal = async (
  claims: Claim[],
  selectedWorldviews: Worldview[]
): Promise<DivergenceAnalysis[]> => {
  // TODO: Implement local divergence analysis using @huggingface/transformers
  // Use embeddings to compute semantic similarity and detect conflicts
  console.log("Using local models for divergence analysis");
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock divergence analysis
  return claims.slice(0, 2).map((claim, index) => ({
    claim_id: claim.claim_id,
    severity: (["high", "medium", "low"] as const)[index % 3],
    explanation: `Local analysis detected divergence in ${claim.claim_text.slice(0, 50)}...`,
    value_conflicts: [
      {
        worldview1: selectedWorldviews[0],
        worldview2: selectedWorldviews[1],
        conflicting_value1: "Individual liberty",
        conflicting_value2: "Collective responsibility"
      }
    ],
    assumption_conflicts: [
      "Different baseline assumptions about human nature",
      "Conflicting views on role of institutions"
    ]
  }));
};

/**
 * Analyze divergence using cloud LLM
 */
const analyzeDivergenceLLM = async (
  claims: Claim[],
  selectedWorldviews: Worldview[]
): Promise<DivergenceAnalysis[]> => {
  // TODO: Replace with your actual backend API endpoint
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  const response = await fetch(`${API_BASE_URL}/analyze-divergence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claims, selectedWorldviews })
  });
  
  if (!response.ok) {
    throw new Error("Failed to analyze divergence using LLM");
  }
  
  const data = await response.json();
  return data.divergence_analysis;
};

/**
 * Main divergence analysis function that routes to the appropriate model
 */
export const analyzeDivergence = async (
  claims: Claim[],
  selectedWorldviews: Worldview[],
  modelType: ModelType = "llm"
): Promise<DivergenceAnalysis[]> => {
  if (modelType === "local") {
    return analyzeDivergenceLocal(claims, selectedWorldviews);
  } else {
    return analyzeDivergenceLLM(claims, selectedWorldviews);
  }
};
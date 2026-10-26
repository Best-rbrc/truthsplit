/**
 * API utilities for connecting to TruthSplit backend
 */

import { Worldview, AnalysisResult, ConvergenceAnalysis } from "@/types/analysis";

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Convert frontend model IDs and provider names to OpenRouter format
 */
const convertToOpenRouterModel = (llmModel: string, llmProvider: string): string => {
  const modelMap: { [key: string]: { [key: string]: string } } = {
    openai: {
      "gpt-5": "openai/gpt-4o",
      "gpt-5-mini": "openai/gpt-4o-mini",
      "gpt-5-nano": "openai/gpt-4o-mini"
    },
    claude: {
      "claude-haiku-4-5-20251001": "anthropic/claude-opus-4.5",
      "claude-sonnet-4-5-20250929": "anthropic/claude-sonnet-4.5",
      "claude-opus-4-5-20251101": "anthropic/claude-opus-4.5"
    },
    gemini: {
      "gemini-2.5-pro": "google/gemini-2.5-pro",
      "gemini-2.5-flash": "google/gemini-2.5-flash",
      "gemini-2.5-flash-lite": "google/gemini-2.5-flash-lite"
    },
    grok: {
      "grok-4": "x-ai/grok-4",
      "grok-3": "x-ai/grok-3",
      "grok-3-mini": "x-ai/grok-3-mini"
    },
    deepseek: {
      "deepseek-v3": "deepseek/deepseek-chat-v3-0324"
    }
  };
  
  const providerMap = modelMap[llmProvider];
  if (!providerMap) {
    console.warn(`Unknown provider: ${llmProvider}, using as-is`);
    return `${llmProvider}/${llmModel}`;
  }
  
  const openrouterId = providerMap[llmModel];
  if (!openrouterId) {
    console.warn(`Unknown model: ${llmModel} for provider ${llmProvider}, using as-is`);
    return `${llmProvider}/${llmModel}`;
  }
  
  return openrouterId;
};

export interface BackendAnalysisResult {
  base_analysis: any;
  llm_analysis: {
    worldview_analyses: Record<string, any>;
    comparison_analysis: any;
    divergence_analysis: any;
  };
  selected_claims: string[];
  selected_worldviews: string[];
}

export interface SavedAnalysisPayload {
  analysis_result: AnalysisResult;
  analysis_text: string;
  selected_worldviews: Worldview[];
  convergence_data?: Record<string, ConvergenceAnalysis>;
  title?: string;
}

export interface SavedAnalysisResponse extends SavedAnalysisPayload {
  slug: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch with extended timeout for long-running analyses (30 minutes)
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 1800000 // 30 minutes default
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000 / 60} minutes. The analysis is still running on the server.`);
    }
    throw error;
  }
}

/**
 * Run full worldview analysis via backend API
 */
export const runAnalysis = async (
  text: string,
  selectedClaimIds: string[],
  selectedWorldviews: Worldview[],
  useOpenAI: boolean = true,
  useOpenAIForExtraction: boolean = true,
  useLocalDivergence: boolean = false,
  useGemmaSteering: boolean = false,
  worldviewStrengths?: Record<Worldview, number>,
  saeLayerIndex?: number,
  hookLayerIndex?: number,
  llmModel: string = "gpt-5-mini",
  llmProvider: string = "openai",
): Promise<BackendAnalysisResult> => {
  // Use extended timeout for Gemma steering (30 minutes), shorter for regular analysis (10 minutes)
  const timeoutMs = useGemmaSteering ? 1800000 : 600000; // 30 min for Gemma, 10 min for regular
  
  // Convert to OpenRouter model ID format
  const openrouterModel = convertToOpenRouterModel(llmModel, llmProvider);
  
  console.log(`⏱️ Starting analysis request with ${timeoutMs / 1000 / 60} minute timeout...`);
  
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/api/analyze`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        selected_claim_ids: selectedClaimIds,
        selected_worldviews: selectedWorldviews,
        use_openai: useOpenAI,
        use_openai_extraction: useOpenAIForExtraction,
        use_local_divergence: useLocalDivergence,
        use_gemma_steering: useGemmaSteering,
        worldview_strengths: worldviewStrengths,
        sae_layer_index: saeLayerIndex,
        hook_layer_index: hookLayerIndex,
        llm_model: openrouterModel,  // Send OpenRouter model ID
        llm_provider: "openrouter",  // Always use openrouter on backend
      }),
    },
    timeoutMs
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || "Failed to run analysis");
  }

  return await response.json();
};

/**
 * Transform backend result to frontend format
 */
export const transformBackendResult = (backendResult: BackendAnalysisResult) => {
  // Add null checks
  if (!backendResult) {
    console.error("❌ Backend result is null or undefined");
    return {
      claims: [],
      divergence_analysis: []
    };
  }
  
  const { llm_analysis, base_analysis, selected_claims } = backendResult;
  
  // Check if llm_analysis exists
  if (!llm_analysis) {
    console.error("❌ llm_analysis is missing from backend result");
    return {
      claims: [],
      divergence_analysis: []
    };
  }
  
  const { worldview_analyses, divergence_analysis } = llm_analysis;
  
  // Get all claims from base_analysis, filter by selected if provided
  const allClaims = (base_analysis?.claims || []);
  const filteredClaims = (selected_claims && selected_claims.length > 0)
    ? allClaims.filter((claim: any) => selected_claims.includes(claim.id))
    : allClaims;
  
  // Transform claims with worldview analyses
  const claims = filteredClaims.map((claim: any, claimIndex: number) => {
    const claimAnalyses: Record<string, any> = {};
    
    // Find the original index in base_analysis.claims for this claim
    const originalIndex = allClaims.findIndex((c: any) => c.id === claim.id);
    
    // Extract worldview analyses for this claim
    if (worldview_analyses) {
      Object.entries(worldview_analyses).forEach(([worldviewId, analysis]: [string, any]) => {
        if (!analysis) return;
        
        const claimAnalyses_list = analysis.claim_analyses || [];
        
        // Use original index to get the correct analysis
        if (originalIndex >= 0 && claimAnalyses_list[originalIndex]) {
          const claimAnalysis = claimAnalyses_list[originalIndex];
        
        // Skip if there's an error
        if (claimAnalysis.error) {
          return;
        }
        
        // Extract assumptions - prioritize LLM-generated key_assumptions
        // The backend now explicitly extracts worldview-specific assumptions via LLM
        let assumptions: string[] = claimAnalysis.assumptions || [];
        
        // Ensure assumptions are clean strings (not objects)
        assumptions = assumptions.map((a: any) => {
          if (typeof a === 'string') return a;
          if (a && typeof a === 'object') {
            // Handle various assumption object formats
            return a.text || a.desc || a.description || a.name || JSON.stringify(a);
          }
          return String(a);
        });
        
        // Filter out empty or too-short assumptions
        assumptions = assumptions.filter(a => a.trim().length > 10 && a.trim().length < 200);
        
        // If still no good assumptions, try to extract from reasoning as fallback
        if (assumptions.length === 0 && claimAnalysis.reasoning) {
          const reasoning = claimAnalysis.reasoning;
          // Split by sentences and take meaningful ones
          const sentences = reasoning
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 20 && s.length < 150)
            .slice(0, 3);
          assumptions = sentences;
        }
        
        // Final fallback: use concerns or alternative_approach as assumptions
        if (assumptions.length === 0) {
          if (claimAnalysis.concerns) {
            assumptions = [claimAnalysis.concerns];
          } else if (claimAnalysis.alternative_approach) {
            assumptions = [claimAnalysis.alternative_approach];
          }
        }
        
        // Ensure we have at least 3 assumptions for a good Sankey diagram
        if (assumptions.length < 3 && claimAnalysis.reasoning) {
          // Try to extract more from reasoning
          const reasoning = claimAnalysis.reasoning;
          const additionalSentences = reasoning
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 15 && s.length < 120 && !assumptions.includes(s))
            .slice(0, 3 - assumptions.length);
          assumptions = [...assumptions, ...additionalSentences];
        }
        
        claimAnalyses[worldviewId] = {
          position: (claimAnalysis.position || 'conditional').toLowerCase() as 'support' | 'oppose' | 'conditional',
          interpretation: claimAnalysis.interpretation || undefined,
          reasoning: claimAnalysis.reasoning || claimAnalysis.interpretation || '',
          reasoning_chain: claimAnalysis.reasoning_chain || undefined,  // Step-by-step logical chain
          key_assumptions: assumptions,
          assumption_details: claimAnalysis.assumption_details || undefined,  // Full assumption objects with relevance
          detailed_concerns: claimAnalysis.detailed_concerns || undefined,  // Structured concerns with explanations
          alternative_approach: claimAnalysis.alternative_approach || undefined,
          consistency_scores: {
            premise_claim: claimAnalysis.consistency_data?.premise_claim_consistency || 0.5,
            worldview_internal: claimAnalysis.consistency_data?.worldview_internal_consistency || 0.5,
          },
          confidence: claimAnalysis.confidence || 0.5,
        };
        }
      });
    }
    
    return {
      claim_id: claim.id || `C${claimIndex + 1}`,
      claim_text: claim.text || '',
      premises: (claim.premises || []).map((p: any) => {
        if (typeof p === 'string') return p;
        if (p && typeof p === 'object') {
          // Handle various premise object formats
          return p.text || p.desc || p.description || p.name || JSON.stringify(p);
        }
        return String(p);
      }).filter((p: string) => p.trim().length > 0) || [],
      worldview_analyses: claimAnalyses,
    };
  });
  
  // Transform divergence analysis
  const divergenceDetails = divergence_analysis?.divergence_details || [];
  const transformedDivergence = divergenceDetails.map((div: any) => {
    const claimIndex = div.claim_index !== undefined ? div.claim_index : 0;
    const claim = allClaims[claimIndex];
    
    // Normalize severity to valid values
    let severity = (div.severity || 'medium').toLowerCase();
    if (severity === 'moderate') severity = 'medium'; // Handle backend returning 'moderate'
    if (!['high', 'medium', 'low'].includes(severity)) severity = 'medium';
    
    return {
      claim_id: claim?.id || `C${claimIndex + 1}`,
      severity: severity as 'high' | 'medium' | 'low',
      explanation: div.explanation || '',
      value_conflicts: Array.isArray(div.value_conflicts) ? div.value_conflicts : [],
      assumption_conflicts: Array.isArray(div.assumption_conflicts) ? div.assumption_conflicts : [],
      disagreement_dimensions: div.disagreement_dimensions || undefined,
      common_ground: div.common_ground || undefined,
    };
  });
  
  const result = {
    claims,
    divergence_analysis: transformedDivergence || [],
  };
  
  console.log("✅ Transform complete:", {
    claimsCount: result.claims.length,
    divergenceCount: result.divergence_analysis.length,
    sample: result.claims[0]
  });
  
  return result;
};

/**
 * Save an analysis by slug (backend persists it)
 */
export const saveAnalysisBySlug = async (
  slug: string,
  payload: SavedAnalysisPayload,
  overwrite: boolean = false
): Promise<SavedAnalysisResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/analyses/${slug}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, overwrite }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to save analysis (HTTP ${response.status})`);
  }

  return response.json();
};

/**
 * Load a saved analysis by slug
 */
export const loadAnalysisBySlug = async (slug: string): Promise<SavedAnalysisResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/analyses/${slug}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to load analysis (HTTP ${response.status})`);
  }

  return response.json();
};

/**
 * Delete a saved analysis by slug
 */
export const deleteAnalysisBySlug = async (slug: string, deleteSecret: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/analyses/${slug}`, {
    method: "DELETE",
    headers: {
      "X-Delete-Secret": deleteSecret,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete analysis (HTTP ${response.status})`);
  }
};

/**
 * Fetch worldviews with factor scores from backend API
 */
export const fetchWorldviews = async (): Promise<{worldviews: any[], factorColumns: string[]}> => {
  console.log(`🔍 Fetching worldviews from: ${API_BASE_URL}/api/worldviews`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/worldviews`);
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch worldviews: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.worldviews?.length || 0} worldviews`);
    
    return {
      worldviews: data.worldviews || [],
      factorColumns: data.factor_columns || []
    };
  } catch (error) {
    console.error('❌ Error fetching worldviews:', error);
    throw error;
  }
};

/**
 * Generate convergence analysis for a specific claim (on-demand)
 */
export const generateConvergenceAnalysis = async (
  claim_id: string,
  claim_text: string,
  worldview_analyses: Record<string, any>,
  llmModel: string = "anthropic/claude-opus-4.5",
  llmProvider: string = "openrouter"
): Promise<any> => {
  console.log(`🔄 Generating convergence analysis for claim: ${claim_id}...`);
  
  const response = await fetch(`${API_BASE_URL}/api/analyze-convergence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claim_id,
      claim_text,
      worldview_analyses,
      llm_model: llmModel,
      llm_provider: llmProvider
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || "Failed to generate convergence analysis");
  }

  const result = await response.json();
  console.log(`✅ Convergence analysis completed for claim: ${claim_id}`);
  return result.convergence_analysis;
};

/**
 * Send a chat message to a worldview-based AI
 */
export const sendChatMessage = async (
  worldviewId: string,
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>,
  analysisContext: any,
  llmProvider: string = "openrouter",
  llmModel?: string
): Promise<string> => {
  console.log(`💬 Sending chat message to ${worldviewId}...`);
  
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      worldview_id: worldviewId,
      message,
      conversation_history: conversationHistory,
      analysis_context: analysisContext,
      llm_model: llmModel,
      llm_provider: llmProvider
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || "Failed to get chat response");
  }

  const result = await response.json();
  console.log(`✅ Chat response received from ${worldviewId}`);
  return result.response;
};


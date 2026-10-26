interface ExtractedClaim {
  id: string;
  text: string;
  premises: string[];
}

type ModelType = "local" | "llm" | "gemma";

/**
 * Convert frontend model IDs and provider names to OpenRouter format
 * Frontend uses simple names like "gpt-4o-mini" and "claude"
 * OpenRouter needs full IDs like "openai/gpt-4o-mini" and "anthropic/claude-haiku-4-5-20251001"
 */
const convertToOpenRouterModel = (llmModel: string, llmProvider: string): string => {
  // Mapping of frontend model IDs to OpenRouter model IDs
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

/**
 * Extract claims using local ML models (BART + sentence embeddings on backend)
 * Uses the backend's local models instead of OpenAI
 */
const extractClaimsLocal = async (text: string, llmModel?: string): Promise<ExtractedClaim[]> => {
  console.log("🤖 Using local models (BART classifier + embeddings) for claim extraction");
  
  // Use environment variable or default to empty string (for proxy in dev, or full URL in production)
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/extract-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text,
        use_openai: false,  // Use local BART models instead of OpenAI
        llm_model: llmModel
      })
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Special handling for 404 - API server might not be running
      if (response.status === 404) {
        const apiUrl = API_BASE_URL || 'http://localhost:5001';
        errorMessage = `API endpoint not found (404). Please ensure the API server is running at ${apiUrl}. Start it with: python api_server.py`;
      } else {
        try {
          // Read response as text first (can be parsed as JSON later if needed)
          const responseText = await response.text();
          if (responseText) {
            // Try to parse as JSON
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              // Not JSON, use the text as error message
              errorMessage = responseText.substring(0, 200);
            }
          }
        } catch (e) {
          // If we can't read the response, keep the default error message
          console.error('Failed to read error response:', e);
        }
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log(`✅ Local extraction complete: ${data.claims.length} claims found`);
    return data.claims;
  } catch (error) {
    if (error instanceof Error) {
      // If it's already an Error with a message, re-throw it
      throw error;
    }
    // Handle network errors, CORS errors, etc.
    throw new Error(`Network error: ${error instanceof Error ? error.message : String(error)}. Please check if the API server is running at ${API_BASE_URL || 'http://localhost:5001'}`);
  }
};

/**
 * Extract claims using cloud LLM via backend API
 */
const extractClaimsLLM = async (text: string, llmModel?: string, llmProvider?: string): Promise<ExtractedClaim[]> => {
  // Use environment variable or default to empty string (for proxy in dev, or full URL in production)
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  
  // Convert to OpenRouter model ID format
  const openrouterModel = convertToOpenRouterModel(llmModel || "gpt-4o-mini", llmProvider || "openai");
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/extract-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text,
        use_openai: true,  // Normal mode uses OpenRouter
        llm_model: openrouterModel,  // Send OpenRouter model ID
        llm_provider: "openrouter"  // Always use openrouter on backend
      })
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Special handling for 404 - API server might not be running
      if (response.status === 404) {
        const apiUrl = API_BASE_URL || 'http://localhost:5001';
        errorMessage = `API endpoint not found (404). Please ensure the API server is running at ${apiUrl}. Start it with: python api_server.py`;
      } else {
        try {
          // Read response as text first (can be parsed as JSON later if needed)
          const responseText = await response.text();
          if (responseText) {
            // Try to parse as JSON
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              // Not JSON, use the text as error message
              errorMessage = responseText.substring(0, 200);
            }
          }
        } catch (e) {
          // If we can't read the response, keep the default error message
          console.error('Failed to read error response:', e);
        }
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.claims;
  } catch (error) {
    if (error instanceof Error) {
      // If it's already an Error with a message, re-throw it
      throw error;
    }
    // Handle network errors, CORS errors, etc.
    throw new Error(`Network error: ${error instanceof Error ? error.message : String(error)}. Please check if the API server is running at ${API_BASE_URL || 'http://localhost:5001'}`);
  }
};

/**
 * Main extraction function that routes to the appropriate model
 */
export const extractClaims = async (
  text: string, 
  modelType: ModelType = "llm",
  llmModel: string = "claude-opus-4-5-20251101",
  llmProvider: string = "claude"
): Promise<ExtractedClaim[]> => {
  if (modelType === "local") {
    return extractClaimsLocal(text, llmModel);
  } else {
    return extractClaimsLLM(text, llmModel, llmProvider);
  }
};
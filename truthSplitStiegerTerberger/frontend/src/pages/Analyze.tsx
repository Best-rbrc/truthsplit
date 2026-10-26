import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { TextInput } from "@/components/analysis/TextInput";
import { ClaimSelection } from "@/components/analysis/ClaimSelection";
import { WorldviewSelection } from "@/components/analysis/WorldviewSelection";
import { ModeSelector, AnalysisMode } from "@/components/analysis/ModeSelector";
import { AdvancedSettings, AdvancedSettingsConfig, ModelType, LLMModel, LLMProvider } from "@/components/analysis/AdvancedSettings";
import { Worldview } from "@/types/analysis";
import { extractClaims } from "@/utils/claimExtraction";
import { runAnalysis, transformBackendResult } from "@/utils/analysisApi";
import { useToast } from "@/hooks/use-toast";
import { NewsArticle } from "@/utils/newsApi";

type Step = "input" | "claim-selection" | "worldview-selection";

interface ExtractedClaim {
  id: string;
  text: string;
  premises: string[];
}

const AVAILABLE_GEMMA_LAYERS = [0, 6, 10, 12, 17];

const Analyze = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [step, setStep] = useState<Step>("input");
  const [text, setText] = useState("");
  const [extractedClaims, setExtractedClaims] = useState<ExtractedClaim[]>([]);
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState<AnalysisMode>("normal");
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettingsConfig>({
    claimExtractionModel: "llm",
    divergenceAnalysisModel: "llm",
    reasoningAnalysisModel: "llm",
    llmProvider: "openai",
    llmModel: "gpt-5-mini",
  });
  // Default Gemma layer configuration (can be overridden in worldview selection UI)
  const [saeLayerIndex, setSaeLayerIndex] = useState<number>(6);
  const [hookLayerIndex, setHookLayerIndex] = useState<number>(6);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleTextContinue = async (inputText: string) => {
    setText(inputText);
    setIsExtracting(true);
    
    try {
      const modelType = mode === "advanced" ? advancedSettings.claimExtractionModel : "llm";
      const llmModel = mode === "advanced" ? advancedSettings.llmModel : "gpt-5-mini";
      const llmProvider = mode === "advanced" ? advancedSettings.llmProvider : "openai";
      const claims = await extractClaims(inputText, modelType, llmModel, llmProvider);
      setExtractedClaims(claims);
      // Only advance to claim-selection step after successful extraction
      setStep("claim-selection");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to extract claims. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleClaimSelection = (claimIds: string[]) => {
    setSelectedClaimIds(claimIds);
    setStep("worldview-selection");
  };

  const handleArticleSelect = (article: NewsArticle) => {
    // Combine title, description, and content for analysis
    const articleText = [
      article.title,
      article.description,
      article.content
    ].filter(Boolean).join('\n\n');
    
    setText(articleText);
    setStep("input");
    // Clear previous claims since we're starting with new text
    setExtractedClaims([]);
    setSelectedClaimIds([]);
  };

  const handleAnalyze = async (
    selectedWorldviews: Worldview[],
    worldviewStrengths?: Record<Worldview, number>,
    layerConfig?: { saeLayer: number; hookLayer: number }
  ) => {
    // Safety cap: never send more than three perspectives to the backend
    const cappedWorldviews = selectedWorldviews.slice(0, 3);
    setIsAnalyzing(true);
    
    try {
      // Determine if we should use OpenAI for reasoning based on mode
      const useOpenAI = mode === "normal" || (mode === "advanced" && advancedSettings.reasoningAnalysisModel === "llm");
      
      // Determine if we used OpenAI for claim extraction (must match the extraction step)
      const useOpenAIForExtraction = mode === "normal" || (mode === "advanced" && advancedSettings.claimExtractionModel === "llm");
      
      // Determine if we should use local divergence analysis
      const useLocalDivergence = mode === "advanced" && advancedSettings.divergenceAnalysisModel === "local";
      
      // Determine if we should use Gemma steering
      const useGemmaSteering = mode === "advanced" && advancedSettings.reasoningAnalysisModel === "gemma";

      // Determine SAE / hook layer configuration (only relevant for Gemma mode)
      const effectiveSaeLayer =
        layerConfig?.saeLayer ?? saeLayerIndex ?? AVAILABLE_GEMMA_LAYERS[0];
      const effectiveHookLayer =
        layerConfig?.hookLayer ?? hookLayerIndex ?? effectiveSaeLayer;
      
      // Get LLM model and provider to use
      const llmModel = mode === "advanced" ? advancedSettings.llmModel : "gpt-5-mini";
      const llmProvider = mode === "advanced" ? advancedSettings.llmProvider : "openai";
      
      // Call backend API
      const backendResult = await runAnalysis(
        text,
        selectedClaimIds,
        cappedWorldviews,
        useOpenAI,
        useOpenAIForExtraction,
        useLocalDivergence,
        useGemmaSteering,
        worldviewStrengths,
        useGemmaSteering ? effectiveSaeLayer : undefined,
        useGemmaSteering ? effectiveHookLayer : undefined,
        llmModel,
        llmProvider,
      );
      
      console.log("📥 Backend result received:", backendResult);
      console.log("Divergence details:", backendResult.llm_analysis?.divergence_analysis?.divergence_details);
      
      // Transform backend result to frontend format
      let transformedResult;
      try {
        transformedResult = transformBackendResult(backendResult);
        console.log("📤 Transformed result:", transformedResult);
        console.log("Transformed divergence:", transformedResult.divergence_analysis);
        
        // Validate transformed result
        if (!transformedResult || !transformedResult.claims || !Array.isArray(transformedResult.claims)) {
          throw new Error("Invalid transformed result: missing or invalid claims array");
        }
        
        if (transformedResult.claims.length === 0) {
          throw new Error("No claims found in transformed result");
        }
      } catch (transformError) {
        console.error("❌ Error transforming backend result:", transformError);
        toast({
          title: "Transformation Error",
          description: `Failed to process analysis results: ${transformError instanceof Error ? transformError.message : 'Unknown error'}`,
          variant: "destructive",
        });
        return; // Don't navigate if transformation failed
      }

      // Store result and navigate
      try {
        sessionStorage.setItem("analysisResult", JSON.stringify(transformedResult));
        sessionStorage.setItem("analysisText", text);
        sessionStorage.setItem("selectedWorldviews", JSON.stringify(cappedWorldviews));
        if (worldviewStrengths) {
          sessionStorage.setItem("worldviewStrengths", JSON.stringify(worldviewStrengths));
        }
          if (useGemmaSteering) {
            sessionStorage.setItem(
              "gemmaLayerConfig",
              JSON.stringify({ saeLayer: effectiveSaeLayer, hookLayer: effectiveHookLayer })
            );
          }
        
        navigate("/results");
      } catch (storageError) {
        console.error("❌ Error storing results:", storageError);
        toast({
          title: "Storage Error",
          description: "Failed to save analysis results. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Analysis error:", error);
      console.error("Error details:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to run analysis. Please try again.";
      
      // Check if it's a timeout error
      const isTimeout = errorMessage.toLowerCase().includes("timeout") || 
                        errorMessage.toLowerCase().includes("timed out");
      
      toast({
        title: isTimeout ? "Analysis Taking Longer Than Expected" : "Analysis Error",
        description: isTimeout 
          ? "The analysis is still running on the server but the request timed out. Check the backend logs - the analysis may complete successfully. For long Gemma analyses, this is normal."
          : errorMessage,
        variant: isTimeout ? "default" : "destructive",
      });
      // Don't navigate on error - stay on current page
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingTutorial showFromUrl={location.search.includes('tutorial=true')} />
      <Header />
      
      <main className="flex-1 container py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <div className={`h-2 w-2 rounded-full ${step === "input" ? "bg-primary" : step === "claim-selection" || step === "worldview-selection" ? "bg-primary/50" : "bg-muted"}`} />
              <span className={`text-sm font-medium ${step === "input" ? "text-foreground" : "text-muted-foreground"}`}>
                Text Input {isExtracting && step === "input" && "(Extracting...)"}
              </span>
              <div className="flex-1 h-px bg-border" />
              <div className={`h-2 w-2 rounded-full ${step === "claim-selection" ? "bg-primary" : step === "worldview-selection" ? "bg-primary/50" : "bg-muted"}`} />
              <span className={`text-sm font-medium ${step === "claim-selection" ? "text-foreground" : "text-muted-foreground"}`}>
                Claim Selection
              </span>
              <div className="flex-1 h-px bg-border" />
              <div className={`h-2 w-2 rounded-full ${step === "worldview-selection" ? "bg-primary" : "bg-muted"}`} />
              <span className={`text-sm font-medium ${step === "worldview-selection" ? "text-foreground" : "text-muted-foreground"}`}>
                Worldview Selection
              </span>
            </div>
          </div>

          {step === "input" && (
            <>
              <ModeSelector mode={mode} onModeChange={setMode} />
              {mode === "advanced" && (
                <AdvancedSettings 
                  settings={advancedSettings} 
                  onSettingsChange={setAdvancedSettings} 
                />
              )}
              <TextInput 
                onContinue={handleTextContinue} 
                isLoading={isExtracting}
                initialValue={text}
                onArticleSelect={handleArticleSelect}
              />
            </>
          )}

          {step === "claim-selection" && (
            <ClaimSelection
              claims={extractedClaims}
              onBack={() => setStep("input")}
              onContinue={handleClaimSelection}
              isLoading={isExtracting}
            />
          )}

          {step === "worldview-selection" && (
            <WorldviewSelection
              onBack={() => setStep("claim-selection")}
            onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              modelType={mode === "advanced" ? advancedSettings.reasoningAnalysisModel : "llm"}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Analyze;

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnalysisResult, Worldview, ConvergenceAnalysis } from "@/types/analysis";
import { generateConvergenceAnalysis } from "@/utils/analysisApi";
import { worldviews } from "@/data/worldviews";
import { ArrowDown, Loader2, Info, GitBranch, GitMerge, AlertCircle } from "lucide-react";

interface ConvergenceFlowTabProps {
  result: AnalysisResult;
  selectedWorldviews: Worldview[];
  convergenceData: Record<string, ConvergenceAnalysis>;
  setConvergenceData: React.Dispatch<React.SetStateAction<Record<string, ConvergenceAnalysis>>>;
}

export const ConvergenceFlowTab = ({ 
  result, 
  selectedWorldviews,
  convergenceData,
  setConvergenceData 
}: ConvergenceFlowTabProps) => {
  const [selectedClaimId, setSelectedClaimId] = useState<string>(result.claims[0]?.claim_id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedClaim = result.claims.find(c => c.claim_id === selectedClaimId);
  const currentConvergence = convergenceData[selectedClaimId];

  const getWorldviewInfo = (worldviewId: Worldview) => {
    return worldviews.find((w) => w.id === worldviewId);
  };

  const handleGenerateAnalysis = async () => {
    if (!selectedClaim) return;

    setLoading(true);
    setError(null);

    try {
      const convergence = await generateConvergenceAnalysis(
        selectedClaim.claim_id,
        selectedClaim.claim_text,
        selectedClaim.worldview_analyses
      );

      setConvergenceData(prev => ({
        ...prev,
        [selectedClaimId]: convergence
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate convergence analysis");
      console.error("Convergence analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getConvergenceColor = (type: string) => {
    switch (type) {
      case "convergent": return { bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-300", text: "text-green-700" };
      case "partial": return { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-300", text: "text-amber-700" };
      case "divergent": return { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-300", text: "text-red-700" };
      default: return { bg: "bg-muted/30", border: "border-muted", text: "text-muted-foreground" };
    }
  };

  const getConvergenceIcon = (type: string) => {
    switch (type) {
      case "convergent": return <GitMerge className="h-5 w-5 text-green-600" />;
      case "partial": return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case "divergent": return <GitBranch className="h-5 w-5 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Info Card */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="font-medium">Convergence/Divergence Flow</p>
            <p className="text-muted-foreground">
              See exactly where and why different worldviews' reasoning paths converge (agree) or diverge (disagree) at each step. 
              This analysis identifies shared ground and fundamental splits in their logic.
            </p>
          </div>
        </div>
      </Card>

      {/* Claim Selector */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 flex-1">
          <label className="text-sm font-medium">Select Claim</label>
          <Select value={selectedClaimId} onValueChange={setSelectedClaimId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {result.claims.map((claim, idx) => (
                <SelectItem key={claim.claim_id} value={claim.claim_id}>
                  Claim {idx + 1}: {claim.claim_text.substring(0, 60)}
                  {claim.claim_text.length > 60 ? "..." : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-6">
          <Button 
            onClick={handleGenerateAnalysis} 
            disabled={loading || !selectedClaim}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                {currentConvergence ? "Regenerate Analysis" : "Generate Analysis"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Analysis Failed</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* No Analysis Yet */}
      {!currentConvergence && !loading && selectedClaim && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <GitBranch className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold">No Convergence Analysis Yet</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Click "Generate Analysis" to see where worldviews' reasoning paths converge and diverge for this claim.
                This will take 5-10 seconds.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Convergence Visualization */}
      {currentConvergence && !loading && selectedClaim && (
        <div className="space-y-6">
          {/* Claim Header */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-300">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shrink-0">
                C
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">CLAIM (All Worldviews Start Here)</p>
                <p className="font-semibold">{selectedClaim.claim_text}</p>
              </div>
            </div>
          </Card>

          {/* Key Insight */}
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-300">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">KEY INSIGHT</p>
                <p className="text-sm font-medium">{currentConvergence.key_insight}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Primary divergence occurs at step {currentConvergence.primary_divergence_point}
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-center">
            <ArrowDown className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* Reasoning Steps */}
          <div className="space-y-6">
            {currentConvergence.steps.map((step, idx) => {
              const colors = getConvergenceColor(step.convergence_type);
              const icon = getConvergenceIcon(step.convergence_type);

              return (
                <div key={step.step_number}>
                  <Card className={`border-2 ${colors.border} ${colors.bg} p-5`}>
                    <div className="space-y-4">
                      {/* Step Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {icon}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-lg">
                                Step {step.step_number}: {step.step_name}
                              </h4>
                              <Badge 
                                variant={step.convergence_type === "convergent" ? "default" : 
                                        step.convergence_type === "partial" ? "outline" : "destructive"}
                                className="capitalize"
                              >
                                {step.convergence_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{step.explanation}</p>
                          </div>
                        </div>
                      </div>

                      {/* Shared/Divergent Aspects */}
                      {(step.shared_aspect || step.divergent_aspect) && (
                        <div className="space-y-2">
                          {step.shared_aspect && (
                            <div className="flex items-start gap-2">
                              <GitMerge className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-green-700">Shared:</p>
                                <p className="text-xs text-muted-foreground">{step.shared_aspect}</p>
                              </div>
                            </div>
                          )}
                          {step.divergent_aspect && (
                            <div className="flex items-start gap-2">
                              <GitBranch className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-red-700">Differs:</p>
                                <p className="text-xs text-muted-foreground">{step.divergent_aspect}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Worldview Positions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t">
                        {step.worldview_positions.map(({ worldview_id, position }) => {
                          const wvInfo = getWorldviewInfo(worldview_id as Worldview);
                          if (!wvInfo) return null;

                          return (
                            <Card key={worldview_id} className="p-3 border-2" style={{ borderColor: wvInfo.color }}>
                              <div className="flex items-start gap-2">
                                <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                     style={{ backgroundColor: wvInfo.color }}>
                                  {wvInfo.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate">{wvInfo.name}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{position}</p>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </Card>

                  {/* Arrow between steps */}
                  {idx < currentConvergence.steps.length - 1 && (
                    <div className="flex justify-center my-4">
                      <ArrowDown className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <Card className="p-4 bg-muted/30">
            <p className="text-sm font-semibold mb-3">Legend:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-green-600" />
                <span><strong>Convergent:</strong> Worldviews agree</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span><strong>Partial:</strong> Some overlap, different emphasis</span>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-red-600" />
                <span><strong>Divergent:</strong> Fundamental disagreement</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};


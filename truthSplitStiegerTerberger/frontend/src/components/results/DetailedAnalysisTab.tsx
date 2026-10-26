import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnalysisResult, Worldview, DivergenceAnalysis } from "@/types/analysis";
import { PositionBadge } from "./PositionBadge";
import { worldviews } from "@/data/worldviews";
import { Info, Lightbulb, Brain, AlertCircle, Layers, ArrowRight, Workflow } from "lucide-react";

interface DetailedAnalysisTabProps {
  result: AnalysisResult;
  selectedWorldviews: Worldview[];
}

export const DetailedAnalysisTab = ({ result, selectedWorldviews }: DetailedAnalysisTabProps) => {
  console.log("🔍 DetailedAnalysisTab rendering with:", {
    claimsCount: result.claims.length,
    divergenceCount: result.divergence_analysis?.length || 0,
    selectedWorldviews
  });

  const getWorldviewInfo = (id: Worldview) => {
    return worldviews.find(wv => wv.id === id);
  };

  const getDivergenceForClaim = (claimId: string): DivergenceAnalysis | undefined => {
    return result.divergence_analysis?.find(d => d.claim_id === claimId);
  };

  const severityConfig = {
    high: { icon: AlertCircle, color: "text-oppose", bgColor: "bg-oppose-bg" },
    medium: { icon: Info, color: "text-conditional", bgColor: "bg-conditional-bg" },
    low: { icon: Info, color: "text-support", bgColor: "bg-support-bg" }
  };

  if (!result || !result.claims || result.claims.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No claims available to display.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="font-medium">Reasoning Analysis</p>
            <p className="text-muted-foreground">
              This tab shows how each worldview interprets and reasons about each claim. 
              Explore step-by-step reasoning chains, key assumptions, value alignments, and consistency scores for each perspective.
            </p>
          </div>
        </div>
      </Card>
      {result.claims.map((claim) => {
        try {
          console.log(`🔍 Rendering claim ${claim.claim_id}`);
          
          const divergence = getDivergenceForClaim(claim.claim_id);
          console.log(`📊 Divergence for ${claim.claim_id}:`, divergence);
          
          const severityInfo = divergence && severityConfig[divergence.severity];
          console.log(`⚠️ Severity info:`, severityInfo);

          return (
            <Card key={claim.claim_id} className="p-6">
            <div className="space-y-6">
              {/* Claim Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-semibold flex-1">{claim.claim_text}</h3>
                  {divergence && severityInfo && (
                    <Badge variant="outline" className={`gap-1.5 ${severityInfo.bgColor} ${severityInfo.color}`}>
                      <severityInfo.icon className="h-3.5 w-3.5" />
                      {divergence.severity.toUpperCase()} Divergence
                    </Badge>
                  )}
                </div>
                
                {claim.premises.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Premises:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {claim.premises.map((premise, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          {typeof premise === 'string' ? premise : JSON.stringify(premise)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Worldview Analyses */}
              <Accordion type="multiple" className="space-y-3">
                {selectedWorldviews.map((wvId) => {
                  const analysis = claim.worldview_analyses[wvId];
                  if (!analysis) return null;

                  const wvInfo = getWorldviewInfo(wvId);
                  if (!wvInfo) return null;

                  return (
                    <AccordionItem key={wvId} value={wvId} className="border rounded-lg px-4 bg-gradient-to-r from-muted/30 to-transparent">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div 
                            className="h-3 w-3 rounded-full ring-2 ring-offset-2" 
                              style={{ backgroundColor: wvInfo.color }}
                            />
                            <span className="font-semibold">{wvInfo.name}</span>
                          <PositionBadge position={analysis.position} />
                          {/* Quick summary preview */}
                          <span className="text-xs text-muted-foreground ml-auto mr-4 hidden md:block">
                            {analysis.key_assumptions.length} assumptions • {analysis.detailed_concerns?.length || 0} concerns
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-3">
                          {/* Interpretation & Reasoning Combined */}
                          <Card className="p-4 bg-gradient-to-br from-blue-50/50 via-slate-50/50 to-transparent dark:from-blue-950/10 dark:via-slate-950/10 border-slate-200 dark:border-slate-800">
                            <div className="space-y-3">
                              {analysis.interpretation && (
                                <div className="space-y-1.5">
                                  <p className="text-xs font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                                    <Lightbulb className="h-3.5 w-3.5" />
                                    Interpretation
                                  </p>
                                  <p className="text-sm text-foreground leading-relaxed">{analysis.interpretation}</p>
                                </div>
                              )}
                              
                              <div className="space-y-1.5">
                                <p className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-400">
                                  <Brain className="h-3.5 w-3.5" />
                                  Reasoning
                                </p>
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{analysis.reasoning}</p>
                              </div>
                            </div>
                          </Card>

                          {/* Reasoning Chain - Step-by-step logic */}
                          {analysis.reasoning_chain && analysis.reasoning_chain.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                <Workflow className="h-3.5 w-3.5" />
                                Logical Chain
                              </p>
                              <Card className="p-3 bg-gradient-to-br from-emerald-50/40 via-teal-50/40 to-transparent dark:from-emerald-950/20 dark:via-teal-950/20 border-emerald-200 dark:border-emerald-800">
                          <div className="space-y-2">
                                  {analysis.reasoning_chain.map((step, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <div className="flex-shrink-0 mt-0.5">
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center border border-emerald-300 dark:border-emerald-700">
                                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                            {step.step_number}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm text-foreground leading-relaxed">{step.description}</p>
                                          {step.connects_to && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 capitalize">
                                              {step.connects_to.replace('_', ' ')}
                                            </Badge>
                                          )}
                                        </div>
                                        {idx < analysis.reasoning_chain.length - 1 && (
                                          <div className="flex items-center text-emerald-600 dark:text-emerald-400 ml-1">
                                            <ArrowRight className="h-3 w-3" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </Card>
                          </div>
                          )}

                          {/* Key Assumptions with Details */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
                              <Layers className="h-3.5 w-3.5" />
                              Key Assumptions
                            </p>
                            {analysis.assumption_details && analysis.assumption_details.length > 0 ? (
                              <div className="space-y-2">
                                {analysis.assumption_details.map((assumptionDetail, idx) => (
                                  <div key={idx} className="pl-3 py-2 border-l-2 border-purple-300 dark:border-purple-700 bg-muted/20">
                                    <div className="space-y-1.5">
                                      <div className="flex items-start gap-2">
                                        <span className="text-sm font-medium leading-snug flex-1">{assumptionDetail.assumption}</span>
                                        {assumptionDetail.core_value && (
                                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                                            {assumptionDetail.core_value}
                                          </Badge>
                                        )}
                                      </div>
                                      {assumptionDetail.relevance && (
                                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                                          {assumptionDetail.relevance}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                            <ul className="space-y-1">
                              {analysis.key_assumptions.map((assumption, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{typeof assumption === 'string' ? assumption : JSON.stringify(assumption)}</span>
                                </li>
                              ))}
                            </ul>
                            )}
                          </div>

                          {/* Detailed Concerns - Collapsible */}
                          {analysis.detailed_concerns && analysis.detailed_concerns.length > 0 && (
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="detailed-concerns" className="border-none">
                                <AccordionTrigger className="py-2 hover:no-underline">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                    <p className="text-sm font-semibold">Detailed Concerns</p>
                                    <Badge variant="secondary" className="text-[10px]">
                                      {analysis.detailed_concerns.length}
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-2 pt-2">
                                    {analysis.detailed_concerns.map((concern, idx) => (
                                      <div key={idx} className="pl-3 py-2 border-l-2 border-amber-400 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 rounded-r">
                                        <div className="space-y-1.5">
                                          <div className="flex items-start gap-2">
                                            <p className="text-sm font-semibold leading-snug flex-1">{concern.concern}</p>
                                            {concern.related_value && concern.related_value.trim() !== '' && (
                                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                                                {concern.related_value}
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground leading-relaxed">{concern.explanation}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}

                          {/* Alternative Approach - Collapsible */}
                          {analysis.alternative_approach && (
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="alternative-approach" className="border-none">
                                <AccordionTrigger className="py-2 hover:no-underline">
                                  <div className="flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4 text-green-600" />
                                    <p className="text-sm font-semibold">Alternative Approach</p>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-3 py-2 border-l-2 border-green-400 dark:border-green-700 bg-green-50/40 dark:bg-green-950/20 rounded-r mt-2">
                                    <p className="text-sm text-foreground leading-relaxed">{analysis.alternative_approach}</p>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}

                          {/* Consistency Scores & Confidence - Collapsible */}
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="consistency-scores" className="border-none">
                              <AccordionTrigger className="py-2 hover:no-underline">
                                <div className="flex items-center gap-2">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-sm font-semibold">Metrics</p>
                                  <Badge variant="secondary" className="text-[10px]">
                                    {(analysis.confidence * 100).toFixed(0)}% confidence
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 pt-2">
                                  <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Premise-Claim</span>
                                  <span className="font-medium">
                                    {(analysis.consistency_scores.premise_claim * 100).toFixed(0)}%
                                  </span>
                                </div>
                                      <Progress value={analysis.consistency_scores.premise_claim * 100} className="h-1" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Worldview Internal</span>
                                  <span className="font-medium">
                                    {(analysis.consistency_scores.worldview_internal * 100).toFixed(0)}%
                                  </span>
                                </div>
                                      <Progress value={analysis.consistency_scores.worldview_internal * 100} className="h-1" />
                              </div>
                            </div>
                          </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </Card>
        );
        } catch (error) {
          console.error(`❌ Error rendering claim ${claim.claim_id}:`, error);
          return (
            <Card key={claim.claim_id} className="p-6 border-red-500">
              <p className="text-red-500">Error rendering claim: {claim.claim_text}</p>
            </Card>
          );
        }
      })}
    </div>
  );
};

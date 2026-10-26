import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnalysisResult, Worldview } from "@/types/analysis";
import { AlertTriangle, Scale, Users, Target, Handshake, Info } from "lucide-react";
import { worldviews } from "@/data/worldviews";

interface DivergenceAnalysisTabProps {
  result: AnalysisResult;
  selectedWorldviews: Worldview[];
}

export const DivergenceAnalysisTab = ({ result, selectedWorldviews }: DivergenceAnalysisTabProps) => {
  const getWorldviewInfo = (worldviewId: Worldview) => {
    return worldviews.find((w) => w.id === worldviewId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="font-medium">Divergence Analysis</p>
            <p className="text-muted-foreground">
              This tab shows how and why different worldviews disagree on each claim. 
              Explore value conflicts, assumption differences, and areas of potential common ground.
            </p>
          </div>
        </div>
      </Card>

      {result.claims.map((claim, claimIndex) => {
        const divergence = result.divergence_analysis?.find((d) => d.claim_id === claim.claim_id);

        if (!divergence) return null;

        return (
          <div key={claim.claim_id} className="space-y-4">
            {/* Claim Header */}
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-transparent">
              <h3 className="font-semibold text-lg mb-2">
                Claim {claimIndex + 1}: {claim.claim_text}
              </h3>
              {claim.premises && claim.premises.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Premises:</p>
                  <ul className="space-y-1">
                    {claim.premises.map((premise, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground ml-4">
                        • {premise}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* Divergence Analysis Card */}
            <Card className="p-5 border-l-4" style={{ 
              borderLeftColor: divergence.severity === 'high' ? 'hsl(0, 72%, 51%)' : 
                               divergence.severity === 'medium' ? 'hsl(38, 92%, 50%)' : 
                               'hsl(142, 76%, 36%)',
              backgroundColor: divergence.severity === 'high' ? 'hsl(0, 72%, 97%)' :
                               divergence.severity === 'medium' ? 'hsl(38, 92%, 97%)' :
                               'hsl(142, 76%, 97%)'
            }}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${
                      divergence.severity === 'high' ? 'text-red-600' : 
                      divergence.severity === 'medium' ? 'text-amber-600' : 
                      'text-green-600'
                    }`} />
                    Divergence Analysis
                  </h4>
                  <Badge variant={divergence.severity === 'high' ? 'destructive' : 'outline'} className="capitalize text-xs">
                    {divergence.severity} Severity
                  </Badge>
                </div>
                
                {/* Summary (always visible) */}
                <div className="pl-3 py-3 border-l-2 border-muted-foreground/30 bg-background/50 rounded-r">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {divergence.explanation || 'No summary available'}
                  </p>
                </div>

                {/* Value Conflicts with Details - Collapsible */}
                {Array.isArray(divergence.value_conflicts) && divergence.value_conflicts.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="value-conflicts" className="border-none">
                      <AccordionTrigger className="py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-muted-foreground" />
                          <h5 className="text-sm font-semibold">Value Conflicts</h5>
                          <Badge variant="secondary" className="text-[10px]">
                            {divergence.value_conflicts.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {divergence.value_conflicts.map((conflict: any, idx: number) => {
                            if (!conflict) return null;
                            return (
                              <div key={idx} className="p-3 bg-muted/20 border border-muted-foreground/20 rounded-lg">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-medium text-xs">
                                        {getWorldviewInfo(conflict.worldview1 as Worldview)?.name || conflict.worldview1}
                                      </span>
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        {conflict.conflicting_value1 || conflict.value1 || 'Unknown'}
                                      </Badge>
                                    </div>
                                    <span className="text-muted-foreground text-xs">↔</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-medium text-xs">
                                        {getWorldviewInfo(conflict.worldview2 as Worldview)?.name || conflict.worldview2}
                                      </span>
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        {conflict.conflicting_value2 || conflict.value2 || 'Unknown'}
                                      </Badge>
                                    </div>
                                    {conflict.conflict_type && (
                                      <Badge variant="outline" className="text-[10px] shrink-0">
                                        {conflict.conflict_type}
                                      </Badge>
                                    )}
                                  </div>
                                  {conflict.detailed_explanation && (
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {conflict.detailed_explanation}
                                    </p>
                                  )}
                                  {conflict.impact && (
                                    <p className="text-xs text-muted-foreground italic">
                                      <span className="font-semibold not-italic">Impact:</span> {conflict.impact}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {/* Assumption Conflicts with Details - Collapsible */}
                {Array.isArray(divergence.assumption_conflicts) && divergence.assumption_conflicts.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="assumption-conflicts" className="border-none">
                      <AccordionTrigger className="py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <h5 className="text-sm font-semibold">Assumption Conflicts</h5>
                          <Badge variant="secondary" className="text-[10px]">
                            {divergence.assumption_conflicts.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {divergence.assumption_conflicts.map((conflict: any, idx: number) => {
                            // Handle both old format (string) and new format (object)
                            if (typeof conflict === 'string') {
                              return (
                                <div key={idx} className="p-3 bg-muted/20 border border-muted-foreground/20 rounded-lg">
                                  <p className="text-sm text-muted-foreground">{conflict}</p>
                                </div>
                              );
                            }
                            
                            // New detailed format
                            return (
                              <div key={idx} className="p-3 bg-muted/20 border border-muted-foreground/20 rounded-lg">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs">
                                      {conflict.worldview || 'Unknown'}
                                    </span>
                                    {conflict.position && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        {conflict.position}
                                      </Badge>
                                    )}
                                  </div>
                                  {conflict.assumptions && conflict.assumptions.length > 0 && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-foreground">Assumptions:</p>
                                      <ul className="space-y-0.5 pl-3">
                                        {conflict.assumptions.map((assumption: string, aIdx: number) => (
                                          <li key={aIdx} className="text-xs text-muted-foreground leading-relaxed">• {assumption}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {conflict.why_conflicting && (
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      <span className="font-semibold">Why conflicting:</span> {conflict.why_conflicting}
                                    </p>
                                  )}
                                  {conflict.root_belief && (
                                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                                      <span className="font-semibold not-italic">Root belief:</span> {conflict.root_belief}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {/* Disagreement Dimensions - Collapsible */}
                {divergence.disagreement_dimensions && divergence.disagreement_dimensions.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="disagreement-dimensions" className="border-none">
                      <AccordionTrigger className="py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <h5 className="text-sm font-semibold">Disagreement Dimensions</h5>
                          <Badge variant="secondary" className="text-[10px]">
                            {divergence.disagreement_dimensions.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {divergence.disagreement_dimensions.map((dim: any, idx: number) => (
                            <div key={idx} className="p-3 bg-muted/20 border border-muted-foreground/20 rounded-lg">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-xs">{dim.dimension_name}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {dim.gap_size} gap
                                  </Badge>
                                </div>
                                <div className="grid md:grid-cols-2 gap-2 mt-1">
                                  <div className="p-2 bg-muted/40 rounded text-xs">
                                    <p className="font-medium mb-0.5 text-[10px]">Position 1:</p>
                                    <p className="text-muted-foreground leading-relaxed">{dim.wv1_position}</p>
                                  </div>
                                  <div className="p-2 bg-muted/40 rounded text-xs">
                                    <p className="font-medium mb-0.5 text-[10px]">Position 2:</p>
                                    <p className="text-muted-foreground leading-relaxed">{dim.wv2_position}</p>
                                  </div>
                                </div>
                                {dim.why_matters && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    {dim.why_matters}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {/* Common Ground - Collapsible */}
                {divergence.common_ground && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="common-ground" className="border-none">
                      <AccordionTrigger className="py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Handshake className="h-4 w-4 text-muted-foreground" />
                          <h5 className="text-sm font-semibold">Common Ground</h5>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-3 py-2 border-l-2 border-green-400 dark:border-green-700 bg-green-50/40 dark:bg-green-950/20 rounded-r mt-2">
                          {divergence.common_ground.shared_concerns && (
                            <p className="text-xs text-muted-foreground mb-2">
                              <strong>Shared concerns:</strong> {divergence.common_ground.shared_concerns}
                            </p>
                          )}
                          {divergence.common_ground.potential_bridge_points && (
                            <p className="text-xs text-muted-foreground">
                              <strong>Bridge points:</strong> {divergence.common_ground.potential_bridge_points}
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
};


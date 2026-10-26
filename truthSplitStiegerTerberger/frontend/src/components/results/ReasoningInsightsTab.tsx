import { useMemo, useState } from "react";
import { AnalysisResult, Worldview } from "@/types/analysis";
import { useWorldviews } from "@/hooks/useWorldviews";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Info, Network, GitBranch, Target, TrendingUp } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface ReasoningInsightsTabProps {
  result: AnalysisResult;
  selectedWorldviews: Worldview[];
}

export const ReasoningInsightsTab = ({ result, selectedWorldviews }: ReasoningInsightsTabProps) => {
  const worldviews = useWorldviews();
  const [activeView, setActiveView] = useState<string>("conflicts");

  // Extract value conflicts
  const valueConflicts = useMemo(() => {
    if (!result.divergence_analysis) return [];
    
    const conflicts: Array<{
      claimId: string;
      claimText: string;
      severity: string;
      conflicts: Array<{
        wv1: string;
        wv2: string;
        wv1Name: string;
        wv2Name: string;
        value1: string;
        value2: string;
      }>;
    }> = [];

    result.divergence_analysis.forEach((div) => {
      const claim = result.claims.find((c) => c.claim_id === div.claim_id);
      if (!claim) return;

      const claimConflicts = (div.value_conflicts || []).map((vc) => {
        const wv1 = worldviews.find((w) => w.id === vc.worldview1);
        const wv2 = worldviews.find((w) => w.id === vc.worldview2);
        return {
          wv1: vc.worldview1,
          wv2: vc.worldview2,
          wv1Name: wv1?.name || vc.worldview1,
          wv2Name: wv2?.name || vc.worldview2,
          value1: vc.conflicting_value1,
          value2: vc.conflicting_value2,
        };
      });

      if (claimConflicts.length > 0) {
        conflicts.push({
          claimId: div.claim_id,
          claimText: claim.claim_text,
          severity: div.severity,
          conflicts: claimConflicts,
        });
      }
    });

    return conflicts;
  }, [result, worldviews]);

  // Analyze assumption patterns
  const assumptionPatterns = useMemo(() => {
    const patterns = new Map<string, { count: number; worldviews: Set<string>; claims: Set<string> }>();

    result.claims.forEach((claim) => {
      selectedWorldviews.forEach((wvId) => {
        const analysis = claim.worldview_analyses[wvId];
        if (!analysis?.key_assumptions) return;

        analysis.key_assumptions.forEach((assumption) => {
          const assumptionText = typeof assumption === 'string' ? assumption : String(assumption);
          const normalized = assumptionText.toLowerCase().trim();
          
          if (!patterns.has(normalized)) {
            patterns.set(normalized, {
              count: 0,
              worldviews: new Set(),
              claims: new Set(),
            });
          }

          const pattern = patterns.get(normalized)!;
          pattern.count++;
          pattern.worldviews.add(wvId);
          pattern.claims.add(claim.claim_id);
        });
      });
    });

    // Convert to array and sort by count
    return Array.from(patterns.entries())
      .map(([text, data]) => ({
        text,
        count: data.count,
        worldviewCount: data.worldviews.size,
        claimCount: data.claims.size,
        worldviews: Array.from(data.worldviews),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [result, selectedWorldviews]);

  // Position alignment analysis
  const positionAlignment = useMemo(() => {
    const alignmentMatrix: Record<string, Record<string, number>> = {};
    
    selectedWorldviews.forEach((wv1) => {
      alignmentMatrix[wv1] = {};
      selectedWorldviews.forEach((wv2) => {
        if (wv1 === wv2) {
          alignmentMatrix[wv1][wv2] = 1;
          return;
        }

        let agreements = 0;
        let total = 0;

        result.claims.forEach((claim) => {
          const analysis1 = claim.worldview_analyses[wv1];
          const analysis2 = claim.worldview_analyses[wv2];

          if (analysis1 && analysis2) {
            total++;
            if (analysis1.position === analysis2.position) {
              agreements++;
            }
          }
        });

        alignmentMatrix[wv1][wv2] = total > 0 ? agreements / total : 0;
      });
    });

    return alignmentMatrix;
  }, [result, selectedWorldviews]);

  // Reasoning strength analysis
  const reasoningStrength = useMemo(() => {
    return selectedWorldviews.map((wvId) => {
      const wv = worldviews.find((w) => w.id === wvId);
      let totalConfidence = 0;
      let totalConsistency = 0;
      let count = 0;

      result.claims.forEach((claim) => {
        const analysis = claim.worldview_analyses[wvId];
        if (analysis) {
          totalConfidence += analysis.confidence || 0;
          totalConsistency += analysis.consistency_scores?.worldview_internal || 0;
          count++;
        }
      });

      return {
        worldview: wv?.name || wvId,
        color: wv?.color || "#888888",
        confidence: count > 0 ? totalConfidence / count : 0,
        consistency: count > 0 ? totalConsistency / count : 0,
        claimCount: count,
      };
    });
  }, [result, selectedWorldviews, worldviews]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "hsl(0, 72%, 51%)";
      case "medium":
        return "hsl(38, 92%, 50%)";
      case "low":
        return "hsl(142, 76%, 36%)";
      default:
        return "hsl(220, 9%, 46%)";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <Network className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm flex-1">
            <p className="font-medium">Reasoning Analysis & Insights</p>
            <p className="text-muted-foreground">
              Explore patterns in how worldviews reason about claims. Identify value conflicts,
              common assumptions, position alignments, and reasoning quality metrics.
            </p>
          </div>
        </div>
      </Card>

      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conflicts">
            <GitBranch className="h-4 w-4 mr-2" />
            Value Conflicts
          </TabsTrigger>
          <TabsTrigger value="assumptions">
            <Info className="h-4 w-4 mr-2" />
            Assumptions
          </TabsTrigger>
          <TabsTrigger value="alignment">
            <Target className="h-4 w-4 mr-2" />
            Alignment
          </TabsTrigger>
          <TabsTrigger value="strength">
            <TrendingUp className="h-4 w-4 mr-2" />
            Strength
          </TabsTrigger>
        </TabsList>

        {/* Value Conflicts View */}
        <TabsContent value="conflicts" className="mt-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Value Conflicts by Claim</h3>
                <p className="text-sm text-muted-foreground">
                  Shows where worldviews fundamentally disagree due to conflicting core values.
                </p>
              </div>

              {valueConflicts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No value conflicts identified in the analysis.
                </div>
              ) : (
                <div className="space-y-4">
                  {valueConflicts.map((vc, idx) => (
                    <Card key={idx} className="p-4 border-2" style={{ borderColor: getSeverityColor(vc.severity) }}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="font-medium text-sm flex-1">{vc.claimText}</p>
                          <Badge variant="outline" className="capitalize">
                            {vc.severity} Divergence
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {vc.conflicts.map((conflict, cIdx) => (
                            <div
                              key={cIdx}
                              className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg text-sm"
                            >
                              <div className="flex-1">
                                <span className="font-medium">{conflict.wv1Name}</span>
                                <span className="text-muted-foreground"> values </span>
                                <span className="font-semibold text-primary">{conflict.value1}</span>
                              </div>
                              <div className="text-muted-foreground">↔</div>
                              <div className="flex-1">
                                <span className="font-medium">{conflict.wv2Name}</span>
                                <span className="text-muted-foreground"> values </span>
                                <span className="font-semibold text-primary">{conflict.value2}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Assumptions View */}
        <TabsContent value="assumptions" className="mt-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Most Common Assumptions</h3>
                <p className="text-sm text-muted-foreground">
                  Key assumptions that appear frequently across worldviews and claims.
                </p>
              </div>

              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={assumptionPatterns}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="text"
                      type="category"
                      width={200}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => {
                        return value.length > 35 ? value.substring(0, 35) + "..." : value;
                      }}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload || !payload[0]) return null;
                        const data = payload[0].payload;
                        return (
                          <Card className="p-3 bg-background/95 backdrop-blur border-primary/20">
                            <div className="space-y-2 text-xs">
                              <p className="font-semibold">{data.text}</p>
                              <p className="text-muted-foreground">
                                Appears <strong>{data.count}</strong> times across{" "}
                                <strong>{data.claimCount}</strong> claims
                              </p>
                              <p className="text-muted-foreground">
                                Used by <strong>{data.worldviewCount}</strong> worldviews
                              </p>
                            </div>
                          </Card>
                        );
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))">
                      {assumptionPatterns.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`hsl(var(--primary) / ${0.5 + (entry.worldviewCount / selectedWorldviews.length) * 0.5})`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Card className="p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Bar opacity indicates how many worldviews use each assumption.
                  Darker bars = more widely shared across different worldviews.
                </p>
              </Card>
            </div>
          </Card>
        </TabsContent>

        {/* Alignment View */}
        <TabsContent value="alignment" className="mt-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Position Alignment Matrix</h3>
                <p className="text-sm text-muted-foreground">
                  Shows how often worldviews agree on claim positions (support/oppose/conditional).
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium"></th>
                      {selectedWorldviews.map((wvId) => {
                        const wv = worldviews.find((w) => w.id === wvId);
                        return (
                          <th key={wvId} className="p-2 text-center text-xs font-medium">
                            {wv?.name || wvId}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWorldviews.map((wv1Id) => {
                      const wv1 = worldviews.find((w) => w.id === wv1Id);
                      return (
                        <tr key={wv1Id}>
                          <td className="p-2 text-sm font-medium">{wv1?.name || wv1Id}</td>
                          {selectedWorldviews.map((wv2Id) => {
                            const alignment = positionAlignment[wv1Id]?.[wv2Id] || 0;
                            const isIdentity = wv1Id === wv2Id;
                            return (
                              <td
                                key={wv2Id}
                                className="p-2 text-center border"
                                style={{
                                  backgroundColor: isIdentity
                                    ? "hsl(var(--muted))"
                                    : `rgba(34, 197, 94, ${alignment})`,
                                }}
                              >
                                <span className="text-xs font-medium">
                                  {(alignment * 100).toFixed(0)}%
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Card className="p-4 bg-muted/30">
                <div className="space-y-2 text-xs">
                  <p className="font-medium">Interpretation:</p>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    <li>Percentages show agreement rate on claim positions</li>
                    <li>100% means worldviews always take the same position</li>
                    <li>0% means they never agree (always different positions)</li>
                    <li>Darker green = higher alignment</li>
                  </ul>
                </div>
              </Card>
            </div>
          </Card>
        </TabsContent>

        {/* Reasoning Strength View */}
        <TabsContent value="strength" className="mt-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Reasoning Quality Metrics</h3>
                <p className="text-sm text-muted-foreground">
                  Analyzes confidence and internal consistency of each worldview's reasoning.
                </p>
              </div>

              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={reasoningStrength}>
                    <PolarGrid />
                    <PolarAngleAxis
                      dataKey="worldview"
                      tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Confidence"
                      dataKey="confidence"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="Internal Consistency"
                      dataKey="consistency"
                      stroke="hsl(142, 76%, 36%)"
                      fill="hsl(142, 76%, 36%)"
                      fillOpacity={0.5}
                    />
                    <Legend />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload || !payload[0]) return null;
                        const data = payload[0].payload;
                        return (
                          <Card className="p-3 bg-background/95 backdrop-blur border-primary/20">
                            <div className="space-y-2 text-xs">
                              <p className="font-semibold" style={{ color: data.color }}>
                                {data.worldview}
                              </p>
                              <p className="text-muted-foreground">
                                <strong>Confidence:</strong> {(data.confidence * 100).toFixed(1)}%
                              </p>
                              <p className="text-muted-foreground">
                                <strong>Consistency:</strong> {(data.consistency * 100).toFixed(1)}%
                              </p>
                              <p className="text-muted-foreground">
                                <strong>Claims Analyzed:</strong> {data.claimCount}
                              </p>
                            </div>
                          </Card>
                        );
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {reasoningStrength.map((strength) => (
                  <Card key={strength.worldview} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: strength.color }}
                        />
                        <h4 className="font-semibold text-sm">{strength.worldview}</h4>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="font-medium">
                            {(strength.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Consistency:</span>
                          <span className="font-medium">
                            {(strength.consistency * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Claims:</span>
                          <span className="font-medium">{strength.claimCount}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-4 bg-muted/30">
                <div className="space-y-2 text-xs">
                  <p className="font-medium">Metrics Explained:</p>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    <li>
                      <strong>Confidence:</strong> How confident the LLM is in each worldview's analysis
                    </li>
                    <li>
                      <strong>Internal Consistency:</strong> How well the reasoning aligns with the
                      worldview's own principles
                    </li>
                    <li>Higher values indicate more coherent and reliable reasoning</li>
                  </ul>
                </div>
              </Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};


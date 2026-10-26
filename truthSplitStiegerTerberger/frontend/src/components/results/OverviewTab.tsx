import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnalysisResult, Worldview } from "@/types/analysis";
import { PositionBadge } from "./PositionBadge";
import { worldviews } from "@/data/worldviews";

interface OverviewTabProps {
  result: AnalysisResult;
  selectedWorldviews: Worldview[];
}

export const OverviewTab = ({ result, selectedWorldviews }: OverviewTabProps) => {
  const totalClaims = result.claims.length;
  
  // Calculate consensus claims (where all worldviews agree)
  const consensusClaims = result.claims.filter(claim => {
    const positions = selectedWorldviews
      .map(wv => claim.worldview_analyses[wv]?.position)
      .filter(Boolean);
    return positions.length > 0 && positions.every(p => p === positions[0]);
  }).length;
  
  const divergingClaims = totalClaims - consensusClaims;

  const getWorldviewName = (id: Worldview) => {
    return worldviews.find(wv => wv.id === id)?.name || id;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Statistics Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Claims</p>
            <p className="text-3xl font-bold">{totalClaims}</p>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Consensus Claims</p>
            <p className="text-3xl font-bold text-support">{consensusClaims}</p>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Diverging Claims</p>
            <p className="text-3xl font-bold text-oppose">{divergingClaims}</p>
          </div>
        </Card>
      </div>

      {/* Worldview Positions Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Worldview Positions</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Claim</TableHead>
                  {selectedWorldviews.map((wv) => (
                    <TableHead key={wv} className="text-center">
                      {getWorldviewName(wv)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.claims.map((claim) => (
                  <TableRow key={claim.claim_id}>
                    <TableCell className="font-medium">
                      {claim.claim_text}
                    </TableCell>
                    {selectedWorldviews.map((wv) => {
                      const analysis = claim.worldview_analyses[wv];
                      return (
                        <TableCell key={wv} className="text-center">
                          {analysis && (
                            <div className="flex justify-center">
                              <PositionBadge position={analysis.position} />
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
};

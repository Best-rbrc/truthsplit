import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Claim {
  id: string;
  text: string;
  premises: string[];
}

interface ClaimSelectionProps {
  claims: Claim[];
  onBack: () => void;
  onContinue: (selectedClaimIds: string[]) => void;
  isLoading?: boolean;
}

export const ClaimSelection = ({ claims, onBack, onContinue, isLoading = false }: ClaimSelectionProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(claims.map(c => c.id)));
  const minSelection = 1;
  const isValid = selected.size >= minSelection;

  const toggleClaim = (claimId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(claimId)) {
      newSelected.delete(claimId);
    } else {
      newSelected.add(claimId);
    }
    setSelected(newSelected);
  };

  const handleContinue = () => {
    onContinue(Array.from(selected));
  };

  if (isLoading && claims.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Extracting Claims</h2>
          <p className="text-muted-foreground">
            Analyzing your text to identify claims and premises...
          </p>
        </div>

        <Card className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Processing your text...
            </p>
          </div>
        </Card>

        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Select Claims to Analyze</h2>
        <p className="text-muted-foreground">
          We've extracted {claims.length} claim{claims.length !== 1 ? 's' : ''} from your text. 
          Select which ones you'd like to analyze through different worldviews.
        </p>
      </div>

      <div className="space-y-4">
        {claims.map((claim, index) => {
            const isSelected = selected.has(claim.id);
            
            return (
              <Card
                key={claim.id}
                className={cn(
                  "p-6 cursor-pointer transition-all hover:shadow-md",
                  isSelected && "border-primary bg-primary/5"
                )}
                onClick={() => toggleClaim(claim.id)}
              >
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleClaim(claim.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="mb-2">
                        Claim {index + 1}
                      </Badge>
                    </div>
                    
                    <p className="text-sm font-medium">
                      {claim.text}
                    </p>
                    
                    {claim.premises.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground">
                          Premises:
                        </p>
                        <ul className="space-y-1 pl-4">
                          {claim.premises.map((premise, pIndex) => (
                            <li key={pIndex} className="text-xs text-muted-foreground list-disc">
                              {premise}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
        })}
      </div>

      <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {selected.size} of {claims.length} selected
            </span>
            <Button
              size="lg"
              disabled={!isValid || isLoading}
              onClick={handleContinue}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Worldview Selection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
    </div>
  );
};
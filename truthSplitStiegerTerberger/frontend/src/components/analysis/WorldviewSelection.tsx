import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { loadWorldviews } from "@/data/worldviews";
import { Worldview, WorldviewInfo } from "@/types/analysis";
import { Scale, BookOpen, Leaf, Flag, Users, Crown, ArrowLeft, Loader2, Settings, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ModelType } from "@/components/analysis/AdvancedSettings";

interface WorldviewSelectionProps {
  onBack: () => void;
  onAnalyze: (
    selectedWorldviews: Worldview[],
    worldviewStrengths?: Record<Worldview, number>,
    layerConfig?: { saeLayer: number; hookLayer: number }
  ) => void;
  isAnalyzing?: boolean;
  modelType?: ModelType;
}

const iconMap = {
  Scale,
  BookOpen,
  Leaf,
  Flag,
  Users,
  Crown
};

export const WorldviewSelection = ({ 
  onBack, 
  onAnalyze, 
  isAnalyzing = false,
  modelType = "llm"
}: WorldviewSelectionProps) => {
  const [worldviews, setWorldviews] = useState<WorldviewInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<Worldview>>(new Set());
  const [strengths, setStrengths] = useState<Record<Worldview, number>>({} as Record<Worldview, number>);
  const [saeLayer, setSaeLayer] = useState<number>(6);
  const [hookLayer, setHookLayer] = useState<number>(6);
  
  // Load worldviews on mount
  useEffect(() => {
    const fetchWorldviews = async () => {
      try {
        setLoading(true);
        const wvs = await loadWorldviews();
        if (wvs && wvs.length > 0) {
          setWorldviews(wvs);
          setError(null);
        } else {
          setError("No worldviews available. Please check your connection.");
        }
      } catch (err) {
        console.error("Failed to load worldviews:", err);
        setError("Failed to load worldviews. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorldviews();
  }, []);
  
  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="p-8 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading worldviews...</p>
        </Card>
      </div>
    );
  }
  
  // Show error state
  if (error || !worldviews || worldviews.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="p-6">
          <p className="text-muted-foreground mb-4">
            {error || "Worldviews data not available. Please refresh the page."}
          </p>
          <Button onClick={onBack}>Go Back</Button>
        </Card>
      </div>
    );
  }
  
  const minSelection = 2;
  const maxSelection = 3;
  const isValid = selected.size >= minSelection;
  const isGemmaMode = modelType === "gemma";

  const toggleWorldview = (worldview: Worldview) => {
    const newSelected = new Set(selected);
    if (newSelected.has(worldview)) {
      newSelected.delete(worldview);
      // Remove strength value when deselecting
      const newStrengths = { ...strengths };
      delete newStrengths[worldview];
      setStrengths(newStrengths);
    } else {
      // Enforce maximum number of selectable perspectives
      if (newSelected.size >= maxSelection) {
        return;
      }
      newSelected.add(worldview);
      // Initialize strength to 1.0 (default) when selecting in Gemma mode
      if (isGemmaMode) {
        setStrengths({ ...strengths, [worldview]: 1.0 });
      }
    }
    setSelected(newSelected);
  };

  const updateStrength = (worldview: Worldview, value: number[]) => {
    setStrengths({ ...strengths, [worldview]: value[0] });
  };

  const handleAnalyze = () => {
    const layerConfig = isGemmaMode ? { saeLayer, hookLayer } : undefined;
    if (isGemmaMode) {
      onAnalyze(Array.from(selected), strengths, layerConfig);
    } else {
      onAnalyze(Array.from(selected), undefined, layerConfig);
    }
  };

  const getStrengthLabel = (value: number) => {
    if (value === 0) return "No Steering";
    return `${value.toFixed(1)}x`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          {isGemmaMode ? "Configure Worldview Steering" : "Select Worldviews"}
        </h2>
        <p className="text-muted-foreground">
          {isGemmaMode 
            ? `Choose between ${minSelection} and ${maxSelection} perspectives and adjust their strength. Amplify to emphasize a worldview or weaken to reduce its influence.`
            : `Choose between ${minSelection} and ${maxSelection} perspectives to analyze your claim(s) through. Each worldview will provide unique insights.`
          }
        </p>
      </div>

      {isGemmaMode && (
        <Card className="p-6 space-y-4 bg-gradient-to-br from-background to-muted/20 border-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Gemma Layer Configuration
              </h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      About Gemma Layer Configuration
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">What is Gemma Steering?</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Gemma steering uses Sparse Autoencoders (SAE) to identify and amplify specific features in the language model that correspond to different worldviews. This allows for precise control over how the model interprets and responds to arguments.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">SAE Layer (Feature Discovery)</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        This layer is used to discover the latent features that represent worldview-specific reasoning patterns. The SAE decomposes the model's activations into interpretable features.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Hook Layer (Apply Steering)</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        This is where the steering intervention is applied. By modifying activations at this layer, we can amplify or suppress specific worldview features during text generation.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Available Layers</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Layers 0, 6, 10, 12, and 17 are available. Earlier layers capture more general features, while later layers capture more abstract reasoning patterns. Layer 6 and 12 are commonly used for balanced results.
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground italic">
                        <strong>Tip:</strong> For most analyses, using the same layer for both SAE and Hook (e.g., Layer 6) provides consistent results. Experiment with different layers to see how they affect the analysis.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Choose the layer used for SAE feature discovery and the (possibly different) layer where the steering hook is applied. Available options are 0, 6, 10, 12, and 17.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">SAE Layer (feature discovery)</Label>
              <select
                className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm shadow-sm transition-all hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                value={saeLayer}
                onChange={(e) => setSaeLayer(Number(e.target.value))}
                disabled={isAnalyzing}
              >
                {[0, 6, 10, 12, 17].map((layer) => (
                  <option key={layer} value={layer}>
                    Layer {layer}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Hook Layer (apply steering)</Label>
              <select
                className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm shadow-sm transition-all hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                value={hookLayer}
                onChange={(e) => setHookLayer(Number(e.target.value))}
                disabled={isAnalyzing}
              >
                {[0, 6, 10, 12, 17].map((layer) => (
                  <option key={layer} value={layer}>
                    Layer {layer}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {worldviews && Array.isArray(worldviews) && worldviews.map((worldview, index) => {
          if (!worldview || !worldview.id) {
            console.warn("Skipping invalid worldview:", worldview);
            return null; // Skip invalid worldviews
          }
          
          console.log(`Rendering worldview ${index + 1}/${worldviews.length}: ${worldview.id} (${worldview.name}) with icon: ${worldview.icon}`);
          
          const Icon = iconMap[worldview.icon as keyof typeof iconMap] || Scale; // Fallback to Scale if icon not found
          if (!iconMap[worldview.icon as keyof typeof iconMap]) {
            console.warn(`Icon "${worldview.icon}" not found in iconMap for worldview "${worldview.id}", using fallback`);
          }
          
          const isSelected = selected.has(worldview.id);
          const strength = strengths[worldview.id] ?? 1.0;
          const worldviewColor = worldview.color || '#888888'; // Fallback color
          const worldviewName = worldview.name || 'Unknown';
          const worldviewDescription = worldview.description || '';
          const worldviewKeyValues = Array.isArray(worldview.keyValues) ? worldview.keyValues : [];
          
          return (
            <Card
              key={worldview.id}
              className={cn(
                "p-6 transition-all cursor-pointer hover:shadow-md",
                isSelected && "border-primary bg-primary/5"
              )}
              onClick={() => toggleWorldview(worldview.id)}
            >
              <div className="flex items-start space-x-4">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleWorldview(worldview.id)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${worldviewColor}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: worldviewColor }} />
                      </div>
                      <h3 className="text-lg font-semibold">{worldviewName}</h3>
                    </div>
                  </div>
                  
                  {worldviewDescription && (
                    <p className="text-sm text-muted-foreground">
                      {worldviewDescription}
                    </p>
                  )}
                  
                  {worldviewKeyValues.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {worldviewKeyValues.map((value, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Strength slider for Gemma mode */}
                  {isGemmaMode && isSelected && (
                    <div className="pt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Strength</Label>
                        <Badge variant={strength === 0 ? "outline" : "default"}>
                          {getStrengthLabel(strength)}
                        </Badge>
                      </div>
                      <Slider
                        value={[strength]}
                        onValueChange={(value) => updateStrength(worldview.id, value)}
                        onValueCommit={(value) => updateStrength(worldview.id, value)}
                        min={0}
                        max={4}
                        step={0.1}
                        disabled={isAnalyzing}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0.0x (No Steering)</span>
                        <span>2.0x</span>
                        <span>4.0x (Max)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isAnalyzing}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            {selected.size} selected (max {maxSelection})
          </p>
          <Button
            size="lg"
            disabled={!isValid || isAnalyzing}
            onClick={handleAnalyze}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Text"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

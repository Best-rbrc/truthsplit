import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Zap, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type AnalysisMode = "normal" | "advanced";

interface ModeSelectorProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
}

export const ModeSelector = ({ mode, onModeChange }: ModeSelectorProps) => {
  return (
    <Card className="p-6 mb-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Analysis Mode</h3>
            <p className="text-sm text-muted-foreground">
              Choose how you want to analyze your text. Normal Mode works great for most users, while Advanced Mode lets you customize which AI models to use.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>About Analysis Modes</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Normal Mode (Recommended)</h4>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    <strong>Perfect for beginners!</strong> This mode automatically uses the best AI models for each step. You don't need to configure anything—just click "Start Analysis" and get high-quality results.
                  </p>
                  <p className="text-sm font-medium mb-2">What it does:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
                    <li>Uses powerful cloud AI to find claims in your text</li>
                    <li>Analyzes how different worldviews interpret those claims</li>
                    <li>Identifies where worldviews agree or disagree</li>
                    <li>Completes in about 30-60 seconds</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    <strong>When to use:</strong> Start here! This is the easiest way to get started and works great for most analyses.
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Advanced Mode</h4>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    <strong>For power users!</strong> This mode lets you choose exactly which AI models to use for each step. You can mix and match different options based on your needs.
                  </p>
                  <p className="text-sm font-medium mb-2">Your options:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
                    <li><strong>Local Models:</strong> Processed using local AI models, completely private, no API costs (slower but free)</li>
                    <li><strong>Cloud LLMs:</strong> More accurate and faster, but requires API access (recommended for best results)</li>
                    <li><strong>Gemma Steering:</strong> Experimental feature to amplify specific worldview perspectives (very slow, for research)</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    <strong>When to use:</strong> If you want to save API costs, need maximum privacy, or want to experiment with different model combinations.
                  </p>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>Quick Start Guide:</strong>
                  </p>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm text-muted-foreground ml-2">
                    <li>Start with <strong>Normal Mode</strong> to see how the analysis works</li>
                    <li>If you're happy with the results, stick with Normal Mode!</li>
                    <li>Only switch to <strong>Advanced Mode</strong> if you need to customize settings or save on API costs</li>
                  </ol>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <RadioGroup value={mode} onValueChange={(value) => onModeChange(value as AnalysisMode)}>
          <div className="space-y-3">
            <Card className={`p-4 cursor-pointer transition-all ${mode === "normal" ? "border-primary" : ""}`} onClick={() => onModeChange("normal")}>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="normal" id="normal" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-primary" />
                    <Label htmlFor="normal" className="text-base font-medium cursor-pointer">
                      Normal Mode
                    </Label>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    One-click analysis with optimized settings. Perfect for beginners and most users.
                  </p>
                </div>
              </div>
            </Card>

            <Card className={`p-4 cursor-pointer transition-all ${mode === "advanced" ? "border-primary" : ""}`} onClick={() => onModeChange("advanced")}>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="advanced" id="advanced" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="h-4 w-4 text-primary" />
                    <Label htmlFor="advanced" className="text-base font-medium cursor-pointer">
                      Advanced Mode
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Customize which AI models to use for each step. Choose between local models (free, private) or cloud AI (faster, more accurate).
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </RadioGroup>
      </div>
    </Card>
  );
};
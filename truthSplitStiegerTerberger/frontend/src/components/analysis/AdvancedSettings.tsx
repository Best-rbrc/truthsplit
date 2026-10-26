import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, Cloud, HelpCircle, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type ModelType = "local" | "llm" | "gemma";
export type LLMProvider = "openai" | "claude" | "gemini" | "grok" | "deepseek";
export type LLMModel = "gpt-5" | "gpt-5-mini" | "gpt-5-nano" | "claude-haiku-4-5-20251001" | "claude-sonnet-4-5-20250929" | "claude-opus-4-5-20251101" | "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.5-flash-lite" | "grok-4" | "grok-3" | "grok-3-mini" | "deepseek-v3";

interface LLMModelInfo {
  id: LLMModel;
  name: string;
  description: string;
  speed: string;
  cost: string;
  provider: LLMProvider;
  openrouterId: string; // The actual model ID to send to OpenRouter
}

export interface AdvancedSettingsConfig {
  claimExtractionModel: ModelType;
  divergenceAnalysisModel: ModelType;
  reasoningAnalysisModel: ModelType;
  llmProvider: LLMProvider;
  llmModel: LLMModel;
}

const availableLLMs: LLMModelInfo[] = [
  {
    id: "gpt-5",
    name: "GPT-5",
    description: "Most advanced OpenAI model for complex reasoning",
    speed: "Fast",
    cost: "$$$",
    provider: "openai",
    openrouterId: "openai/gpt-5"
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    description: "Balanced GPT-5 performance and cost",
    speed: "Very Fast",
    cost: "$$",
    provider: "openai",
    openrouterId: "openai/gpt-5-mini"
  },
  {
    id: "gpt-5-nano",
    name: "GPT-5 Nano",
    description: "Fastest, most cost-efficient GPT-5 variant",
    speed: "Very Fast",
    cost: "$",
    provider: "openai",
    openrouterId: "openai/gpt-5-nano"
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    description: "Fast and economical Anthropic model",
    speed: "Very Fast",
    cost: "$",
    provider: "claude",
    openrouterId: "anthropic/claude-haiku-4-5-20251001"
  },
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    description: "Balanced Claude model for most tasks",
    speed: "Fast",
    cost: "$$",
    provider: "claude",
    openrouterId: "anthropic/claude-sonnet-4-5-20250929"
  },
  {
    id: "claude-opus-4-5-20251101",
    name: "Claude Opus 4.5",
    description: "Most capable Claude model for complex reasoning",
    speed: "Medium",
    cost: "$$$",
    provider: "claude",
    openrouterId: "anthropic/claude-opus-4-5-20251101"
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Next-gen Gemini Pro with improved reasoning",
    speed: "Fast",
    cost: "$$$",
    provider: "gemini",
    openrouterId: "google/gemini-2.5-pro"
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Fast and cost-effective Gemini 2.5 Flash",
    speed: "Very Fast",
    cost: "$$",
    provider: "gemini",
    openrouterId: "google/gemini-2.5-flash"
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    description: "Google's lightweight Gemini 2.5 Flash Lite",
    speed: "Very Fast",
    cost: "$",
    provider: "gemini",
    openrouterId: "google/gemini-2.5-flash-lite",
  },
  {
    id: "grok-4",
    name: "Grok 4",
    description: "Most advanced xAI Grok model",
    speed: "Fast",
    cost: "$$$",
    provider: "grok",
    openrouterId: "x-ai/grok-4"
  },
  {
    id: "grok-3",
    name: "Grok 3",
    description: "Powerful xAI Grok model",
    speed: "Fast",
    cost: "$$",
    provider: "grok",
    openrouterId: "x-ai/grok-3"
  },
  {
    id: "grok-3-mini",
    name: "Grok 3 Mini",
    description: "Cost-efficient xAI Grok variant",
    speed: "Very Fast",
    cost: "$",
    provider: "grok",
    openrouterId: "x-ai/grok-3-mini"
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    description: "Advanced reasoning model from DeepSeek",
    speed: "Fast",
    cost: "$$",
    provider: "deepseek",
    openrouterId: "deepseek/deepseek-chat-v3-0324"
  },
];

interface AdvancedSettingsProps {
  settings: AdvancedSettingsConfig;
  onSettingsChange: (settings: AdvancedSettingsConfig) => void;
}

export const AdvancedSettings = ({ settings, onSettingsChange }: AdvancedSettingsProps) => {
  const updateSetting = (key: keyof AdvancedSettingsConfig, value: ModelType) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Advanced Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure which models to use for different analysis tasks
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Advanced Settings Guide</DialogTitle>
              <DialogDescription>
                Detailed explanation of each model option and when to use them
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 text-sm">
              <div>
                <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <span className="bg-primary/10 p-1.5 rounded">1</span>
                  Claim & Premise Extraction
                </h4>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>What it does:</strong> Finds the main arguments (claims) in your text and the reasons (premises) that support them. Think of it as identifying "what you're arguing" and "why you think so."
                </p>
                <div className="space-y-3">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="h-4 w-4 text-primary" />
                      <strong>Local ML Models</strong>
                    </div>
                    <p className="text-muted-foreground">
                      Uses local AI models that process data on our servers. Your data stays private, and there are no API costs.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Choose this if:</strong> You want maximum privacy, want to avoid API costs, or don't mind slightly slower processing
                    </p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Cloud className="h-4 w-4 text-primary" />
                      <strong>Cloud LLM</strong>
                    </div>
                    <p className="text-muted-foreground">
                      Uses powerful cloud AI (like GPT-5 or Claude) to find claims and premises. More accurate and faster than local models.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Choose this if:</strong> You want the best accuracy, faster results, or are analyzing complex arguments
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <span className="bg-primary/10 p-1.5 rounded">2</span>
                  Reasoning Analysis
                </h4>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>What it does:</strong> Shows how each worldview (like Libertarian, Progressive, etc.) interprets the claims. It explains their reasoning step-by-step, showing why they agree or disagree.
                </p>
                <div className="space-y-3">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="h-4 w-4 text-primary" />
                      <strong>Gemma (Local + Steering)</strong>
                      <Badge variant="outline" className="text-xs ml-2">Experimental</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Experimental feature that lets you make worldviews stronger or weaker. Useful for research to see how worldview intensity affects reasoning.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Choose this if:</strong> You're doing research and want to experiment with worldview strength
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      <strong>Warning:</strong> Very slow! Can take 30+ minutes. Not recommended for regular use.
                    </p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Cloud className="h-4 w-4 text-primary" />
                      <strong>Cloud LLM</strong>
                    </div>
                    <p className="text-muted-foreground">
                      Uses powerful cloud AI to analyze how each worldview thinks about the claims. Provides detailed, step-by-step reasoning for each perspective.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Choose this if:</strong> You want the best quality results and fastest processing (recommended for most users)
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <span className="bg-primary/10 p-1.5 rounded">3</span>
                  Divergence Analysis
                </h4>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>What it does:</strong> Finds where worldviews disagree with each other. Shows what they disagree about and why, helping you understand the key conflicts.
                </p>
                <div className="space-y-3">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="h-4 w-4 text-primary" />
                      <strong>Local NLI Models</strong>
                    </div>
                    <p className="text-muted-foreground">
                      Uses local AI models to find disagreements. Fast and free, but may miss some subtle conflicts.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Choose this if:</strong> You want to save API costs, need privacy, or are okay with slightly less detailed conflict analysis
                    </p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Cloud className="h-4 w-4 text-primary" />
                      <strong>Cloud LLM</strong>
                    </div>
                    <p className="text-muted-foreground">
                      Uses powerful cloud AI to find disagreements, including subtle ones that local models might miss. Provides detailed explanations of conflicts.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Choose this if:</strong> You want the most detailed conflict analysis, especially for complex or philosophical topics (recommended)
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                <h5 className="font-semibold mb-2 text-primary">Quick Recommendations</h5>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li><strong>Fastest & Best Quality:</strong> Cloud LLM for all three tasks</li>
                  <li><strong>Privacy-Focused:</strong> Local models for extraction + divergence, Cloud LLM for reasoning</li>
                  <li><strong>Budget-Friendly:</strong> Local models for all tasks (completely free, but slower)</li>
                  <li><strong>Research Only:</strong> Cloud LLM extraction + Gemma reasoning + Cloud LLM divergence (very slow!)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  <strong>Tip:</strong> If you're not sure, just use Cloud LLM for everything. It's the easiest and gives the best results!
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Model Configuration Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 rounded-lg p-6 border-2 border-primary/30 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-semibold flex items-center gap-2">
              Step 1: Choose Your AI Model
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              First, pick which AI model you want to use. This model will be used whenever you select "Cloud LLM" for any task in Step 2.
            </p>
          </div>
          <Badge variant="default" className="text-xs">Global Setting</Badge>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* LLM Provider Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">LLM Provider</Label>
            </div>
            <Select 
              value={settings.llmProvider} 
              onValueChange={(value) => {
                const provider = value as LLMProvider;
                // When provider changes, select first available model for that provider
                const firstModelForProvider = availableLLMs.find(m => m.provider === provider);
                if (firstModelForProvider) {
                  onSettingsChange({ 
                    ...settings, 
                    llmProvider: provider,
                    llmModel: firstModelForProvider.id
                  });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select LLM provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">
                  <span className="font-medium">OpenAI</span>
                </SelectItem>
                <SelectItem value="claude">
                  <span className="font-medium">Anthropic Claude</span>
                </SelectItem>
                <SelectItem value="gemini">
                  <span className="font-medium">Google Gemini</span>
                </SelectItem>
                <SelectItem value="grok">
                  <span className="font-medium">xAI Grok</span>
                </SelectItem>
                <SelectItem value="deepseek">
                  <span className="font-medium">DeepSeek</span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {settings.llmProvider === "openai" 
                ? "GPT-5, GPT-5 Mini, GPT-5 Nano"
                : settings.llmProvider === "claude"
                ? "Claude 4.5 Opus, Sonnet, Haiku"
                : settings.llmProvider === "gemini"
                ? "Gemini 2.5 Pro/Flash/Flash Lite"
                : settings.llmProvider === "grok"
                ? "Grok 4, Grok 3, Grok 3 Mini"
                : "DeepSeek V3"
              }
            </p>
          </div>

          {/* LLM Model Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Cloud LLM Model</Label>
            </div>
            <Select 
              value={settings.llmModel} 
              onValueChange={(value) => onSettingsChange({ ...settings, llmModel: value as LLMModel })}
            >
              <SelectTrigger className="w-full">
                <span>
                  {availableLLMs.find(m => m.id === settings.llmModel)?.name || "Select model"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {availableLLMs
                  .filter(model => model.provider === settings.llmProvider)
                  .map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full gap-8">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs">{model.speed}</Badge>
                          <Badge variant="secondary" className="text-xs">{model.cost}</Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This model will be used whenever you pick "Cloud LLM" in Step 2 below
            </p>
          </div>
        </div>
        
        {/* Visual indicator showing which tasks will use this model */}
        <div className="mt-4 pt-4 border-t border-primary/20">
          <p className="text-xs font-medium text-muted-foreground mb-2">This model will be used for:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <Cloud className="h-3 w-3 mr-1" />
              Claim Extraction (if Cloud LLM selected)
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Cloud className="h-3 w-3 mr-1" />
              Reasoning Analysis (if Cloud LLM selected)
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Cloud className="h-3 w-3 mr-1" />
              Divergence Analysis (if Cloud LLM selected)
            </Badge>
          </div>
        </div>
      </div>

      {/* Task Configuration Section */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-semibold flex items-center gap-2">
              Step 2: Choose Model Type for Each Task
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              For each analysis step, choose whether to use local models (free, private) or the cloud AI model you selected in Step 1.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">Per-Task Settings</Badge>
        </div>

        <div className="space-y-6">
          {/* Claim Extraction Model */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-primary/10 p-1.5 rounded">
                <span className="text-xs font-semibold text-primary">1</span>
              </div>
              <Label className="text-base font-medium">Claim & Premise Extraction</Label>
            </div>

        <RadioGroup 
          value={settings.claimExtractionModel} 
          onValueChange={(value) => updateSetting("claimExtractionModel", value as ModelType)}
        >
          <div className="grid gap-3">
            <Card 
              className={`p-4 cursor-pointer transition-all ${settings.claimExtractionModel === "local" ? "border-primary" : ""}`}
              onClick={() => updateSetting("claimExtractionModel", "local")}
            >
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="local" id="claim-local" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="h-4 w-4 text-primary" />
                    <Label htmlFor="claim-local" className="text-sm font-medium cursor-pointer">
                      Local ML Models
                    </Label>
                    <Badge variant="outline" className="text-xs">Fast</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uses local AI models. Free and private, but slightly slower than cloud AI.
                  </p>
                </div>
              </div>
            </Card>

            <Card 
              className={`p-4 cursor-pointer transition-all ${settings.claimExtractionModel === "llm" ? "border-primary border-2 bg-primary/5" : ""}`}
              onClick={() => updateSetting("claimExtractionModel", "llm")}
            >
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="llm" id="claim-llm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Cloud className="h-4 w-4 text-primary" />
                    <Label htmlFor="claim-llm" className="text-sm font-medium cursor-pointer">
                      Cloud LLM
                    </Label>
                    <Badge variant="outline" className="text-xs">Fast</Badge>
                    {settings.claimExtractionModel === "llm" && (
                      <Badge variant="default" className="text-xs ml-1">
                        {availableLLMs.find(m => m.id === settings.llmModel)?.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uses {availableLLMs.find(m => m.id === settings.llmModel)?.name || "selected Cloud LLM"}. Faster and more accurate. Requires backend API.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </RadioGroup>
      </div>

          {/* Reasoning Analysis Model */}
          <div className="space-y-3 pt-6 border-t">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-primary/10 p-1.5 rounded">
                <span className="text-xs font-semibold text-primary">2</span>
              </div>
              <Label className="text-base font-medium">Reasoning Analysis</Label>
            </div>

        <RadioGroup 
          value={settings.reasoningAnalysisModel} 
          onValueChange={(value) => updateSetting("reasoningAnalysisModel", value as ModelType)}
        >
          <div className="grid gap-3">
            <Card 
              className={`p-4 cursor-pointer transition-all ${settings.reasoningAnalysisModel === "gemma" ? "border-primary" : ""}`}
              onClick={() => updateSetting("reasoningAnalysisModel", "gemma")}
            >
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="gemma" id="reasoning-gemma" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="h-4 w-4 text-primary" />
                    <Label htmlFor="reasoning-gemma" className="text-sm font-medium cursor-pointer">
                      Gemma (Local + Steering)
                    </Label>
                    <Badge variant="outline" className="text-xs">Steerable</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Experimental: Makes worldviews stronger or weaker. Very slow (30+ minutes). For research only.
                  </p>
                </div>
              </div>
            </Card>

            <Card 
              className={`p-4 cursor-pointer transition-all ${settings.reasoningAnalysisModel === "llm" ? "border-primary border-2 bg-primary/5" : ""}`}
              onClick={() => updateSetting("reasoningAnalysisModel", "llm")}
            >
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="llm" id="reasoning-llm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Cloud className="h-4 w-4 text-primary" />
                    <Label htmlFor="reasoning-llm" className="text-sm font-medium cursor-pointer">
                      Cloud LLM
                    </Label>
                    <Badge variant="outline" className="text-xs">Advanced</Badge>
                    {settings.reasoningAnalysisModel === "llm" && (
                      <Badge variant="default" className="text-xs ml-1">
                        {availableLLMs.find(m => m.id === settings.llmModel)?.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uses the cloud AI model you selected in Step 1. Best quality and fastest option.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </RadioGroup>
      </div>

          {/* Divergence Analysis Model */}
          <div className="space-y-3 pt-6 border-t">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-primary/10 p-1.5 rounded">
                <span className="text-xs font-semibold text-primary">3</span>
              </div>
              <Label className="text-base font-medium">Divergence Analysis</Label>
            </div>

        <RadioGroup 
          value={settings.divergenceAnalysisModel}
          onValueChange={(value) => updateSetting("divergenceAnalysisModel", value as ModelType)}
        >
          <div className="grid gap-3">
            <Card 
              className={`p-4 cursor-pointer transition-all ${settings.divergenceAnalysisModel === "local" ? "border-primary" : ""}`}
              onClick={() => updateSetting("divergenceAnalysisModel", "local")}
            >
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="local" id="divergence-local" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="h-4 w-4 text-primary" />
                    <Label htmlFor="divergence-local" className="text-sm font-medium cursor-pointer">
                      Local NLI Models
                    </Label>
                    <Badge variant="outline" className="text-xs">Fast</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uses local AI models. Free and private, but may miss some subtle disagreements.
                  </p>
                </div>
              </div>
            </Card>

            <Card 
              className={`p-4 cursor-pointer transition-all ${settings.divergenceAnalysisModel === "llm" ? "border-primary border-2 bg-primary/5" : ""}`}
              onClick={() => updateSetting("divergenceAnalysisModel", "llm")}
            >
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="llm" id="divergence-llm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Cloud className="h-4 w-4 text-primary" />
                    <Label htmlFor="divergence-llm" className="text-sm font-medium cursor-pointer">
                      Cloud LLM
                    </Label>
                    <Badge variant="outline" className="text-xs">Deep Analysis</Badge>
                    {settings.divergenceAnalysisModel === "llm" && (
                      <Badge variant="default" className="text-xs ml-1">
                        {availableLLMs.find(m => m.id === settings.llmModel)?.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uses the cloud AI model you selected in Step 1. Finds even subtle disagreements and explains them in detail.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </RadioGroup>
          </div>
        </div>
      </div>
    </Card>
  );
};
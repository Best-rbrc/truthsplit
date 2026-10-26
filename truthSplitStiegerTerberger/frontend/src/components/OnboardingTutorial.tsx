import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Target,
  Network,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Eye,
  CheckCircle,
} from "lucide-react";

const TUTORIAL_STORAGE_KEY = "truthsplit_tutorial_completed";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface OnboardingTutorialProps {
  showFromUrl?: boolean;
}

export const OnboardingTutorial = ({ showFromUrl = false }: OnboardingTutorialProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Show tutorial if explicitly requested via URL or if user hasn't seen it
    if (showFromUrl) {
      setIsOpen(true);
    } else {
      const hasSeenTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (!hasSeenTutorial) {
        setIsOpen(true);
      }
    }
  }, [showFromUrl]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartAnalysis = () => {
    handleClose();
    // Already on analyze page, just close
  };

  const steps: TutorialStep[] = [
    {
      title: "Welcome to TruthSplit",
      description: "Discover how different worldviews shape arguments",
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            TruthSplit is an AI and ML-powered platform that analyzes arguments through multiple 
            ideological perspectives. Our system combines advanced language models (LLMs) with 
            machine learning techniques to show how different worldviews interpret the same claims 
            and discover where reasoning diverges.
          </p>
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <p className="text-sm font-medium mb-2">What you can do:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Analyze any text through 6 distinct worldviews (Libertarian, Religious Conservative, Eco-Justice, Populist Nationalist, Communist, Neo-Reactionary)</li>
              <li>See step-by-step reasoning chains for each perspective</li>
              <li>Identify where worldviews agree or disagree with detailed divergence analysis</li>
              <li>Explore value conflicts, assumption differences, and areas of common ground</li>
              <li>Visualize worldview positions in 2D and 3D factor spaces</li>
              <li>Chat with worldviews to understand their reasoning in detail</li>
            </ul>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">How it works:</p>
            <p className="text-sm text-muted-foreground">
              Our system uses a combination of cloud-based LLMs (like GPT-5, Claude, Gemini) for 
              reasoning analysis and local ML models (BART for NLI, Sentence Transformers for 
              embeddings) for efficient processing. You can choose between Normal Mode (optimized 
              defaults) or Advanced Mode (full control over model selection).
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 1: Upload Your Text",
      description: "Paste or type the text you want to analyze",
      icon: <Upload className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Start by entering the text you want to analyze. This could be an article, 
            essay, argument, opinion piece, or any piece of writing you'd like to examine 
            through different ideological lenses. The text should contain at least one 
            arguable claim or statement.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Our AI and ML system will:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Use LLMs or local ML models to extract the main claims from your text</li>
              <li>Identify supporting premises that back up each claim</li>
              <li>Structure the information for worldview analysis</li>
              <li>Present you with extracted claims to review and select</li>
            </ul>
          </div>
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <p className="text-sm font-medium mb-2">Tip:</p>
            <p className="text-sm text-muted-foreground">
              In Normal Mode, we use cloud LLMs for fast and accurate claim extraction. 
              In Advanced Mode, you can choose between local ML models (free, private) 
              or cloud LLMs (faster, more accurate).
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 2: Select Worldviews",
      description: "Choose 2-3 perspectives to analyze through",
      icon: <Target className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Select 2-3 worldviews from our collection of 6 distinct ideological perspectives. 
            Each worldview has unique values, assumptions, and reasoning patterns based on 
            comprehensive knowledge bases that define their core principles.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">Available Worldviews:</p>
              <ul className="text-muted-foreground space-y-0.5 text-xs">
                <li>• Libertarian - Individual liberty, free markets</li>
                <li>• Religious Conservative - Traditional values, faith</li>
                <li>• Eco-Justice - Environmental protection, social equity</li>
                <li>• Populist Nationalist - National sovereignty, popular will</li>
                <li>• Communist - Collective ownership, class struggle</li>
                <li>• Neo-Reactionary - Traditional hierarchy, anti-modernism</li>
              </ul>
            </div>
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
              <p className="font-medium mb-1">Why multiple perspectives?</p>
              <p className="text-muted-foreground text-xs">
                Comparing different worldviews reveals how the same claim can be interpreted 
                differently based on underlying values and assumptions. This helps you understand 
                the full spectrum of reasoning around any topic.
              </p>
            </div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Advanced Mode - Worldview Steering:</p>
            <p className="text-sm text-muted-foreground">
              In Advanced Mode with Gemma steering, you can amplify or weaken specific worldview 
              perspectives to see how worldview strength affects reasoning. This experimental 
              feature uses Sparse Autoencoders (SAE) to modify worldview representations.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 3: Explore the Analysis",
      description: "Discover insights across multiple tabs",
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            After our AI and ML models complete the analysis (typically 30-60 seconds), explore 
            your results through multiple visualization and analysis tabs:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Eye className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm mb-1">Overview</p>
                <p className="text-xs text-muted-foreground">
                  Quick summary of all worldviews' positions, consistency scores, and key insights. 
                  See at a glance which worldviews support or oppose each claim.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Network className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm mb-1">Reasoning Analysis</p>
                <p className="text-xs text-muted-foreground">
                  Detailed step-by-step reasoning chains showing how each worldview interprets claims. 
                  Includes key assumptions, value alignments, alternative approaches, and consistency metrics.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm mb-1">Divergence Analysis</p>
                <p className="text-xs text-muted-foreground">
                  Where and why worldviews disagree, including value conflicts, assumption differences, 
                  and areas of potential common ground. Uses LLMs or local NLI models for conflict detection.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm mb-1">Convergence Flow & Worldview Space</p>
                <p className="text-xs text-muted-foreground">
                  Visualize where reasoning overlaps and diverges, and explore worldview positions 
                  in 2D/3D factor spaces based on 16-dimensional ideological analysis.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <p className="text-sm font-medium mb-2">Chat Feature:</p>
            <p className="text-sm text-muted-foreground">
              Use the chat icon in the bottom right to have a conversation with any worldview. 
              The AI takes on that worldview's personality and reasoning style to answer questions 
              about the analyzed claims.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Ready to Get Started?",
      description: "Let's analyze your first text",
      icon: <ArrowRight className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            You're all set! The analysis process uses a combination of AI and ML models to provide 
            comprehensive insights. Normal Mode uses optimized defaults (cloud LLMs for reasoning 
            and divergence), while Advanced Mode lets you customize which models to use.
          </p>
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <p className="text-sm font-medium mb-2">Quick Tips for Best Results:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Start with Normal Mode for the best balance of speed and accuracy</li>
              <li>Try analyzing political articles, opinion pieces, or policy statements</li>
              <li>Compare 2-3 worldviews to see clear differences in reasoning</li>
              <li>Explore all tabs - each provides unique insights</li>
              <li>Use the chat feature to dive deeper into any worldview's reasoning</li>
              <li>Check consistency scores to understand how well each worldview's reasoning aligns</li>
            </ul>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">What Happens During Analysis:</p>
            <p className="text-sm text-muted-foreground">
              Our system uses LLMs to generate detailed reasoning for each worldview, ML models 
              (like BART for NLI) for consistency checking, and factor analysis to position 
              worldviews in ideological space. The entire process typically takes 30-60 seconds 
              in Normal Mode.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      } else {
        setIsOpen(open);
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {steps[currentStep].icon}
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {steps[currentStep].title}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {steps[currentStep].description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Content */}
          <div className="min-h-[200px]">
            {steps[currentStep].content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tutorial
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleStartAnalysis}>
                  Start Analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


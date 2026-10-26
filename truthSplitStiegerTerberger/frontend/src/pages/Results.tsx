import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AnalysisResult, Worldview, ConvergenceAnalysis } from "@/types/analysis";
import { OverviewTab } from "@/components/results/OverviewTab";
import { DetailedAnalysisTab } from "@/components/results/DetailedAnalysisTab";
import { ConvergenceFlowTab } from "@/components/results/ConvergenceFlowTab";
import { WorldviewSpaceTab } from "@/components/results/WorldviewSpaceTab";
import { DivergenceAnalysisTab } from "@/components/results/DivergenceAnalysisTab";
import { WorldviewChat } from "@/components/results/WorldviewChat";
import { ArrowLeft, FileText, Download, Trash2 } from "lucide-react";
import { worldviews } from "@/data/worldviews";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { deleteAnalysisBySlug, loadAnalysisBySlug, saveAnalysisBySlug } from "@/utils/analysisApi";

const Results = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { toast } = useToast();

  const [isLoadingSaved, setIsLoadingSaved] = useState<boolean>(!!slug);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [selectedWorldviews, setSelectedWorldviews] = useState<Worldview[]>([]);
  const [convergenceData, setConvergenceData] = useState<Record<string, ConvergenceAnalysis>>({});
  const [saveSlug, setSaveSlug] = useState("");
  const [saveTitle, setSaveTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSecret, setDeleteSecret] = useState("");
  const [showManage, setShowManage] = useState(false);

  useEffect(() => {
    const loadFromSession = () => {
      const storedResult = sessionStorage.getItem("analysisResult");
      const storedText = sessionStorage.getItem("analysisText");
      const storedWorldviews = sessionStorage.getItem("selectedWorldviews");
      const storedConvergence = sessionStorage.getItem("convergenceData");

      if (!storedResult || !storedText || !storedWorldviews) {
        console.error("❌ Missing required data in sessionStorage");
        navigate("/analyze");
        return;
      }

      const parsedResult = JSON.parse(storedResult);
      setResult(parsedResult);
      setAnalysisText(storedText);
      setSelectedWorldviews(JSON.parse(storedWorldviews));

      if (storedConvergence) {
        try {
          setConvergenceData(JSON.parse(storedConvergence));
        } catch {
          setConvergenceData({});
        }
      }
    };

    const loadFromSlug = async (slugValue: string) => {
      try {
        setIsLoadingSaved(true);
        const saved = await loadAnalysisBySlug(slugValue);
        setResult(saved.analysis_result);
        setAnalysisText(saved.analysis_text);
        setSelectedWorldviews(saved.selected_worldviews as Worldview[]);
        setConvergenceData(saved.convergence_data || {});
        setSaveTitle(saved.title || "");
      } catch (error) {
        console.error("❌ Error loading saved analysis:", error);
        toast({
          title: "Load Error",
          description: error instanceof Error ? error.message : "Failed to load analysis.",
          variant: "destructive",
        });
        navigate("/analyze");
      } finally {
        setIsLoadingSaved(false);
      }
    };

    if (slug) {
      loadFromSlug(slug);
    } else {
      loadFromSession();
    }
  }, [navigate, slug, toast]);

  useEffect(() => {
    if (!slug) {
      try {
        sessionStorage.setItem("convergenceData", JSON.stringify(convergenceData));
      } catch (e) {
        console.warn("Could not persist convergence data to sessionStorage", e);
      }
    }
  }, [convergenceData, slug]);

  if (!result || isLoadingSaved) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-7xl mx-auto">
            <Card className="p-6">
              <p className="text-muted-foreground">Loading results...</p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Ensure claims is always an array
  if (!result.claims || !Array.isArray(result.claims)) {
    result.claims = [];
  }

  // Ensure divergence_analysis is always an array
  if (!result.divergence_analysis || !Array.isArray(result.divergence_analysis)) {
    result.divergence_analysis = [];
  }
  
  // If no claims, show error message
  if (result.claims.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-7xl mx-auto">
            <Card className="p-6">
              <p className="text-muted-foreground">No analysis results found. Please run a new analysis.</p>
              <Button onClick={() => navigate("/analyze")} className="mt-4">
                New Analysis
              </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const getWorldviewInfo = (id: Worldview) => {
    return worldviews.find(wv => wv.id === id);
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "truthsplit-analysis.json";
    link.click();
  };

  const validateSlug = (value: string) => /^[a-z0-9_-]{3,50}$/.test(value);

  const handleSave = async () => {
    if (!saveSlug || !validateSlug(saveSlug)) {
      toast({
        title: "Invalid slug",
        description: "Use 3-50 chars: lowercase letters, numbers, dash, underscore.",
        variant: "destructive",
      });
      return;
    }
    if (!result) return;
    setIsSaving(true);
    try {
      await saveAnalysisBySlug(saveSlug, {
        analysis_result: result,
        analysis_text: analysisText,
        selected_worldviews: selectedWorldviews,
        convergence_data: convergenceData,
        title: saveTitle,
      }, overwriteExisting);
      toast({
        title: "Saved",
        description: `Analysis saved at /analysis/${saveSlug}`,
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not save analysis.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slug) return;
    if (!deleteSecret) {
      toast({
        title: "Delete secret required",
        description: "Enter the delete password before removing this analysis.",
        variant: "destructive",
      });
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAnalysisBySlug(slug, deleteSecret);
      toast({
        title: "Deleted",
        description: `Analysis ${slug} was removed.`,
      });
      navigate("/analyze");
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not delete analysis.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate("/analyze")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
              {slug && (
                <div className="flex items-center gap-2">
                  <Card className="px-3 py-2 text-sm text-muted-foreground">
                    Viewing saved analysis: <span className="font-semibold text-foreground">/analysis/{slug}</span>
                  </Card>
                  <Dialog open={showManage} onOpenChange={setShowManage}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Manage saved analysis"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Manage Saved Analysis</DialogTitle>
                        <DialogDescription>
                          Enter the delete password to remove this saved analysis.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Input
                          placeholder="Delete password"
                          type="password"
                          value={deleteSecret}
                          onChange={(e) => setDeleteSecret(e.target.value)}
                        />
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Save Analysis</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Analysis with Custom URL</DialogTitle>
                    <DialogDescription>
                      Choose a slug to access this analysis at /analysis/your-slug. Slugs: lowercase letters, numbers, dash, underscore.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        placeholder="e.g., analysis1 or climate-policy"
                        value={saveSlug}
                        onChange={(e) => setSaveSlug(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title (optional)</Label>
                      <Input
                        id="title"
                        placeholder="Optional title"
                        value={saveTitle}
                        onChange={(e) => setSaveTitle(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">Overwrite if exists</p>
                        <p className="text-xs text-muted-foreground">Allow updating an existing slug.</p>
                      </div>
                      <Switch checked={overwriteExisting} onCheckedChange={setOverwriteExisting} />
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={exportResults}>
                <Download className="mr-2 h-4 w-4" />
                Export Results
              </Button>
            </div>
          </div>

          {slug && showManage && (
            <div className="mb-4 flex items-center gap-3 flex-wrap">
              <Input
                placeholder="Delete password"
                type="password"
                value={deleteSecret}
                onChange={(e) => setDeleteSecret(e.target.value)}
                className="w-64"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          )}

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">Analysis Summary</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">Click to expand</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p className="line-clamp-3">{analysisText}</p>
                      </div>
                    </div>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Analysis Summary
                    </DialogTitle>
                    <DialogDescription>
                      The complete text that was analyzed
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {analysisText}
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Card className="p-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Identified Claims</h3>
                  <div className="space-y-2">
                    {result.claims.map((claim, idx) => (
                      <Dialog key={claim.claim_id}>
                        <DialogTrigger asChild>
                          <div className="text-sm p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                            <span className="font-medium">Claim {idx + 1}:</span>
                            <p className="text-muted-foreground line-clamp-2 mt-1">
                              {claim.claim_text}
                            </p>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Claim {idx + 1}</DialogTitle>
                            <DialogDescription>
                              Full claim text and premises
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Claim:</h4>
                              <p className="text-sm bg-muted/30 p-3 rounded-lg">
                                {claim.claim_text}
                              </p>
                            </div>
                            {claim.premises && claim.premises.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Premises:</h4>
                                <ul className="space-y-2">
                                  {claim.premises.map((premise, pIdx) => (
                                    <li key={pIdx} className="text-sm bg-muted/30 p-3 rounded-lg">
                                      {premise}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Selected Worldviews</h3>
                  <div className="space-y-2">
                    {selectedWorldviews.map((wvId) => {
                      const wv = getWorldviewInfo(wvId);
                      if (!wv) return null;
                      return (
                        <div key={wvId} className="flex items-center space-x-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: wv.color }}
                          />
                          <span className="text-sm">{wv.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="detailed">Reasoning Analysis</TabsTrigger>
                  <TabsTrigger value="divergence">Divergence Analysis</TabsTrigger>
                  <TabsTrigger value="convergence">Convergence Flow</TabsTrigger>
                  <TabsTrigger value="worldview-space">Worldview Space</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <OverviewTab result={result} selectedWorldviews={selectedWorldviews} />
                </TabsContent>

                <TabsContent value="detailed">
                  <DetailedAnalysisTab result={result} selectedWorldviews={selectedWorldviews} />
                </TabsContent>

                <TabsContent value="divergence">
                  <DivergenceAnalysisTab result={result} selectedWorldviews={selectedWorldviews} />
                </TabsContent>

                <TabsContent value="convergence">
                  <ConvergenceFlowTab 
                    result={result} 
                    selectedWorldviews={selectedWorldviews}
                    convergenceData={convergenceData}
                    setConvergenceData={setConvergenceData}
                  />
                </TabsContent>

                <TabsContent value="worldview-space">
                  <WorldviewSpaceTab result={result} selectedWorldviews={selectedWorldviews} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
        
        {/* Floating Chat Button */}
        <WorldviewChat result={result} />
      </main>
    </div>
  );
};

export default Results;

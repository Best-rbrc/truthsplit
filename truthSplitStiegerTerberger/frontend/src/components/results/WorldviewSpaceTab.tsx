import { useState, useMemo, useEffect } from "react";
import { AnalysisResult, Worldview } from "@/types/analysis";
import { useWorldviews } from "@/hooks/useWorldviews";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Info, Layers, Maximize2, HelpCircle } from "lucide-react";
import { FactorSpace3D } from "./FactorSpace3D";
import { CorrelationHeatmap } from "./CorrelationHeatmap";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Label as ChartLabel,
} from "recharts";

interface WorldviewSpaceTabProps {
  result: AnalysisResult;
  selectedWorldviews: Worldview[];
}

const formatFactorLabel = (key: string): string => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const WorldviewSpaceTab = ({ result, selectedWorldviews }: WorldviewSpaceTabProps) => {
  const worldviews = useWorldviews();
  const [activeView, setActiveView] = useState<string>("2d");
  const [xAxis, setXAxis] = useState<string>("individualism");
  const [yAxis, setYAxis] = useState<string>("equality_vs_liberty_priority");
  const [zAxis, setZAxis] = useState<string>("market_vs_state_trust");
  const [displayedWorldviews, setDisplayedWorldviews] = useState<Worldview[]>([]);

  // Initialize displayed worldviews when component mounts or selectedWorldviews change
  useEffect(() => {
    setDisplayedWorldviews(selectedWorldviews || []);
  }, [selectedWorldviews]);

  // Get available factors from worldviews
  const availableFactors = useMemo(() => {
    if (worldviews.length === 0) return [];
    const firstWv = worldviews[0];
    return Object.keys(firstWv.factors || {});
  }, [worldviews]);

  const factorLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    availableFactors.forEach(factorKey => {
      labels[factorKey] = formatFactorLabel(factorKey);
    });
    return labels;
  }, [availableFactors]);

  // Prepare 2D plot data
  const plotData2D = useMemo(() => {
    return displayedWorldviews.map((wvId) => {
      const wv = worldviews.find((w) => w.id === wvId);
      if (!wv || !wv.factors) return null;

      const xValue = wv.factors[xAxis as keyof typeof wv.factors];
      const yValue = wv.factors[yAxis as keyof typeof wv.factors];
      
      if (xValue === undefined || yValue === undefined) return null;

      return {
        id: wv.id,
        name: wv.name,
        x: xValue,
        y: yValue,
        color: wv.color,
      };
    }).filter(Boolean);
  }, [displayedWorldviews, xAxis, yAxis, worldviews]);


  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;
    const wv = worldviews.find((w) => w.id === data.id);

    return (
      <Card className="p-3 bg-background/95 backdrop-blur border-primary/20">
        <div className="space-y-2">
          <p className="font-semibold" style={{ color: data.color }}>
            {data.name}
          </p>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>
              <span className="font-medium">X ({factorLabels[xAxis]}):</span> {data.x.toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Y ({factorLabels[yAxis]}):</span> {data.y.toFixed(2)}
            </p>
          </div>
          {wv && (
            <div className="text-xs pt-2 border-t">
              <p className="text-muted-foreground">{wv.description}</p>
            </div>
          )}
        </div>
      </Card>
    );
  };


  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30 relative">
        <div className="flex items-start gap-3">
          <Layers className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm flex-1">
            <p className="font-medium">Worldview Factor Space</p>
            <p className="text-muted-foreground">
              Choose factors to visualize worldviews across {availableFactors.length} ideological dimensions.
              Worldviews close together share similar values, while those far apart have diverging positions.
              Select which worldviews to display and explore their relationships through 3D, 2D, and correlation views.
            </p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button className="absolute top-4 right-4 p-0 border-0 bg-transparent cursor-pointer hover:opacity-70 transition-opacity">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Worldview Factor Space</DialogTitle>
              <DialogDescription>
                Understanding the multi-dimensional ideological space
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">What is Factor Space?</h3>
                <p className="text-sm text-muted-foreground">
                  The factor space represents a multi-dimensional ideological landscape where each dimension
                  corresponds to a specific philosophical or political value (e.g., individualism, market trust,
                  equality vs liberty). Worldviews are positioned in this space based on their factor scores (-1 to +1)
                  on each dimension.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">3D Space View</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Shows worldviews positioned across three selected factor dimensions simultaneously.
                  Worldviews that are closer together in this space share similar values on those dimensions.
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                  <li>Rotate the view by dragging</li>
                  <li>Zoom in/out with scroll wheel</li>
                  <li>Hover over worldviews to see their names</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">2D Projection View</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Projects the multi-dimensional space onto a 2D plane using any two selected factors as axes.
                  This makes it easier to see relationships along specific dimensions.
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                  <li>Select any two factors to use as X and Y axes</li>
                  <li>Quadrants show different combinations of values</li>
                  <li>Distance from center (0,0) indicates strength of commitment</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">Correlation View</h3>
                <p className="text-sm text-muted-foreground">
                  Shows how different factors correlate with each other across the selected worldviews.
                  Strong correlations reveal fundamental linkages between different ideological dimensions.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Card>

      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="2d">
            <Layers className="h-4 w-4 mr-2" />
            2D Projection
          </TabsTrigger>
          <TabsTrigger value="3d">
            <Maximize2 className="h-4 w-4 mr-2" />
            3D Space
          </TabsTrigger>
          <TabsTrigger value="correlation">
            <Info className="h-4 w-4 mr-2" />
            Correlations
          </TabsTrigger>
        </TabsList>

        {/* 2D View */}
        <TabsContent value="2d" className="mt-4">
          <Card className="p-6">
            <div className="space-y-6">
              {/* Worldview Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Select Worldviews to Display</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (displayedWorldviews.length === worldviews.length) {
                        setDisplayedWorldviews([]);
                      } else {
                        setDisplayedWorldviews(worldviews.map(wv => wv.id as Worldview));
                      }
                    }}
                  >
                    {displayedWorldviews.length === worldviews.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {worldviews.map((wv) => (
                    <div key={wv.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`wv-2d-${wv.id}`}
                        checked={displayedWorldviews.includes(wv.id as Worldview)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setDisplayedWorldviews([...displayedWorldviews, wv.id as Worldview]);
                          } else {
                            setDisplayedWorldviews(displayedWorldviews.filter((id) => id !== wv.id));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`wv-2d-${wv.id}`}
                        className="text-sm cursor-pointer flex items-center gap-2"
                      >
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: wv.color }}
                        />
                        {wv.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">X-Axis Factor</label>
                  <Select value={xAxis} onValueChange={setXAxis}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(factorLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Y-Axis Factor</label>
                  <Select value={yAxis} onValueChange={setYAxis}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(factorLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      domain={[-1, 1]}
                      ticks={[-1, -0.5, 0, 0.5, 1]}
                      stroke="hsl(var(--muted-foreground))"
                    >
                      <ChartLabel
                        value={factorLabels[xAxis] || xAxis}
                        position="bottom"
                        offset={40}
                        className="fill-foreground"
                      />
                    </XAxis>
                    <YAxis
                      type="number"
                      dataKey="y"
                      domain={[-1, 1]}
                      ticks={[-1, -0.5, 0, 0.5, 1]}
                      stroke="hsl(var(--muted-foreground))"
                    >
                      <ChartLabel
                        value={factorLabels[yAxis] || yAxis}
                        angle={-90}
                        position="left"
                        offset={40}
                        className="fill-foreground"
                      />
                    </YAxis>
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Reference lines */}
                    <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={2} strokeOpacity={0.5} />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} strokeOpacity={0.5} />

                    {/* Worldviews */}
                    <Scatter data={plotData2D} fill="hsl(var(--primary))" shape="circle">
                      {plotData2D.map((entry: any, index: number) => (
                        <Cell key={`wv-${index}`} fill={entry.color} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <Card className="p-4 bg-muted/30">
                <div className="space-y-2 text-xs">
                  <p className="font-medium">Interpretation:</p>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    <li><strong>Hover over any worldview</strong> to see its exact position and description</li>
                    <li>Each worldview is positioned by its factor scores on the selected dimensions (-1 to +1)</li>
                    <li>Distance between worldviews indicates how similar they are on these specific factors</li>
                    <li>Quadrants show different combinations of the two selected factors</li>
                    <li>Distance from center (0,0) indicates strength of commitment to those values</li>
                  </ul>
                </div>
              </Card>
            </div>
          </Card>
        </TabsContent>

        {/* 3D View */}
        <TabsContent value="3d" className="mt-4">
          <Card className="p-4 bg-muted/30 mb-4">
            <p className="text-sm text-muted-foreground">
              <strong>3D Visualization:</strong> Choose any 3 factors to see worldviews positioned in 3D space.
              Worldviews close together share similar values, while those far apart have diverging positions.
              Rotate, zoom, and drag to explore. Hover over worldviews to see details.
            </p>
          </Card>
          <FactorSpace3D selectedWorldviews={selectedWorldviews} result={result} />
        </TabsContent>

        {/* Correlation View */}
        <TabsContent value="correlation" className="mt-4">
          <Card className="p-4 bg-muted/30 mb-4">
            <p className="text-sm text-muted-foreground">
              <strong>Factor Correlations:</strong> Shows how different ideological dimensions relate to each other
              across the selected worldviews. Strong correlations reveal fundamental linkages between values.
            </p>
          </Card>
          
          {/* Worldview Selector */}
          <Card className="p-6 mb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Select Worldviews to Display</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (displayedWorldviews.length === worldviews.length) {
                      setDisplayedWorldviews([]);
                    } else {
                      setDisplayedWorldviews(worldviews.map(wv => wv.id as Worldview));
                    }
                  }}
                >
                  {displayedWorldviews.length === worldviews.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {worldviews.map((wv) => (
                  <div key={wv.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`wv-corr-${wv.id}`}
                      checked={displayedWorldviews.includes(wv.id as Worldview)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setDisplayedWorldviews([...displayedWorldviews, wv.id as Worldview]);
                        } else {
                          setDisplayedWorldviews(displayedWorldviews.filter((id) => id !== wv.id));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`wv-corr-${wv.id}`}
                      className="text-sm cursor-pointer flex items-center gap-2"
                    >
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: wv.color }}
                      />
                      {wv.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          
          <CorrelationHeatmap selectedWorldviews={displayedWorldviews} />
        </TabsContent>
      </Tabs>
    </div>
  );
};


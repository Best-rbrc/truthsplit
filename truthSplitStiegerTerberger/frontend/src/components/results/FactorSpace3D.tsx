import { useState, useMemo, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html, Line } from "@react-three/drei";
import { AnalysisResult, Worldview } from "@/types/analysis";
import { useWorldviews } from "@/hooks/useWorldviews";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Info, HelpCircle, TrendingUp, TrendingDown } from "lucide-react";
import * as THREE from "three";

interface FactorSpace3DProps {
  selectedWorldviews: Worldview[];
  result: AnalysisResult;
}

// Convert CSV column name to readable label
const formatFactorLabel = (key: string): string => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Factor descriptions - explain what each factor measures
const factorDescriptions: Record<string, { description: string; low: string; high: string }> = {
  individualism: {
    description: "Measures the emphasis on individual autonomy versus collective responsibility.",
    low: "Collectivist: Prioritizes group welfare, shared responsibility, and community values.",
    high: "Individualist: Emphasizes personal freedom, self-reliance, and individual rights."
  },
  negative_vs_positive_rights: {
    description: "Distinguishes between freedom from interference (negative) and entitlement to resources (positive).",
    low: "Positive Rights: Believes in entitlements to healthcare, education, housing, etc.",
    high: "Negative Rights: Focuses on freedom from coercion and non-interference."
  },
  property_absolutism: {
    description: "Degree to which property rights are considered absolute versus subject to social constraints.",
    low: "Qualified: Property rights balanced with social needs, environmental concerns, or public good.",
    high: "Absolute: Strong protection of property rights with minimal exceptions."
  },
  market_vs_state_trust: {
    description: "Confidence in market mechanisms versus state intervention for economic organization.",
    low: "State Trust: Believes government planning and regulation are necessary for fairness.",
    high: "Market Trust: Prefers free markets, competition, and minimal state intervention."
  },
  deontology_vs_consequentialism: {
    description: "Ethical framework: rule-based principles versus outcome-based evaluation.",
    low: "Consequentialist: Judges actions by their outcomes and consequences.",
    high: "Deontological: Emphasizes moral rules, duties, and principles regardless of outcomes."
  },
  authority_tradition_vs_autonomy: {
    description: "Value placed on traditional authority and established norms versus individual autonomy.",
    low: "Autonomy: Prioritizes individual choice, questioning authority, and personal freedom.",
    high: "Tradition: Values established authority, cultural norms, and respect for tradition."
  },
  free_speech_absolutism: {
    description: "Extent to which free speech is considered an absolute right versus subject to limitations.",
    low: "Regulated: Supports restrictions on hate speech, misinformation, or harmful content.",
    high: "Absolute: Strong protection of free speech with minimal exceptions."
  },
  redistribution_acceptance: {
    description: "Support for wealth redistribution and social safety nets.",
    low: "Opposed: Prefers minimal redistribution, emphasizing individual responsibility.",
    high: "Supportive: Believes in significant redistribution to address inequality."
  },
  harm_sanctity_focus: {
    description: "Moral foundation emphasizing physical harm versus sanctity/purity concerns.",
    low: "Harm Focus: Primarily concerned with preventing physical and psychological harm.",
    high: "Sanctity Focus: Emphasizes purity, sacredness, and moral boundaries."
  },
  harm_ecological_focus: {
    description: "Priority given to environmental and ecological concerns.",
    low: "Low Priority: Economic growth and development take precedence over environmental concerns.",
    high: "High Priority: Environmental protection and sustainability are central values."
  },
  precaution: {
    description: "Precautionary principle: how much uncertainty requires preventive action.",
    low: "Risk-Tolerant: Willing to take risks when benefits are uncertain but potentially large.",
    high: "Precautionary: Prefers to avoid actions with uncertain but potentially severe consequences."
  },
  cosmopolitanism: {
    description: "Scope of moral concern: local/national versus global/humanity-wide.",
    low: "Nationalist: Prioritizes national interests and local community.",
    high: "Cosmopolitan: Emphasizes global citizenship and universal human concerns."
  },
  sufficiency_degrowth: {
    description: "Attitude toward economic growth: unlimited growth versus sufficiency or degrowth.",
    low: "Growth: Believes in unlimited economic growth as a primary goal.",
    high: "Sufficiency/Degrowth: Emphasizes sustainable limits and reducing consumption."
  },
  long_term_horizon: {
    description: "Time horizon for decision-making: immediate concerns versus long-term consequences.",
    low: "Short-Term: Focuses on immediate needs and near-term outcomes.",
    high: "Long-Term: Prioritizes intergenerational impacts and future consequences."
  },
  equality_vs_liberty_priority: {
    description: "Core priority: equality of outcomes versus individual liberty.",
    low: "Liberty Priority: Individual freedom and autonomy are paramount.",
    high: "Equality Priority: Reducing inequality and ensuring equal outcomes is central."
  },
  externality_sensitivity: {
    description: "Awareness and concern for external effects of individual actions on others.",
    low: "Low Sensitivity: Less concerned about indirect effects on others or society.",
    high: "High Sensitivity: Strongly considers how actions affect others and the broader system."
  }
};

interface Node3D {
  id: string;
  type: "worldview";
  label: string;
  position: [number, number, number];
  color: string;
  size: number;
  data?: any;
}

interface WorldviewNodeProps {
  node: Node3D;
  isHovered: boolean;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

const WorldviewNode = ({ node, isHovered, onPointerOver, onPointerOut }: WorldviewNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      const scale = isHovered ? 1.3 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
    if (glowRef.current) {
      const glowScale = isHovered ? 1.5 : 1.2;
      glowRef.current.scale.lerp(new THREE.Vector3(glowScale, glowScale, glowScale), 0.1);
    }
  });

  return (
    <group position={node.position}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[node.size * 0.5, 32, 32]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.2}
        />
      </mesh>
      
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <sphereGeometry args={[node.size * 0.4, 32, 32]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={0.5}
          metalness={0.3}
          roughness={0.3}
        />
      </mesh>
      
      <Text
        position={[0, node.size * 0.7 + 0.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        {node.label}
      </Text>
      {isHovered && (
        <Html distanceFactor={10}>
          <div className="bg-background/95 backdrop-blur border border-primary/20 rounded-lg p-2 text-xs max-w-[200px]">
            <p className="font-semibold">{node.label}</p>
            {node.data && (
              <div className="mt-1 space-y-0.5">
                <p>X: {node.data.x.toFixed(2)}</p>
                <p>Y: {node.data.y.toFixed(2)}</p>
                <p>Z: {node.data.z.toFixed(2)}</p>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
interface ReferencePlaneProps {
  axis: 'x' | 'y' | 'z';
  position: number;
}

const ReferencePlane = ({ axis, position }: ReferencePlaneProps) => {
  const size = 10;
  const segments = 20;

  let rotation: [number, number, number] = [0, 0, 0];

  if (axis === 'x') {
    rotation = [0, Math.PI / 2, 0];
  } else if (axis === 'y') {
    rotation = [Math.PI / 2, 0, 0];
  } else {
    rotation = [0, 0, 0];
  }

  let pos: [number, number, number];
  if (axis === 'x') pos = [position, 0, 0];
  else if (axis === 'y') pos = [0, position, 0];
  else pos = [0, 0, position];

  return (
    <mesh position={pos} rotation={rotation}>
      <planeGeometry args={[size, size, segments, segments]} />
      <meshStandardMaterial
        color="hsl(var(--muted-foreground))"
        transparent
        opacity={0.1}
        side={THREE.DoubleSide}
        wireframe
      />
    </mesh>
  );
};

interface AxisLabelsProps {
  xLabel: string;
  yLabel: string;
  zLabel: string;
  scale: number;
}

const AxisLabels = ({ xLabel, yLabel, zLabel, scale }: AxisLabelsProps) => {
  const axisLength = scale + 1;
  const arrowLength = 0.5;
  
  return (
    <>
      {/* X-Axis */}
      <Line
        points={[
          [0, 0, 0],
          [axisLength, 0, 0]
        ]}
        color="#ef4444"
        lineWidth={3}
      />
      <Text
        position={[axisLength + 0.5, 0, 0]}
        fontSize={0.4}
        color="#ef4444"
        anchorX="left"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        X: {xLabel}
      </Text>
      {/* X-axis arrow */}
      <mesh position={[axisLength, 0, 0]}>
        <coneGeometry args={[0.15, arrowLength, 8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      {/* Y-Axis */}
      <Line
        points={[
          [0, 0, 0],
          [0, axisLength, 0]
        ]}
        color="#10b981"
        lineWidth={3}
      />
      <Text
        position={[0, axisLength + 0.5, 0]}
        fontSize={0.4}
        color="#10b981"
        anchorX="center"
        anchorY="bottom"
        fontWeight="bold"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        Y: {yLabel}
      </Text>
      {/* Y-axis arrow */}
      <mesh position={[0, axisLength, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.15, arrowLength, 8]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>

      {/* Z-Axis */}
      <Line
        points={[
          [0, 0, 0],
          [0, 0, axisLength]
        ]}
        color="#3b82f6"
        lineWidth={3}
      />
      <Text
        position={[0, 0, axisLength + 0.5]}
        fontSize={0.4}
        color="#3b82f6"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        Z: {zLabel}
      </Text>
      {/* Z-axis arrow */}
      <mesh position={[0, 0, axisLength]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, arrowLength, 8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
    </>
  );
};

interface SceneProps {
  nodes: Node3D[];
  hoveredNode: string | null;
  setHoveredNode: (id: string | null) => void;
  xLabel: string;
  yLabel: string;
  zLabel: string;
  scale: number;
}

const Scene = ({ nodes, hoveredNode, setHoveredNode, xLabel, yLabel, zLabel, scale }: SceneProps) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Reference planes at origin */}
      <ReferencePlane axis="x" position={0} />
      <ReferencePlane axis="y" position={0} />
      <ReferencePlane axis="z" position={0} />

      {/* Axis labels and arrows */}
      <AxisLabels xLabel={xLabel} yLabel={yLabel} zLabel={zLabel} scale={scale} />

      {/* Render nodes */}
      {nodes.map((node) => {
        const isHovered = hoveredNode === node.id;
        return (
          <WorldviewNode
            key={node.id}
            node={node}
            isHovered={isHovered}
            onPointerOver={() => setHoveredNode(node.id)}
            onPointerOut={() => setHoveredNode(null)}
          />
        );
      })}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
    </>
  );
};

export const FactorSpace3D = ({ selectedWorldviews, result }: FactorSpace3DProps) => {
  const worldviews = useWorldviews();
  const [xAxis, setXAxis] = useState<string>("individualism");
  const [yAxis, setYAxis] = useState<string>("equality_vs_liberty_priority");
  const [zAxis, setZAxis] = useState<string>("market_vs_state_trust");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [displayedWorldviews, setDisplayedWorldviews] = useState<Worldview[]>([]);

  // Initialize displayed worldviews when component mounts or selectedWorldviews change
  useEffect(() => {
    setDisplayedWorldviews(selectedWorldviews || []);
  }, [selectedWorldviews]);

  // Get available factors
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

  // Update axes if they're not available
  useEffect(() => {
    if (availableFactors.length > 0) {
      if (!availableFactors.includes(xAxis)) {
        setXAxis(availableFactors.includes("individualism") ? "individualism" : availableFactors[0]);
      }
      if (!availableFactors.includes(yAxis) || yAxis === xAxis) {
        const preferred = availableFactors.includes("equality_vs_liberty_priority")
          ? "equality_vs_liberty_priority"
          : availableFactors.find(f => f !== xAxis) || availableFactors[0];
        setYAxis(preferred);
      }
      if (!availableFactors.includes(zAxis) || zAxis === xAxis || zAxis === yAxis) {
        const preferred = availableFactors.find(f => f !== xAxis && f !== yAxis) || availableFactors[0];
        setZAxis(preferred);
      }
    }
  }, [availableFactors, xAxis, yAxis, zAxis]);

  // Transform data to 3D nodes
  const nodes = useMemo(() => {
    const nodeList: Node3D[] = [];

    // Add worldview nodes
    displayedWorldviews.forEach((wvId) => {
      const wv = worldviews.find((w) => w.id === wvId);
      if (!wv || !wv.factors) return;

      const xValue = wv.factors[xAxis as keyof typeof wv.factors];
      const yValue = wv.factors[yAxis as keyof typeof wv.factors];
      const zValue = wv.factors[zAxis as keyof typeof wv.factors];

      if (xValue === undefined || yValue === undefined || zValue === undefined) return;

      // Scale from [-1, 1] to [-5, 5] for better visualization
      const scale = 5;
      nodeList.push({
        id: wvId,
        type: "worldview",
        label: wv.name,
        position: [xValue * scale, yValue * scale, zValue * scale],
        color: wv.color,
        size: 2.5,
        data: { x: xValue, y: yValue, z: zValue },
      });
    });

    return nodeList;
  }, [displayedWorldviews, worldviews, xAxis, yAxis, zAxis]);

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30 relative">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm flex-1">
            <p className="font-medium">3D Factor Space Explorer</p>
            <p className="text-muted-foreground">
              Choose any 3 factors to visualize worldviews in 3D space. Worldviews that are close together 
              share similar values on the selected dimensions, while those far apart have diverging positions. 
              Select which worldviews to display and explore their relationships. Drag to rotate, scroll to zoom.
            </p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button className="absolute top-4 right-4 p-0 border-0 bg-transparent cursor-pointer hover:opacity-70 transition-opacity">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>3D Factor Space Guide</DialogTitle>
              <DialogDescription>
                Complete guide to understanding the 3D Factor Space visualization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">What This Visualization Shows</h3>
                <p className="text-sm text-muted-foreground">
                  This 3D space visualizes worldviews across three ideological dimensions.
                  Each axis represents a different factor that characterizes how worldviews differ on core values and beliefs.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">How Worldviews Are Positioned</h3>
                <p className="text-sm text-muted-foreground">
                  Worldviews (octahedrons) are positioned directly by their factor scores:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Each worldview has a score from -1 to +1 for each factor</li>
                  <li>These scores come from the structured knowledge layer (CSV file)</li>
                  <li>The position in 3D space reflects these scores scaled to [-5, 5]</li>
                  <li>Worldviews close together share similar values on the selected dimensions</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Understanding the Axes</h3>
                <p className="text-sm text-muted-foreground">
                  You can select any three factors for the X, Y, and Z axes. Each factor ranges from -1 to +1:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>-1:</strong> One extreme of the dimension</li>
                  <li><strong>0:</strong> Neutral or balanced position</li>
                  <li><strong>+1:</strong> Opposite extreme of the dimension</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Factor Descriptions</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Detailed explanations of all {availableFactors.length} factors:
                </p>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {availableFactors.map((factorKey) => {
                    const factorInfo = factorDescriptions[factorKey];
                    if (!factorInfo) return null;
                    
                    return (
                      <div key={factorKey} className="p-3 border rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">{formatFactorLabel(factorKey)}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{factorInfo.description}</p>
                        <div className="space-y-1.5 text-xs">
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="font-medium mb-0.5 flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" />
                              Low (-1 to 0):
                            </p>
                            <p className="text-muted-foreground">{factorInfo.low}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="font-medium mb-0.5 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              High (0 to +1):
                            </p>
                            <p className="text-muted-foreground">{factorInfo.high}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Interacting with the Visualization</h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>Rotate:</strong> Click and drag to rotate the 3D view</li>
                  <li><strong>Zoom:</strong> Scroll to zoom in/out</li>
                  <li><strong>Hover:</strong> Hover over worldviews to see detailed information</li>
                  <li><strong>Select Worldviews:</strong> Choose which worldviews to display</li>
                  <li><strong>Select Axes:</strong> Choose any 3 factors to define the space</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Card>

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
                    id={`wv-${wv.id}`}
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
                    htmlFor={`wv-${wv.id}`}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
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

            <div className="space-y-2">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Z-Axis Factor</label>
              <Select value={zAxis} onValueChange={setZAxis}>
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

          <div className="h-[600px] w-full bg-background/50 rounded-lg overflow-hidden">
            {displayedWorldviews.length > 0 ? (
              <Canvas
                camera={{ position: [15, 15, 15], fov: 60 }}
                style={{ background: "hsl(var(--background))" }}
              >
                <Scene
                  nodes={nodes}
                  hoveredNode={hoveredNode}
                  setHoveredNode={setHoveredNode}
                  xLabel={factorLabels[xAxis] || xAxis}
                  yLabel={factorLabels[yAxis] || yAxis}
                  zLabel={factorLabels[zAxis] || zAxis}
                  scale={5}
                />
              </Canvas>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Select worldviews to display in the 3D space</p>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>X-Axis:</strong> {factorLabels[xAxis] || xAxis} (range: -1 to +1)
            </p>
            <p>
              <strong>Y-Axis:</strong> {factorLabels[yAxis] || yAxis} (range: -1 to +1)
            </p>
            <p>
              <strong>Z-Axis:</strong> {factorLabels[zAxis] || zAxis} (range: -1 to +1)
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};


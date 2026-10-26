import { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line, Trail } from "@react-three/drei";
import { AnalysisResult, Worldview } from "@/types/analysis";
import { transformToForceGraph3D, Node3D, Link3D } from "@/utils/forceGraphDataTransform";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import * as THREE from "three";

interface Particle {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  progress: number;
  speed: number;
  color: string;
  linkIndex: number;
}

interface ClaimNodeProps {
  node: Node3D;
  onClick: (node: Node3D) => void;
  isSelected: boolean;
}

const ClaimNode = ({ node, onClick, isSelected }: ClaimNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      // Gentle pulsing animation
      const scale = isSelected ? 1.3 : hovered ? 1.2 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(scale, scale, scale),
        0.1
      );
    }
  });

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={() => onClick(node)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[node.size * 0.3, 16, 16]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0.1}
        />
      </mesh>
      {(hovered || isSelected) && (
        <Text
          position={[0, node.size * 0.5 + 0.5, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {node.label}
        </Text>
      )}
    </group>
  );
};

interface WorldviewNodeProps {
  node: Node3D;
  onClick: (node: Node3D) => void;
  isSelected: boolean;
}

const WorldviewNode = ({ node, onClick, isSelected }: WorldviewNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Slow rotation
      meshRef.current.rotation.y += 0.005;
      
      // Scale animation
      const scale = isSelected ? 1.2 : hovered ? 1.1 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(scale, scale, scale),
        0.1
      );
    }
  });

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={() => onClick(node)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <octahedronGeometry args={[node.size * 0.5, 0]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={0.4}
          metalness={0.8}
          roughness={0.2}
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
    </group>
  );
};

interface AnimatedParticleProps {
  particle: Particle;
  onComplete: (id: string) => void;
}

const AnimatedParticle = ({ particle, onComplete }: AnimatedParticleProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Vector3[]>([]);
  const [showTrail, setShowTrail] = useState(true);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Update particle position
    particle.progress += particle.speed * delta;
    
    if (particle.progress >= 1) {
      onComplete(particle.id);
      return;
    }

    // Lerp between start and end
    meshRef.current.position.lerpVectors(
      new THREE.Vector3().copy(particle.position),
      new THREE.Vector3().copy(particle.position).add(particle.direction),
      particle.progress
    );

    // Update trail
    trailRef.current.push(meshRef.current.position.clone());
    if (trailRef.current.length > 20) {
      trailRef.current.shift();
    }

    // Pulsing glow effect
    const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <group>
      <Trail
        width={0.5}
        length={8}
        color={particle.color}
        attenuation={(t) => t * t}
      >
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial
            color={particle.color}
            transparent
            opacity={0.9}
          />
        </mesh>
      </Trail>
      {/* Glow effect */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshBasicMaterial
          color={particle.color}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
};

interface LinkProps {
  link: Link3D;
  nodes: Node3D[];
  opacity: number;
}

const Link = ({ link, nodes, opacity }: LinkProps) => {
  const sourceNode = nodes.find((n) => n.id === link.source);
  const targetNode = nodes.find((n) => n.id === link.target);

  if (!sourceNode || !targetNode) return null;

  const points = [
    new THREE.Vector3(...sourceNode.position),
    new THREE.Vector3(...targetNode.position),
  ];

  return (
    <Line
      points={points}
      color={link.color}
      lineWidth={link.strength * 2}
      transparent
      opacity={opacity * link.strength * 0.4}
      dashed={false}
    />
  );
};

interface SceneProps {
  nodes: Node3D[];
  links: Link3D[];
  selectedNode: Node3D | null;
  onNodeClick: (node: Node3D) => void;
}

const Scene = ({ nodes, links, selectedNode, onNodeClick }: SceneProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdCounter = useRef(0);

  const filteredLinks = useMemo(() => {
    if (!selectedNode) return links;
    return links.filter(
      (link) =>
        link.source === selectedNode.id || link.target === selectedNode.id
    );
  }, [links, selectedNode]);

  // Create particles periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (filteredLinks.length === 0) return;

      // Create 2-3 particles per interval
      const newParticles: Particle[] = [];
      const numParticles = Math.floor(Math.random() * 2) + 2;

      for (let i = 0; i < Math.min(numParticles, filteredLinks.length); i++) {
        const linkIndex = Math.floor(Math.random() * filteredLinks.length);
        const link = filteredLinks[linkIndex];
        
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);

        if (!sourceNode || !targetNode) continue;

        const startPos = new THREE.Vector3(...sourceNode.position);
        const endPos = new THREE.Vector3(...targetNode.position);
        const direction = endPos.clone().sub(startPos);

        newParticles.push({
          id: `particle_${particleIdCounter.current++}`,
          position: startPos.clone(),
          direction,
          progress: 0,
          speed: 0.3 + Math.random() * 0.4, // Vary speed
          color: link.color,
          linkIndex,
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);
    }, 800); // Create particles every 800ms

    return () => clearInterval(interval);
  }, [filteredLinks, nodes]);

  const handleParticleComplete = (id: string) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {/* Ambient particles glow */}
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#60a5fa" distance={20} />

      {/* Render links */}
      {filteredLinks.map((link, idx) => (
        <Link
          key={idx}
          link={link}
          nodes={nodes}
          opacity={selectedNode ? 1 : 0.6}
        />
      ))}

      {/* Render animated particles */}
      {particles.map((particle) => (
        <AnimatedParticle
          key={particle.id}
          particle={particle}
          onComplete={handleParticleComplete}
        />
      ))}

      {/* Render nodes */}
      {nodes.map((node) => {
        const isSelected = selectedNode?.id === node.id;
        const isFiltered =
          selectedNode &&
          !filteredLinks.some(
            (link) => link.source === node.id || link.target === node.id
          ) &&
          node.id !== selectedNode.id;

        if (isFiltered) return null;

        return node.type === "worldview" ? (
          <WorldviewNode
            key={node.id}
            node={node}
            onClick={onNodeClick}
            isSelected={isSelected}
          />
        ) : (
          <ClaimNode
            key={node.id}
            node={node}
            onClick={onNodeClick}
            isSelected={isSelected}
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

interface ForceGraphTabProps {
  result: AnalysisResult;
  selectedWorldviews: Worldview[];
}

export const ForceGraphTab = ({
  result,
  selectedWorldviews,
}: ForceGraphTabProps) => {
  const [selectedNode, setSelectedNode] = useState<Node3D | null>(null);
  const graphData = useMemo(
    () => transformToForceGraph3D(result, selectedWorldviews),
    [result, selectedWorldviews]
  );

  const handleNodeClick = (node: Node3D) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="font-medium">3D Force-Directed Graph</p>
            <p className="text-muted-foreground">
              Worldviews appear as large octahedrons acting as gravitational centers.
              Claims are pulled toward worldviews based on reasoning strength. Animated
              particles flow along connections showing reasoning dynamics in real-time with
              glowing trails. Click any node to filter connections. Drag to rotate, scroll to zoom.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-support" />
                <span className="text-xs">Support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-oppose" />
                <span className="text-xs">Oppose</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-conditional" />
                <span className="text-xs">Conditional</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {selectedNode && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Selected: {selectedNode.type === "worldview" ? "Worldview" : "Claim"}</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear selection
              </button>
            </div>
            <p className="text-sm text-foreground">{selectedNode.label}</p>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="h-[600px] bg-background/50">
          <Canvas
            camera={{ position: [0, 5, 20], fov: 60 }}
            style={{ background: "hsl(var(--background))" }}
          >
            <Scene
              nodes={graphData.nodes}
              links={graphData.links}
              selectedNode={selectedNode}
              onNodeClick={handleNodeClick}
            />
          </Canvas>
        </div>
      </Card>
    </div>
  );
};

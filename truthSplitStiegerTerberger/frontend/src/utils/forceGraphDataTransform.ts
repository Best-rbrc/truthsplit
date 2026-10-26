import { AnalysisResult, Worldview } from "@/types/analysis";
import { worldviews } from "@/data/worldviews";

export interface Node3D {
  id: string;
  type: "worldview" | "claim";
  label: string;
  position: [number, number, number];
  color: string;
  size: number;
}

export interface Link3D {
  source: string;
  target: string;
  strength: number;
  color: string;
}

export interface ForceGraph3DData {
  nodes: Node3D[];
  links: Link3D[];
}

const getPositionColor = (position: string): string => {
  switch (position) {
    case "support":
      return "hsl(142, 76%, 36%)"; // support green
    case "oppose":
      return "hsl(0, 72%, 51%)"; // oppose red
    case "conditional":
      return "hsl(38, 92%, 50%)"; // conditional orange
    default:
      return "hsl(220, 9%, 46%)"; // neutral
  }
};

export const transformToForceGraph3D = (
  result: AnalysisResult,
  selectedWorldviews: Worldview[]
): ForceGraph3DData => {
  const nodes: Node3D[] = [];
  const links: Link3D[] = [];

  // Create worldview nodes (gravitational centers)
  // Position them in a circle around the origin
  const radius = 8;
  selectedWorldviews.forEach((wvId, index) => {
    const wv = worldviews.find((w) => w.id === wvId);
    if (!wv) return;

    const angle = (index / selectedWorldviews.length) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    nodes.push({
      id: wvId,
      type: "worldview",
      label: wv.name,
      position: [x, 0, z],
      color: wv.color,
      size: 2.5,
    });
  });

  // Create claim nodes and links
  result.claims.forEach((claim, claimIndex) => {
    const claimId = `claim_${claim.claim_id}`;

    // Calculate average position based on worldview attractions
    let avgX = 0;
    let avgY = 0;
    let avgZ = 0;
    let totalWeight = 0;

    selectedWorldviews.forEach((wvId) => {
      const analysis = claim.worldview_analyses[wvId];
      if (!analysis) return;

      const wvNode = nodes.find((n) => n.id === wvId);
      if (!wvNode) return;

      // Strength is based on confidence and consistency
      const strength =
        (analysis.confidence +
          analysis.consistency_scores.premise_claim +
          analysis.consistency_scores.worldview_internal) /
        3;

      avgX += wvNode.position[0] * strength;
      avgY += wvNode.position[1] * strength;
      avgZ += wvNode.position[2] * strength;
      totalWeight += strength;
    });

    if (totalWeight > 0) {
      avgX /= totalWeight;
      avgY /= totalWeight;
      avgZ /= totalWeight;
    }

    // Add slight vertical offset based on claim index
    avgY += (claimIndex - result.claims.length / 2) * 1.5;

    // Determine dominant position across worldviews
    const positions = selectedWorldviews.map(
      (wvId) => claim.worldview_analyses[wvId]?.position
    );
    const supportCount = positions.filter((p) => p === "support").length;
    const opposeCount = positions.filter((p) => p === "oppose").length;
    let dominantPosition = "conditional";
    if (supportCount > opposeCount) dominantPosition = "support";
    else if (opposeCount > supportCount) dominantPosition = "oppose";

    nodes.push({
      id: claimId,
      type: "claim",
      label: claim.claim_text.slice(0, 50) + "...",
      position: [avgX, avgY, avgZ],
      color: getPositionColor(dominantPosition),
      size: 1,
    });

    // Create links from claims to worldviews
    selectedWorldviews.forEach((wvId) => {
      const analysis = claim.worldview_analyses[wvId];
      if (!analysis) return;

      const strength =
        (analysis.confidence +
          analysis.consistency_scores.premise_claim +
          analysis.consistency_scores.worldview_internal) /
        3;

      links.push({
        source: claimId,
        target: wvId,
        strength,
        color: getPositionColor(analysis.position),
      });
    });
  });

  return { nodes, links };
};

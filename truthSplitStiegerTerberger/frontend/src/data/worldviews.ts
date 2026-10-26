import { WorldviewInfo } from "@/types/analysis";
import { fetchWorldviews } from "@/utils/analysisApi";

// Metadata for worldviews (UI-specific, not in CSV)
const worldviewMetadata: Record<string, Omit<WorldviewInfo, 'factors' | 'id'>> = {
  libertarian: {
    name: "Libertarian",
    description: "Emphasizes individual freedom, free markets, and minimal government intervention. Values personal responsibility and voluntary cooperation.",
    keyValues: ["Individual Liberty", "Free Markets", "Property Rights", "Personal Responsibility"],
    icon: "Scale",
    color: "#f59e0b",
  },
  religious_conservative: {
    name: "Religious Conservative",
    description: "Centers traditional values, moral order, and faith-based principles. Emphasizes family, community, and divine purpose.",
    keyValues: ["Traditional Values", "Moral Order", "Faith", "Family & Community"],
    icon: "BookOpen",
    color: "#8b5cf6",
  },
  eco_justice: {
    name: "Eco-Justice",
    description: "Prioritizes environmental sustainability, social equity, and systemic change. Connects environmental and social justice.",
    keyValues: ["Environmental Stewardship", "Social Justice", "Sustainability", "Equality"],
    icon: "Leaf",
    color: "#10b981",
  },
  populist_nationalist: {
    name: "Populist Nationalist",
    description: "Focuses on national sovereignty, citizen interests, and skepticism of elites and globalism. Prioritizes the common people.",
    keyValues: ["National Sovereignty", "Citizen Priority", "Common People", "Self-Determination"],
    icon: "Flag",
    color: "#ef4444",
  },
  communist: {
    name: "Communist",
    description: "Centers on class struggle, collective ownership of means of production, and elimination of class distinctions. Prioritizes worker control and equality.",
    keyValues: ["Class Struggle", "Collective Ownership", "Worker Control", "Equality", "Solidarity"],
    icon: "Users",
    color: "#dc2626",
  },
  neo_reactionary: {
    name: "Neo-Reactionary / Techno-Monarchist",
    description: "Prioritizes competent elite governance over democratic participation. Believes democracy is inefficient; governance should be run by proven experts and corporate-state hybrids.",
    keyValues: ["Meritocratic Elitism", "Technocratic Authority", "Efficiency", "Competence"],
    icon: "Crown",
    color: "#6366f1",
  },
};

// No fallback - all factor scores must come from CSV via API

// Cache for fetched worldviews
let cachedWorldviews: WorldviewInfo[] | null = null;
let worldviewsPromise: Promise<WorldviewInfo[]> | null = null;

/**
 * Fetch worldviews from API and merge with metadata
 */
export const loadWorldviews = async (): Promise<WorldviewInfo[]> => {
  // Return cached if available
  if (cachedWorldviews) {
    return cachedWorldviews;
  }

  // Return existing promise if already fetching
  if (worldviewsPromise) {
    return worldviewsPromise;
  }

  // Fetch from API
  worldviewsPromise = (async () => {
    try {
      const { worldviews: apiWorldviews, factorColumns } = await fetchWorldviews();
      
      // Merge API data with metadata
      const merged: WorldviewInfo[] = apiWorldviews.map((wv: any) => {
        const metadata = worldviewMetadata[wv.id] || {
          name: wv.name || wv.id,
          description: "",
          keyValues: [],
          icon: "Scale",
          color: "#888888",
        };

        return {
          id: wv.id as WorldviewInfo['id'],
          name: metadata.name,
          description: metadata.description,
          keyValues: metadata.keyValues,
          icon: metadata.icon,
          color: metadata.color,
          factors: wv.factors || {},
        };
      });

      cachedWorldviews = merged;
      return merged;
    } catch (error) {
      console.error("Failed to fetch worldviews from API:", error);
      // Return empty array if API fails - no fallback hardcoded data
      cachedWorldviews = [];
      return [];
    } finally {
      worldviewsPromise = null;
    }
  })();

  return worldviewsPromise;
};

// Export for backward compatibility - will be populated after first load
export let worldviews: WorldviewInfo[] = [];

// Initialize on module load
loadWorldviews().then(wvs => {
  worldviews = wvs;
}).catch(err => {
  console.error("Error loading worldviews:", err);
  worldviews = [];
});

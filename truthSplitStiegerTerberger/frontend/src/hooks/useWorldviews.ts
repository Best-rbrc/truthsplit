import { useState, useEffect } from "react";
import { WorldviewInfo } from "@/types/analysis";
import { loadWorldviews } from "@/data/worldviews";

/**
 * React hook to fetch and use worldviews with factor scores from API
 * Components using this hook will automatically re-render when worldviews are loaded
 * Returns empty array if API fails - no hardcoded fallback
 */
export const useWorldviews = (): WorldviewInfo[] => {
  const [wvs, setWvs] = useState<WorldviewInfo[]>([]);

  useEffect(() => {
    loadWorldviews().then(setWvs).catch(err => {
      console.error("Error loading worldviews in hook:", err);
      setWvs([]); // No fallback - return empty array
    });
  }, []);

  return wvs;
};


import { useMemo } from "react";
import { Worldview } from "@/types/analysis";
import { useWorldviews } from "@/hooks/useWorldviews";
import { Card } from "@/components/ui/card";

interface CorrelationHeatmapProps {
  selectedWorldviews: Worldview[];
}

// Calculate Pearson correlation coefficient between two worldviews
const calculateCorrelation = (wv1Id: Worldview, wv2Id: Worldview, worldviews: any[]): number => {
  const wv1 = worldviews.find((w) => w.id === wv1Id);
  const wv2 = worldviews.find((w) => w.id === wv2Id);

  if (!wv1 || !wv2) return 0;

  const factors = Object.keys(wv1.factors) as Array<keyof typeof wv1.factors>;
  const n = factors.length;

  // Calculate means
  const mean1 = factors.reduce((sum, key) => sum + wv1.factors[key], 0) / n;
  const mean2 = factors.reduce((sum, key) => sum + wv2.factors[key], 0) / n;

  // Calculate correlation
  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  factors.forEach((key) => {
    const diff1 = wv1.factors[key] - mean1;
    const diff2 = wv2.factors[key] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  });

  if (denom1 === 0 || denom2 === 0) return 0;

  return numerator / Math.sqrt(denom1 * denom2);
};

// Get color based on correlation value
const getCorrelationColor = (correlation: number, opacity: number = 1): string => {
  if (correlation >= 0.7) return `hsla(142, 76%, 36%, ${opacity})`; // Strong positive - green
  if (correlation >= 0.3) return `hsla(142, 76%, 50%, ${opacity})`; // Moderate positive - light green
  if (correlation >= -0.3) return `hsla(220, 9%, 46%, ${opacity})`; // Weak - gray
  if (correlation >= -0.7) return `hsla(38, 92%, 50%, ${opacity})`; // Moderate negative - orange
  return `hsla(0, 72%, 51%, ${opacity})`; // Strong negative - red
};

const getCorrelationLabel = (correlation: number): string => {
  const absCorr = Math.abs(correlation);
  if (absCorr >= 0.7) return "Strong";
  if (absCorr >= 0.3) return "Moderate";
  return "Weak";
};

export const CorrelationHeatmap = ({ selectedWorldviews }: CorrelationHeatmapProps) => {
  const worldviews = useWorldviews();
  
  const correlationMatrix = useMemo(() => {
    const matrix: { row: Worldview; col: Worldview; value: number }[] = [];

    selectedWorldviews.forEach((wv1) => {
      selectedWorldviews.forEach((wv2) => {
        matrix.push({
          row: wv1,
          col: wv2,
          value: calculateCorrelation(wv1, wv2, worldviews),
        });
      });
    });

    return matrix;
  }, [selectedWorldviews, worldviews]);

  const cellSize = selectedWorldviews.length <= 3 ? 120 : 100;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Worldview Correlation Matrix</h3>
          <p className="text-sm text-muted-foreground">
            Shows how similar worldviews are across all 16 factor dimensions. Correlation
            ranges from -1 (opposite) to +1 (identical). Hover for details.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex">
              {/* Empty corner cell */}
              <div style={{ width: cellSize, height: cellSize }} className="flex-shrink-0" />

              {/* Column headers */}
              {selectedWorldviews.map((wvId) => {
                const wv = worldviews.find((w) => w.id === wvId);
                if (!wv) return null;
                return (
                  <div
                    key={wvId}
                    style={{ width: cellSize, height: cellSize }}
                    className="flex items-center justify-center flex-shrink-0 p-2"
                  >
                    <div className="text-center">
                      <div
                        className="h-4 w-4 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: wv.color }}
                      />
                      <p className="text-xs font-medium line-clamp-2">{wv.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            {selectedWorldviews.map((rowWvId) => {
              const rowWv = worldviews.find((w) => w.id === rowWvId);
              if (!rowWv) return null;

              return (
                <div key={rowWvId} className="flex">
                  {/* Row header */}
                  <div
                    style={{ width: cellSize, height: cellSize }}
                    className="flex items-center justify-center flex-shrink-0 p-2"
                  >
                    <div className="text-center">
                      <div
                        className="h-4 w-4 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: rowWv.color }}
                      />
                      <p className="text-xs font-medium line-clamp-2">{rowWv.name}</p>
                    </div>
                  </div>

                  {/* Cells */}
                  {selectedWorldviews.map((colWvId) => {
                    const cell = correlationMatrix.find(
                      (c) => c.row === rowWvId && c.col === colWvId
                    );
                    if (!cell) return null;

                    const isDiagonal = rowWvId === colWvId;
                    const correlation = cell.value;

                    return (
                      <div
                        key={`${rowWvId}-${colWvId}`}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: isDiagonal
                            ? "hsl(var(--muted))"
                            : getCorrelationColor(correlation, 0.8),
                        }}
                        className="flex items-center justify-center flex-shrink-0 border border-border/50 transition-all hover:scale-105 hover:shadow-lg cursor-pointer group relative"
                      >
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">
                            {correlation.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {isDiagonal ? "Self" : getCorrelationLabel(correlation)}
                          </p>
                        </div>

                        {/* Tooltip on hover */}
                        {!isDiagonal && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-48 pointer-events-none">
                            <Card className="p-2 bg-background/95 backdrop-blur shadow-lg border-primary/20">
                              <div className="text-xs space-y-1">
                                <p className="font-semibold">
                                  {rowWv.name} ↔ {worldviews.find((w) => w.id === colWvId)?.name}
                                </p>
                                <p className="text-muted-foreground">
                                  Correlation: <span className="font-medium">{correlation.toFixed(3)}</span>
                                </p>
                                <p className="text-muted-foreground">
                                  {correlation > 0.7 ? (
                                    "Very similar across dimensions"
                                  ) : correlation > 0.3 ? (
                                    "Moderately aligned"
                                  ) : correlation > -0.3 ? (
                                    "Mixed alignment"
                                  ) : correlation > -0.7 ? (
                                    "Moderately opposing"
                                  ) : (
                                    "Strongly opposing"
                                  )}
                                </p>
                              </div>
                            </Card>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Correlation Strength</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-8 rounded"
                style={{ backgroundColor: getCorrelationColor(0.85, 1) }}
              />
              <span>Strong Positive (0.7 to 1.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-8 rounded"
                style={{ backgroundColor: getCorrelationColor(0.5, 1) }}
              />
              <span>Moderate Positive (0.3 to 0.7)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-8 rounded"
                style={{ backgroundColor: getCorrelationColor(0, 1) }}
              />
              <span>Weak (-0.3 to 0.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-8 rounded"
                style={{ backgroundColor: getCorrelationColor(-0.5, 1) }}
              />
              <span>Moderate Negative (-0.7 to -0.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-8 rounded"
                style={{ backgroundColor: getCorrelationColor(-0.85, 1) }}
              />
              <span>Strong Negative (-1.0 to -0.7)</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Interpretation:</strong> High positive correlations indicate worldviews
            that share similar positions across most dimensions. High negative correlations
            suggest opposing positions. The diagonal (self-correlation) is always 1.0.
          </p>
        </div>
      </div>
    </Card>
  );
};

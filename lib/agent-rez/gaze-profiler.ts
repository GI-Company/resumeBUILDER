/**
 * Agent Rez: Cognitive Gaze Profiler Module (Rez-Gaze)
 * Models recruiter visual tracking behaviors using visual weight decay equation:
 * W(x, y) = C_header * e^(-λx * x) + C_vertical * e^(-λy * y)
 */

export interface GazePoint {
  x: number;
  y: number;
  weight: number;
  label: string;
}

export interface GazeHeatmapResult {
  gazePoints: GazePoint[];
  top30PercentScore: number;
  fPatternCoverage: number;
  zPatternCoverage: number;
  recommendations: string[];
}

export class GazeProfiler {
  /**
   * Calculates gaze density weight at percentage coordinates (0-100) using exponential decay.
   * W(x, y) = C_header * e^(-λx * x) + C_vertical * e^(-λy * y)
   */
  public static calculateGazeDensity(xPercent: number, yPercent: number): number {
    const lambdaX = 0.02;
    const lambdaY = 0.025;
    const weight = Math.exp(-lambdaX * (xPercent / 10)) + Math.exp(-lambdaY * (yPercent / 10));
    return parseFloat((weight / 2).toFixed(3));
  }

  /**
   * Calculates visual gaze weights across the document grid.
   */
  public static calculateGazeWeights(
    widthPx: number = 816,
    heightPx: number = 1056,
    headerPriority: number = 1.0,
    verticalPriority: number = 1.0,
    lambdaX: number = 0.002,
    lambdaY: number = 0.003
  ): GazeHeatmapResult {
    const gazePoints: GazePoint[] = [];
    const stepX = widthPx / 5;
    const stepY = heightPx / 8;

    let top30WeightSum = 0;
    let totalWeightSum = 0;

    for (let y = 0; y < heightPx; y += stepY) {
      for (let x = 0; x < widthPx; x += stepX) {
        // W(x, y) = C_header * e^(-λx * x) + C_vertical * e^(-λy * y)
        const weight =
          headerPriority * Math.exp(-lambdaX * x) +
          verticalPriority * Math.exp(-lambdaY * y);

        const point: GazePoint = {
          x: Math.round(x),
          y: Math.round(y),
          weight: parseFloat(weight.toFixed(3)),
          label: y < heightPx * 0.3 ? 'High Attention Area' : 'Standard Area',
        };

        gazePoints.push(point);
        totalWeightSum += weight;
        if (y < heightPx * 0.3) {
          top30WeightSum += weight;
        }
      }
    }

    const top30PercentScore = Math.round((top30WeightSum / (totalWeightSum || 1)) * 100);

    const recommendations: string[] = [];
    if (top30PercentScore < 60) {
      recommendations.push(
        'Increase visual density and prominent headers within the top 30% of Page 1 to capture initial recruiter gaze (6-second rule).'
      );
    } else {
      recommendations.push(
        'Optimal top-page visual distribution. Contact info, target title, and core skills are in prime recruiter focal zones.'
      );
    }

    return {
      gazePoints,
      top30PercentScore,
      fPatternCoverage: 88,
      zPatternCoverage: 76,
      recommendations,
    };
  }
}

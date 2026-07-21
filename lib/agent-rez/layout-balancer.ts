/**
 * Agent Rez: Whitespace & Layout Rebalancer Module (Rez-Balance)
 * Solves C(θ) = w1*(R_white - 0.40)² + w2*(H_total - H_target)²
 * Dynamically targets 35% to 50% document whitespace density.
 */

export interface LayoutProperties {
  lineHeight: number;
  fontSize: number;
  sectionSpacing: number;
  sidePadding: number;
  calculatedWhitespaceRatio: number;
}

export class LayoutRebalancer {
  /**
   * Calculates optimal typography, padding, and line heights to achieve a balanced whitespace ratio.
   * @param contentVolume Character or pixel volume of text
   * @param targetHeight Physical page height (e.g. 1056px for Letter, 1123px for A4)
   */
  public static calculateOptimalLayout(
    contentVolume: number,
    targetHeight: number = 1056
  ): LayoutProperties {
    const baselineRatio = contentVolume / targetHeight;

    if (baselineRatio > 0.85) {
      // High volume text -> Compact dense layout
      return {
        lineHeight: 1.15,
        fontSize: 10,
        sectionSpacing: 10,
        sidePadding: 15,
        calculatedWhitespaceRatio: 0.35,
      };
    } else if (baselineRatio < 0.4) {
      // Low volume text -> Generous spaced layout
      return {
        lineHeight: 1.5,
        fontSize: 12,
        sectionSpacing: 25,
        sidePadding: 24,
        calculatedWhitespaceRatio: 0.5,
      };
    }

    // Standard balanced layout
    return {
      lineHeight: 1.35,
      fontSize: 11,
      sectionSpacing: 18,
      sidePadding: 20,
      calculatedWhitespaceRatio: 0.42,
    };
  }

  /**
   * Calculates cost C(θ) for a given whitespace ratio and height target.
   */
  public static calculateCost(
    whitespaceRatio: number,
    currentHeight: number,
    targetHeight: number,
    w1: number = 1.0,
    w2: number = 1.0
  ): number {
    const ratioCost = Math.pow(whitespaceRatio - 0.4, 2);
    const heightCost = Math.pow(currentHeight - targetHeight, 2);
    return w1 * ratioCost + w2 * heightCost;
  }
}

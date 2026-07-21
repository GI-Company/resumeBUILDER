/**
 * Agent Rez: Structural Parser & ATS Sanitizer Module (Rez-Parser)
 * Enforces single-column, linear semantic token streams and calculates
 * action-verb saliency scores for ATS optimization.
 */

export interface SemanticNode {
  id: string;
  category: 'header' | 'experience' | 'education' | 'skills' | 'projects' | 'general';
  text: string;
  importanceScore: number;
}

export class StructuralParser {
  /**
   * Sanitizes raw HTML or structured text content into a flat, linear array of SemanticNodes.
   */
  public static sanitizeAndParse(rawContent: string): SemanticNode[] {
    if (!rawContent) return [];

    // Strips out nested visual formatting, keeping the plain text structure intact
    const cleanBlocks = rawContent
      .replace(/<div[^>]*class="[^"]*float-[^"]*"[^>]*>/gi, '<!-- Break Column -->')
      .replace(/<table[^>]*>/gi, '<!-- Structural Grid Box -->')
      .split('\n');

    return cleanBlocks
      .map((block, index) => {
        const parsedText = block.replace(/<\/?[^>]+(>|$)/g, '').trim();
        return {
          id: `node_${index}_${Date.now()}`,
          category: this.classifySemanticBlock(parsedText),
          text: parsedText,
          importanceScore: this.calculateSaliencyScore(parsedText),
        };
      })
      .filter((node) => node.text.length > 0);
  }

  /**
   * Classifies a text block into ATS semantic categories.
   */
  public static classifySemanticBlock(
    text: string
  ): 'header' | 'experience' | 'education' | 'skills' | 'projects' | 'general' {
    const lower = text.toLowerCase();
    if (/(education|university|college|degree|bachelor|master|phd|gpa)/.test(lower)) return 'education';
    if (/(experience|employment|work history|career|engineer|developer|manager|lead|architect)/.test(lower))
      return 'experience';
    if (/(skills|technologies|languages|frameworks|tools|stack|databases)/.test(lower)) return 'skills';
    if (/(projects|portfolio|open source|contributions)/.test(lower)) return 'projects';
    if (/(email|phone|linkedin|github|portfolio|location|summary)/.test(lower)) return 'header';
    return 'general';
  }

  /**
   * Calculates the ATS saliency score based on action verbs, numbers, and key achievements.
   */
  public static calculateSaliencyScore(text: string): number {
    let score = 1.0;
    
    // High-value action verbs
    if (/(led|built|optimized|engineered|architected|spearheaded|scaled|reduced|increased|generated|automated|pioneered)/i.test(text)) {
      score += 2.5;
    }
    
    // Quantifiable metrics (numbers, percentages, dollar amounts)
    if (/\b\d+(%|\+|k|m|b)?\b/i.test(text) || /\$\d+/.test(text)) {
      score += 2.0;
    }

    // Temporal context (dates / years)
    if (/\b(20\d{2}|19\d{2})\b/.test(text)) {
      score += 1.5;
    }

    return parseFloat(score.toFixed(2));
  }
}

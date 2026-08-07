/**
 * Agent Rez: Deterministic ATS Engine (Rez-ATS)
 * Replaces LLM-guessed scoring with reproducible keyword extraction + matching.
 * Same (resumeText, jobDescription) pair ALWAYS produces the same score.
 *
 * Score = weighted sum of:
 *   - keyword coverage   (60%) — canonical taxonomy terms from the JD found in the resume
 *   - section completeness (15%) — header/experience/education/skills sections present
 *   - quantified metrics  (15%) — lines with numbers/%/$ (real, measurable impact)
 *   - action-verb strength (10%) — weak-verb ratio vs. total verb-led lines
 *
 * Weights are constants, not tuned per-request, so results are auditable.
 */

import { SKILLS_TAXONOMY, VARIANT_LOOKUP, MAX_VARIANT_WORDS, TaxonomyEntry } from './skills-taxonomy';
import { StructuralParser } from './structural-parser';
import { verbReplacements } from './verb-booster';

export interface KeywordHit {
  term: string;
  category: TaxonomyEntry['category'];
  weight: number;
}

export interface SectionCheck {
  category: 'header' | 'experience' | 'education' | 'skills';
  present: boolean;
}

export interface AtsAuditResult {
  score: number; // 0-100, deterministic
  keywordCoverage: number; // 0-100
  matchedKeywords: KeywordHit[];
  missingKeywords: KeywordHit[]; // sorted by weight desc, highest-impact gaps first
  sectionChecks: SectionCheck[];
  metricsScore: number; // 0-100
  verbScore: number; // 0-100
  weakVerbsFound: string[];
  breakdown: {
    keywordContribution: number;
    sectionContribution: number;
    metricsContribution: number;
    verbContribution: number;
  };
}

export interface CompletenessCheck {
  complete: boolean;
  missingSections: string[];
}

/**
 * Structural completeness gate for AI-generated resume JSON — run this
 * BEFORE committing an AI response to the store, not after. Distinct from
 * runAtsAudit's sectionChecks (which inspects rendered resume text); this
 * checks the parsed JSON payload directly, e.g. right after a Groq call.
 */
export function checkResumeCompleteness(parsed: any): CompletenessCheck {
  const missingSections: string[] = [];
  if (!Array.isArray(parsed?.experiences) || parsed.experiences.length === 0) missingSections.push('experiences');
  if (!Array.isArray(parsed?.educations) || parsed.educations.length === 0) missingSections.push('educations');
  if (!Array.isArray(parsed?.skills) || parsed.skills.length === 0) missingSections.push('skills');
  if (!parsed?.summary || String(parsed.summary).trim().length < 10) missingSections.push('summary');
  return { complete: missingSections.length === 0, missingSections };
}

const WEIGHTS = {
  keyword: 0.6,
  section: 0.15,
  metrics: 0.15,
  verb: 0.1,
};

// Section lines that boost keyword weight (requirements are what actually gets screened on)
const REQUIREMENTS_HEADER = /(requirements|qualifications|must have|what you.?ll need|skills required|you have|minimum qualifications)/i;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s+#./-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scanPass(normalizedText: string): Map<string, { entry: TaxonomyEntry; count: number }> {
  const words = normalizedText.split(' ');
  const found = new Map<string, { entry: TaxonomyEntry; count: number }>();

  for (let i = 0; i < words.length; i++) {
    for (let n = Math.min(MAX_VARIANT_WORDS, words.length - i); n >= 1; n--) {
      const phrase = words.slice(i, i + n).join(' ');
      const entry = VARIANT_LOOKUP.get(phrase);
      if (entry) {
        const existing = found.get(entry.canonical);
        if (existing) {
          existing.count += 1;
        } else {
          found.set(entry.canonical, { entry, count: 1 });
        }
        break; // longest match wins at this position, avoid double counting substrings
      }
    }
  }
  return found;
}

/**
 * Scans text for taxonomy terms. Runs two passes — one with '/' preserved
 * (catches compound tokens like "CI/CD", "A/B testing") and one with '/'
 * split into a space (catches "or" usage like "Agile/Scrum" meaning two
 * separate terms) — and merges results. Both passes are pure functions of
 * the input text, so the merged result stays fully deterministic.
 */
function scanForTaxonomyTerms(normalizedText: string): Map<string, { entry: TaxonomyEntry; count: number }> {
  const joined = scanPass(normalizedText);
  const split = scanPass(normalizedText.replace(/\//g, ' ').replace(/\s+/g, ' ').trim());

  const merged = new Map(joined);
  split.forEach((value, key) => {
    const existing = merged.get(key);
    if (existing) {
      existing.count = Math.max(existing.count, value.count);
    } else {
      merged.set(key, value);
    }
  });
  return merged;
}

/**
 * Extracts weighted keywords from a job description. Frequency is capped
 * (a term repeated 20 times isn't 20x more important) and terms appearing
 * under a requirements/qualifications header get a fixed bonus.
 */
function extractJobKeywords(jobDescription: string): KeywordHit[] {
  const normalized = normalize(jobDescription);
  const found = scanForTaxonomyTerms(normalized);

  // Determine which lines fall under a requirements-style header for weighting
  const lines = jobDescription.split('\n');
  let inRequirementsBlock = false;
  const requirementsText: string[] = [];
  for (const line of lines) {
    if (REQUIREMENTS_HEADER.test(line)) {
      inRequirementsBlock = true;
      continue;
    }
    if (inRequirementsBlock) {
      if (line.trim() === '') continue;
      requirementsText.push(line);
    }
  }
  const requirementsTerms = scanForTaxonomyTerms(normalize(requirementsText.join(' ')));

  const hits: KeywordHit[] = [];
  found.forEach(({ entry, count }, canonical) => {
    const cappedFrequency = Math.min(count, 5); // diminishing returns after 5 mentions
    const baseWeight = 1 + (cappedFrequency - 1) * 0.2; // 1.0 to 1.8
    const requirementsBonus = requirementsTerms.has(canonical) ? 0.75 : 0;
    hits.push({ term: canonical, category: entry.category, weight: parseFloat((baseWeight + requirementsBonus).toFixed(2)) });
  });

  return hits.sort((a, b) => b.weight - a.weight);
}

function matchKeywords(resumeText: string, jobKeywords: KeywordHit[]): { matched: KeywordHit[]; missing: KeywordHit[] } {
  const normalizedResume = normalize(resumeText);
  const resumeTerms = scanForTaxonomyTerms(normalizedResume);

  const matched: KeywordHit[] = [];
  const missing: KeywordHit[] = [];

  for (const kw of jobKeywords) {
    if (resumeTerms.has(kw.term)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  return { matched, missing: missing.sort((a, b) => b.weight - a.weight) };
}

function checkSections(resumeText: string): SectionCheck[] {
  const lines = resumeText.split('\n').filter((l) => l.trim().length > 0);
  const present = new Set<string>();
  for (const line of lines) {
    const category = StructuralParser.classifySemanticBlock(line);
    if (category !== 'general' && category !== 'projects') present.add(category);
  }
  return (['header', 'experience', 'education', 'skills'] as const).map((category) => ({
    category,
    present: present.has(category),
  }));
}

function scoreMetrics(resumeText: string): number {
  // Only count metrics in experience/project lines — a graduation year or
  // GPA under Education isn't a quantified *achievement*, and counting it
  // was inflating scores on resumes with no real impact metrics at all.
  const lines = resumeText
    .split('\n')
    .filter((l) => l.trim().length > 20)
    .filter((l) => {
      const category = StructuralParser.classifySemanticBlock(l);
      return category === 'experience' || category === 'projects' || category === 'general';
    });
  if (lines.length === 0) return 0;
  const metricLines = lines.filter((l) => /\b\d+(%|\+|k|m|b)?\b/i.test(l) || /\$\d+/.test(l));
  // A well-quantified resume has metrics on roughly a third of substantive lines; 33%+ scores full marks.
  const ratio = metricLines.length / lines.length;
  return Math.min(100, Math.round((ratio / 0.33) * 100));
}

function scoreVerbs(resumeText: string): { score: number; weakVerbsFound: string[] } {
  const lines = resumeText.split('\n').filter((l) => l.trim().length > 20);
  if (lines.length === 0) return { score: 0, weakVerbsFound: [] };

  const weakVerbsFound = new Set<string>();
  let weakCount = 0;
  for (const line of lines) {
    for (const weak of Object.keys(verbReplacements)) {
      const regex = new RegExp(`\\b${weak}\\b`, 'i');
      if (regex.test(line)) {
        weakVerbsFound.add(weak);
        weakCount++;
        break; // count each line once
      }
    }
  }
  const weakRatio = weakCount / lines.length;
  const score = Math.max(0, Math.min(100, Math.round((1 - weakRatio) * 100)));
  return { score, weakVerbsFound: Array.from(weakVerbsFound) };
}

/**
 * Runs the full deterministic ATS audit. Same inputs -> same outputs, always.
 */
export function runAtsAudit(resumeText: string, jobDescription: string): AtsAuditResult {
  const jobKeywords = extractJobKeywords(jobDescription);
  const { matched, missing } = matchKeywords(resumeText, jobKeywords);

  const totalWeight = jobKeywords.reduce((sum, k) => sum + k.weight, 0);
  const matchedWeight = matched.reduce((sum, k) => sum + k.weight, 0);
  const keywordCoverage = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

  const sectionChecks = checkSections(resumeText);
  const sectionScore = Math.round((sectionChecks.filter((s) => s.present).length / sectionChecks.length) * 100);

  const metricsScore = scoreMetrics(resumeText);
  const { score: verbScore, weakVerbsFound } = scoreVerbs(resumeText);

  const keywordContribution = keywordCoverage * WEIGHTS.keyword;
  const sectionContribution = sectionScore * WEIGHTS.section;
  const metricsContribution = metricsScore * WEIGHTS.metrics;
  const verbContribution = verbScore * WEIGHTS.verb;

  const score = Math.round(keywordContribution + sectionContribution + metricsContribution + verbContribution);

  return {
    score,
    keywordCoverage,
    matchedKeywords: matched,
    missingKeywords: missing.slice(0, 10), // top 10 highest-impact gaps
    sectionChecks,
    metricsScore,
    verbScore,
    weakVerbsFound,
    breakdown: {
      keywordContribution: parseFloat(keywordContribution.toFixed(1)),
      sectionContribution: parseFloat(sectionContribution.toFixed(1)),
      metricsContribution: parseFloat(metricsContribution.toFixed(1)),
      verbContribution: parseFloat(verbContribution.toFixed(1)),
    },
  };
}

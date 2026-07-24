// ============================================================
//  MYresume — Strict Domain Types
//  All data structures used across the app are defined here.
//  Do NOT use `any` — if you need flexibility, use `unknown`
//  and narrow it with a type guard.
// ============================================================

// --- Atomic Resume Content Types ---

export interface Bullet {
  id: string;
  text: string;
}

export interface Experience {
  id: string;
  title: string;
  date: string;
  meta: string;
  bullets: Bullet[];
}

export interface Education {
  id: string;
  degree: string;
  date?: string;
  bullets: Bullet[];
}

export interface Skill {
  id: string;
  title: string;
  items: string;
}

export interface License {
  id: string;
  text: string;
}

export interface Project {
  id: string;
  title: string;
  date?: string;
  meta?: string;
  bullets: Bullet[];
}

export interface Publication {
  id: string;
  title: string;
  date?: string;
  meta?: string;
  bullets: Bullet[];
}

export interface Award {
  id: string;
  title: string;
  date?: string;
  meta?: string;
  bullets: Bullet[];
}

// --- Design Config ---

export interface DesignConfig {
  template: string;
  fontHeading: string;
  fontBody: string;
  accent: string;
  panel: string;
  paper: string;
  layout: string;
  scale: number;
  radius: number;
  lineHeight: number;
  gap: number;
  headingStyle: string;
  italic: boolean;
  pageSize: string;
  headerAlign: string;
  listStyle: string;
  pageMargin: number;
  pageMarginLeftRight?: number;
  pageMarginTopBottom?: number;
  itemSpacing: number;
  jobLayout: 'split' | 'stacked';
  boxOpacity: number;
  boxShadow: string;
  borderStyle: string;
  backdropBlur: number;
}

// --- Section Headers (user-editable heading text) ---

export type SectionId =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'licenses'
  | 'projects'
  | 'publications'
  | 'awards';

export type SectionHeaders = Partial<Record<SectionId, string>>;

// --- Full Resume State ---

export interface ResumeState {
  name: string;
  contactLine: string;
  summary: string;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  licenses: License[];
  projects: Project[];
  publications: Publication[];
  awards: Award[];
  footer: string;
  profilePhoto: string | null;
  design: DesignConfig;
  sections: SectionId[];
  sectionHeaders: SectionHeaders;
  manualBreaks: Partial<Record<SectionId, boolean>>;
}

// --- AI Action Types ---

export type AiAction =
  | 'rewrite_bullet'
  | 'generate_summary'
  | 'cover_letter'
  | 'tailor_to_job'
  | 'suggest_skills'
  | 'general';

// --- API Response Types ---

export interface AiStreamChunk {
  text: string;
  model: string;
  done: boolean;
}

export interface SaveResponse {
  success: boolean;
  code: string;
  message?: string;
  id?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  resetTime: Date;
  isAuthenticated: boolean;
}

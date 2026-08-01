import { z } from 'zod';
import type { AiAction } from './types';

// --- Groq AI Prompt ---

const aiActionSchema = z.enum([
  'rewrite_bullet',
  'generate_summary',
  'cover_letter',
  'tailor_to_job',
  'suggest_skills',
  'autoformat',
  'guided_interview',
  'general',
] satisfies [AiAction, ...AiAction[]]);

export const groqPromptSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt cannot be empty')
    .max(15000, 'Prompt is too long (max 15,000 characters)'),
  systemPrompt: z
    .string()
    .max(5000, 'System prompt is too long (max 5,000 characters)')
    .optional(),
  temperature: z.number().min(0).max(1).optional(),
  aiAction: aiActionSchema.optional().default('general'),
});

export type GroqPromptInput = z.infer<typeof groqPromptSchema>;

// --- Raw Text Resume Parser ---

export const parseResumeSchema = z.object({
  rawText: z
    .string()
    .min(10, 'Text is too short to parse')
    .max(20000, 'Text exceeds parsing limits (max 20,000 characters)'),
  existingResume: z.any().optional(),
});

// --- Cover Letter ---

const bulletSchema = z.object({
  id: z.string(),
  text: z.string(),
});

const experienceSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string().optional().default(''),
  meta: z.string().optional().default(''),
  bullets: z.array(bulletSchema).default([]),
});

const educationSchema = z.object({
  id: z.string(),
  degree: z.string(),
  date: z.string().optional(),
  bullets: z.array(bulletSchema).default([]),
});

const skillSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.string(),
});

const resumeStateSchema = z.object({
  name: z.string().default(''),
  contactLine: z.string().optional().default(''),
  summary: z.string().optional().default(''),
  experiences: z.array(experienceSchema).default([]),
  educations: z.array(educationSchema).default([]),
  skills: z.array(skillSchema).default([]),
});

export const coverLetterSchema = z.object({
  resumeState: resumeStateSchema,
  jobDescription: z
    .string()
    .max(10000, 'Job description is too long')
    .optional(),
  role: z.string().max(200, 'Role is too long').optional(),
  company: z.string().max(200, 'Company is too long').optional(),
});

export type CoverLetterInput = z.infer<typeof coverLetterSchema>;

// --- Document Parser ---

export const parseDocSchema = z.object({
  base64Data: z.string().min(10, 'Invalid file data'),
  mimeType: z.string().min(1, 'Missing MIME type'),
  filename: z.string().optional(),
});

// --- LinkedIn Parser ---

export const parseLinkedinSchema = z.object({
  input: z
    .string()
    .min(5, 'Input is too short to parse')
    .max(30000, 'Input is too long'),
});

// --- Voice Transcription ---

export const transcribeSchema = z.object({
  audioBase64: z.string().min(10, 'Invalid audio data'),
  mimeType: z
    .string()
    .refine(
      (v) => ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg'].includes(v),
      'Unsupported audio format'
    ),
});

import { z } from 'zod';

export const groqPromptSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(10000, "Prompt is too long"),
  systemPrompt: z.string().max(2000, "System prompt is too long").optional(),
  temperature: z.number().min(0).max(1).optional()
});

export const parseResumeSchema = z.object({
  rawText: z.string().min(10, "Text is too short to parse").max(20000, "Text exceeds parsing limits")
});

export const coverLetterSchema = z.object({
  resumeState: z.any(), // Keeping loose for now, could be strictly typed
  jobDescription: z.string().max(10000, "Job description is too long").optional(),
  role: z.string().max(200, "Role is too long").optional(),
  company: z.string().max(200, "Company is too long").optional()
});

export const parseDocSchema = z.object({
  base64Data: z.string().min(10, "Invalid file data"),
  mimeType: z.string().min(1, "Missing MIME type"),
  filename: z.string().optional()
});

export const parseLinkedinSchema = z.object({
  input: z.string().min(5, "Input is too short to parse").max(30000, "Input is too long")
});

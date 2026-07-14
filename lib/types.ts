export interface ResumeContent {
  name: string;
  summary: string;
  experiences: { title: string; date: string; bullets: { text: string }[] }[];
  educations: { degree: string; bullets: { text: string }[] }[];
  skills: { items: string };
  contactLine?: string;
  footer?: string;
  design?: any;
  sections?: any;
  manualBreaks?: any;
  licenses?: any;
  profilePhoto?: any;
}

export interface SaveResponse {
  success: boolean;
  code: string;
  message?: string;
  id?: string;
}

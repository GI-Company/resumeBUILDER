import React, { useState } from "react";
import {
  Sparkles, X, Bot, FileText, CheckSquare, Eye, Send,
  RefreshCw, CloudUpload, Copy, Download, Target, CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import posthog from 'posthog-js';
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { useShallow } from 'zustand/react/shallow';
import { StructuralParser, GazeProfiler, LayoutRebalancer } from "@/lib/agent-rez";

interface AISidebarProps {
  user: any;
  setAuthModalOpen: (open: boolean) => void;
  isHistoryActionRef: React.MutableRefObject<boolean>;
}


const STOP_WORDS = new Set(["the", "and", "or", "to", "of", "a", "in", "for", "with", "is", "on", "that", "by", "this", "an", "as", "be"]);

const ATSScoreDisplay = ({ store, jobDescription }: any) => {
  const [matchScore, setMatchScore] = React.useState(0);
  const [saliencyScore, setSaliencyScore] = React.useState(0);
  const [matchedKeywords, setMatchedKeywords] = React.useState<string[]>([]);
  const [missingKeywords, setMissingKeywords] = React.useState<string[]>([]);

  // Debounced calculation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // 1. Calculate Full Text
      const textParts = [
        store.name, store.contactLine, store.summary,
        ...store.experiences.map((e: any) => `${e.title} ${e.meta} ${e.bullets.map((b: any) => b.text).join(' ')}`),
        ...store.educations.map((e: any) => `${e.degree} ${e.bullets.map((b: any) => b.text).join(' ')}`),
        ...store.skills.map((s: any) => `${s.title} ${s.items}`),
        ...store.projects.map((p: any) => `${p.title} ${p.meta} ${p.bullets.map((b: any) => b.text).join(' ')}`),
      ];
      
      const fullText = textParts.join(" ").toLowerCase();

      // 2. Structural Parser Saliency
      // The structural parser gives a score per semantic block. We can average it or take a global score.
      const saliency = StructuralParser.calculateSaliencyScore(fullText);
      setSaliencyScore(saliency);

      // 3. JD Match
      if (!jobDescription || jobDescription.trim() === "") {
        setMatchScore(0);
        setMatchedKeywords([]);
        setMissingKeywords([]);
        return;
      }

      // Very simple extraction
      const jdWords = (jobDescription.toLowerCase().match(/[a-z0-9]{4,}/g) || [])
        .filter((w: string) => !STOP_WORDS.has(w));
      
      // Get unique words ordered by frequency
      const wordCounts: Record<string, number> = {};
      for (const w of jdWords) wordCounts[w] = (wordCounts[w] || 0) + 1;
      
      const sortedKeywords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]).slice(0, 15);
      
      let matched = 0;
      const found: string[] = [];
      const missed: string[] = [];
      
      for (const kw of sortedKeywords) {
        if (fullText.includes(kw)) {
          matched++;
          found.push(kw);
        } else {
          missed.push(kw);
        }
      }

      setMatchedKeywords(found);
      setMissingKeywords(missed);
      setMatchScore(sortedKeywords.length > 0 ? Math.round((matched / sortedKeywords.length) * 100) : 0);

    }, 800); // 800ms debounce
    
    return () => clearTimeout(timer);
  }, [store, jobDescription]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-white border border-[var(--hairline)] flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-black text-emerald-600 mb-1">{matchScore}%</div>
          <div className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Keyword Match</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[var(--hairline)] flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-black text-indigo-600 mb-1">{saliencyScore.toFixed(1)}</div>
          <div className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Saliency Score</div>
        </div>
      </div>
      
      {jobDescription && (
        <div className="bg-white rounded-xl border border-[var(--hairline)] p-4">
          <h4 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-3">Top Keywords (Max 15)</h4>
          <div className="flex flex-wrap gap-2">
            {matchedKeywords.map(k => (
              <span key={k} className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-medium flex items-center gap-1">
                <CheckCircle2 size={10} /> {k}
              </span>
            ))}
            {missingKeywords.map(k => (
              <span key={k} className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-medium flex items-center gap-1">
                <X size={10} /> {k}
              </span>
            ))}
            {matchedKeywords.length === 0 && missingKeywords.length === 0 && (
              <span className="text-xs text-[var(--ink-soft)]">No keywords extracted.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AISidebar({
 user, setAuthModalOpen, isHistoryActionRef }: AISidebarProps) {
  const store = useResumeStore(useShallow(state => ({
    activeSidebarTab: state.activeSidebarTab,
    aiPresetType: state.aiPresetType,
    aiAgentTab: state.aiAgentTab,
    interviewStep: state.interviewStep,
    interviewAnswers: state.interviewAnswers,
    agentMessages: state.agentMessages,
    jobDescription: state.jobDescription,
    experiences: state.experiences,
    design: state.design,
    summary: state.summary,
    contactLine: state.contactLine,
    educations: state.educations,
    projects: state.projects,
    publications: state.publications,
    awards: state.awards,
    skills: state.skills,
    licenses: state.licenses,
    updateDocument: state.updateDocument,
    updateUI: state.updateUI
  })));
  const updateDoc = store.updateDocument;
  const updateUI = store.updateUI;
  
  // Zustand store variables
  const {
    activeSidebarTab, aiPresetType, aiAgentTab, interviewStep, interviewAnswers, agentMessages, jobDescription,
    experiences, design, summary, contactLine, educations, projects, publications, awards, skills, licenses
  } = store;

  const setActiveSidebarTab = (v: any) => updateUI({ activeSidebarTab: typeof v === "function" ? v(useResumeStore.getState().activeSidebarTab) : v });
  const setAiPresetType = (v: any) => updateUI({ aiPresetType: typeof v === "function" ? v(useResumeStore.getState().aiPresetType) : v });
  const setAiAgentTab = (v: any) => updateUI({ aiAgentTab: typeof v === "function" ? v(useResumeStore.getState().aiAgentTab) : v });
  const setJobDescription = (v: any) => updateUI({ jobDescription: typeof v === "function" ? v(useResumeStore.getState().jobDescription) : v });
  const setInterviewStep = (v: any) => updateUI({ interviewStep: typeof v === "function" ? v(useResumeStore.getState().interviewStep) : v });
  const setInterviewAnswers = (v: any) => updateUI({ interviewAnswers: typeof v === "function" ? v(useResumeStore.getState().interviewAnswers) : v });
  const setAgentMessages = (v: any) => updateUI({ agentMessages: typeof v === "function" ? v(useResumeStore.getState().agentMessages) : v });
  const setShowHeatmapOverlay = (v: any) => updateUI({ showHeatmapOverlay: typeof v === "function" ? v(useResumeStore.getState().showHeatmapOverlay) : v });

  const setName = (v: any) => updateDoc({ name: typeof v === "function" ? v(useResumeStore.getState().name) : v });
  const setContactLine = (v: any) => updateDoc({ contactLine: typeof v === "function" ? v(useResumeStore.getState().contactLine) : v });
  const setSummary = (v: any) => updateDoc({ summary: typeof v === "function" ? v(useResumeStore.getState().summary) : v });
  const setExperiences = (v: any) => updateDoc({ experiences: typeof v === "function" ? v(useResumeStore.getState().experiences) : v });
  const setEducations = (v: any) => updateDoc({ educations: typeof v === "function" ? v(useResumeStore.getState().educations) : v });
  const setSkills = (v: any) => updateDoc({ skills: typeof v === "function" ? v(useResumeStore.getState().skills) : v });
  const setLicenses = (v: any) => updateDoc({ licenses: typeof v === "function" ? v(useResumeStore.getState().licenses) : v });
  const setProjects = (v: any) => updateDoc({ projects: typeof v === "function" ? v(useResumeStore.getState().projects) : v });
  const setPublications = (v: any) => updateDoc({ publications: typeof v === "function" ? v(useResumeStore.getState().publications) : v });
  const setAwards = (v: any) => updateDoc({ awards: typeof v === "function" ? v(useResumeStore.getState().awards) : v });

  // Missing local state from ResumeBuilder
  const [aiRemaining, setAiRemaining] = useState<number | null>(5);
  const [showCapacityTip, setShowCapacityTip] = useState(false);

  // --- Groq AI Assistant State & Methods ---
  const [aiInput, setAiInput] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  
  // Custom states for document parser and cover letter generator
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [coverLetterJobDesc, setCoverLetterJobDesc] = useState("");
  const [coverLetterCompany, setCoverLetterCompany] = useState("");
  const [coverLetterRole, setCoverLetterRole] = useState("");
  const [coverLetterOutput, setCoverLetterOutput] = useState("");
  const [coverLetterIsGenerating, setCoverLetterIsGenerating] = useState(false);

  // Agentic Interactive Chat & Interview state
  
  const [agentChatInput, setAgentChatInput] = useState("");
  const [isAgentResponding, setIsAgentResponding] = useState(false);

  const applyParsedResumeToState = (data: any) => {
    isHistoryActionRef.current = true;
    
    if (data.name) setName(data.name);
    
    let constructedContact = data.contactLine;
    if (!constructedContact) {
      const parts = [
        data.location || data.cityState || data.address,
        data.phone,
        data.email,
        data.linkedin,
        data.website || data.portfolio,
      ].filter(Boolean);
      if (parts.length > 0) {
        const pipe = ' <span class="text-[var(--hairline)] mx-2">|</span> ';
        constructedContact = parts.join(pipe);
      }
    }
    if (constructedContact) setContactLine(constructedContact);
    if (data.summary) setSummary(data.summary);
    
    if (data.experiences && Array.isArray(data.experiences)) {
      const sanitizedExps = data.experiences.map((exp: any, i: number) => ({
        id: exp.id || `exp-ai-${i}-${Date.now()}`,
        title: exp.title || "",
        date: exp.date || "",
        bullets: Array.isArray(exp.bullets)
          ? exp.bullets.map((b: any, j: number) => ({
              id: b.id || `b-ai-${i}-${j}-${Date.now()}`,
              text: typeof b === "string" ? b : (b.text || ""),
            }))
          : [],
        meta: exp.meta || "",
      }));
      setExperiences(sanitizedExps);
    }
    
    if (data.educations && Array.isArray(data.educations)) {
      const sanitizedEdus = data.educations.map((edu: any, i: number) => ({
        id: edu.id || `edu-ai-${i}-${Date.now()}`,
        degree: edu.degree || "",
        bullets: Array.isArray(edu.bullets)
          ? edu.bullets.map((b: any, j: number) => ({
              id: b.id || `eb-ai-${i}-${j}-${Date.now()}`,
              text: typeof b === "string" ? b : (b.text || ""),
            }))
          : [],
      }));
      setEducations(sanitizedEdus);
    }
    
    if (data.skills) {
      const skillArray = Array.isArray(data.skills) ? data.skills : [data.skills];
      const sanitizedSkills = skillArray.map((sk: any, i: number) => ({
        id: sk.id || `sk-ai-${i}-${Date.now()}`,
        title: sk.title || "Skills",
        items: sk.items || "",
      }));
      setSkills(sanitizedSkills);
    }
  };

  const handleStartInterview = () => {
    setInterviewStep(0);
    setInterviewAnswers({});
    setAgentMessages([
      {
        role: "assistant",
        content: "🚀 **Let's start your Guided Career Interview!** I'll ask you a series of 5 quick questions to capture everything we need to build your perfect resume.\n\n**Step 1/5:** What is your **Full Name** and **Target Job Title**? (e.g., 'Jane Doe, Senior Product Manager')",
      }
    ]);
    toast.success("Guided Interview started! 🎙️");
  };

  const handleActionVerbBooster = () => {
    isHistoryActionRef.current = true;
    const verbReplacements: Record<string, string> = {
      "worked on": "engineered",
      "did": "executed",
      "helped": "spearheaded",
      "helped with": "collaborated to engineer",
      "built": "architected and deployed",
      "made": "designed and developed",
      "created": "pioneered",
      "managed": "orchestrated",
      "improved": "optimized",
      "added": "integrated",
    };

    let count = 0;
    setExperiences((prev: any[]) =>
      prev.map((exp) => ({
        ...exp,
        bullets: (exp.bullets || []).map((b: any) => {
          let text = b.text || "";
          Object.keys(verbReplacements).forEach((weak) => {
            const regex = new RegExp(`\\b${weak}\\b`, "gi");
            if (regex.test(text)) {
              text = text.replace(regex, verbReplacements[weak]);
              count++;
            }
          });
          return { ...b, text };
        }),
      }))
    );

    const msg = count > 0
      ? `⚡ **ATS Action-Verb Booster Complete!** Successfully upgraded **${count} passive verb(s)** across your work experience into high-impact ATS power verbs!`
      : `⚡ **ATS Action-Verb Booster Complete!** Your experience bullets are already using strong high-impact ATS action verbs!`;

    setAgentMessages((prev: any[]) => [...prev, { role: "assistant", content: msg }]);
    toast.success("ATS Action-Verb Booster applied! 🚀");
  };

  const handleAuditGazeFlow = () => {
    const allText = experiences.map((e: any) => (e.bullets || []).map((b: any) => b.text).join(' ')).join(' ');
    const saliencyScore = StructuralParser.calculateSaliencyScore(allText);
    const gazeDensity = GazeProfiler.calculateGazeDensity(20, 20);
    const layout = LayoutRebalancer.calculateOptimalLayout(allText.length, design.pageSize === "letter" ? 1056 : 1123);

    const report = `📊 **Agent Rez Structural & Readability Audit**:\n
• **ATS Action-Verb Saliency**: **${saliencyScore}/5.0** (High impact verbs & metrics)
• **ATS Saliency Score**: **${(saliencyScore || 0).toFixed(1)}**
• **Recommended Whitespace Density**: **${(layout.calculatedWhitespaceRatio * 100).toFixed(0)}%** (Optimal line height: ${layout.lineHeight})

💡 **Agent Rez Recommendation**:

• Use 1-Click ATS Verb Booster to maximize ATS parsing score!`;

    setAgentMessages((prev: any[]) => [...prev, { role: "assistant", content: report }]);
    setShowHeatmapOverlay(true);
    toast.success("Agent Rez Audit complete! 👁️");
  };

  const handleSendAgentMessage = async (textToSend?: string) => {
    const rawInput = textToSend !== undefined ? textToSend : agentChatInput;
    if (!rawInput.trim()) return;

    const userMsg = { role: "user" as const, content: rawInput };
    const updatedMessages = [...agentMessages, userMsg];
    setAgentMessages(updatedMessages);
    setAgentChatInput("");
    setIsAgentResponding(true);

    try {
      // 1. If in Interview Mode
      if (interviewStep >= 0) {
        const currentAnswers = { ...interviewAnswers };
        currentAnswers[`step${interviewStep}`] = rawInput;
        setInterviewAnswers(currentAnswers);
        
        const nextStepNum = interviewStep + 1;
        setInterviewStep(nextStepNum);

        if (nextStepNum === 1) {
          const assistantMsg = {
            role: "assistant" as const,
            content: "Great! 📬 **Step 2/5:** What are your preferred **contact details**? (e.g., city/state, phone, email, LinkedIn link)"
          };
          setAgentMessages([...updatedMessages, assistantMsg]);
          setIsAgentResponding(false);
          return;
        } else if (nextStepNum === 2) {
          const assistantMsg = {
            role: "assistant" as const,
            content: "Excellent. 💼 **Step 3/5:** Tell me about your **Work Experience**. Mention your recent job titles, company names, dates, and what you achieved or did there. (Feel free to write informal notes or paste bullet points!)"
          };
          setAgentMessages([...updatedMessages, assistantMsg]);
          setIsAgentResponding(false);
          return;
        } else if (nextStepNum === 3) {
          const assistantMsg = {
            role: "assistant" as const,
            content: "Got it. 🎓 **Step 4/5:** What about your **Education & Certifications**? (e.g., B.S. in CS from UC Berkeley, Certifications from AWS/Scrum)"
          };
          setAgentMessages([...updatedMessages, assistantMsg]);
          setIsAgentResponding(false);
          return;
        } else if (nextStepNum === 4) {
          const assistantMsg = {
            role: "assistant" as const,
            content: "Wonderful! 🛠️ **Step 5/5:** What are your **Core Skills & Technologies**? (e.g., React, Node.js, Python, Project Management, Agile)"
          };
          setAgentMessages([...updatedMessages, assistantMsg]);
          setIsAgentResponding(false);
          return;
        } else {
          // Interview completed!
          setInterviewStep(-1);
          
          const generatingMsg = {
            role: "assistant" as const,
            content: "⚙️ **All answers collected!** I am compiling your details and drafting a complete, professional, impact-driven resume in the editor using our high-speed Groq AI model. This will take a few seconds..."
          };
          setAgentMessages([...updatedMessages, generatingMsg]);

          const compilePrompt = `Please compile a complete, highly professional, impact-driven resume based on these career interview answers:
          - Name & Target Role: ${currentAnswers.step0}
          - Contact Details: ${currentAnswers.step1}
          - Work Experience: ${currentAnswers.step2}
          - Education & Certifications: ${currentAnswers.step3}
          - Skills & Competencies: ${rawInput}
          
          Generate the professional experience with high-impact STAR method bullet points. Return the full resume in our specialized JSON format.`;

          const systemPrompt = `You are an elite, world-class resume-writing expert. Based on the user's answers, write an exceptional resume.
          
          You MUST wrap the complete resume JSON inside <UPDATE_RESUME> and </UPDATE_RESUME> XML tags.
          
          The structure MUST EXACTLY be:
          <UPDATE_RESUME>
          {
            "name": "[User's Name]",
            "contactLine": "City, ST | (123) 456-7890 | email@domain.com | linkedin.com/in/username",
            "summary": "Professional summary...",
            "experiences": [
              {
                "title": "Senior Frontend Engineer | Tech Company",
                "date": "Jan 2022 - Present",
                "bullets": [
                  { "text": "Designed and deployed..." },
                  { "text": "Collaborated with..." }
                ],
                "meta": "Stack: React, TypeScript, Tailwind"
              }
            ],
            "educations": [
              {
                "degree": "B.S. in Computer Science | University Name",
                "bullets": [
                  { "text": "GPA 3.8, Honors" }
                ]
              }
            ],
            "skills": [
              {
                "title": "Programming Languages",
                "items": "TypeScript, JavaScript, Python"
              },
              {
                "title": "Frameworks & Databases",
                "items": "React, Next.js, PostgreSQL"
              }
            ]
          }
          </UPDATE_RESUME>
          
          CRITICAL: Do NOT use placeholder names like 'Jane Doe' or placeholder companies. If the user did not provide a specific piece of information, leave it blank or omit it, but NEVER invent fake personal details.
          
          Provide a friendly, conversational message before the XML block congratulating the user on finishing their career interview and explaining how their resume was crafted.`;

          const headers: Record<string, string> = { "Content-Type": "application/json" };
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
          }

          const response = await fetch("/api/groq", {
            method: "POST",
            headers,
            body: JSON.stringify({
              prompt: compilePrompt,
              systemPrompt,
              temperature: 0.3,
              aiAction: "general"
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error((errData as any).error || "Failed to compile resume.");
          }

          // Consume the SSE stream
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let textResponse = "";

          if (reader) {
            let buffer = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6).trim();
                  if (data === "[DONE]") break;
                  try {
                    const parsed = JSON.parse(data);
                    const token = parsed.choices?.[0]?.delta?.content ?? "";
                    textResponse += token;
                  } catch (e: any) {
                    textResponse += `\n[ERROR: ${e.message} | RAW: ${data}]\n`;
                  }
                }
              }
            }
          }
          const updatedHistory = [...updatedMessages, generatingMsg];
          const updateMatch = textResponse.match(/<UPDATE_RESUME>([\s\S]*?)<\/UPDATE_RESUME>/);
          let actionExecuted = undefined;

          if (updateMatch) {
            try {
              const parsed = JSON.parse(updateMatch[1].trim());
              applyParsedResumeToState(parsed);
              actionExecuted = "updated_resume";
              toast.success("Resume compiled and loaded! ✨");
            } catch (err) {
              console.error("Failed to parse compile JSON:", err);
            }
          }

          setAgentMessages([
            ...updatedHistory,
            {
              role: "assistant" as const,
              content: textResponse,
              actionExecuted
            }
          ]);
          setIsAgentResponding(false);
          return;
        }
      }

      // 2. Chat / Refinement Mode (Not in Interview)
      const allText = experiences.map((e: any) => (e.bullets || []).map((b: any) => b.text).join(' ')).join(' ');
      const saliencyScore = StructuralParser.calculateSaliencyScore(allText);
      const gazeDensity = GazeProfiler.calculateGazeDensity(20, 20);
      const layoutInfo = LayoutRebalancer.calculateOptimalLayout(allText.length, design.pageSize === "letter" ? 1056 : 1123);

      const systemPrompt = `You are Agent Rez, an elite AI Career Agent who has direct access to update the user's active resume draft in real-time.
      
      The user's current resume state is:
      ${JSON.stringify({ name, contactLine, summary, experiences, educations, projects, publications, awards, skills, licenses })}
      
      Current Live Cognitive & ATS Audit Metrics:
      - ATS Action-Verb Saliency Score: ${saliencyScore}/5.0
      
      - Recommended Line Height & Whitespace: ${layoutInfo.lineHeight} (${(layoutInfo.calculatedWhitespaceRatio * 100).toFixed(0)}% whitespace ratio)
      
      The user is talking to you or instructing you to make changes.
      You must respond to the user in a friendly, professional, and encouraging tone. When providing advice or feedback, reference these live metrics where relevant.
      
      CRITICAL DIRECTIVE: If the user asks you to edit, change, rewrite, add, or delete anything in their resume, you MUST embed a complete, updated resume JSON block within <UPDATE_RESUME> and </UPDATE_RESUME> XML tags in your response. 
      
      Examples of your responses:
      
      User: "Add Kubernetes to my skills"
      Agent Rez: "I have updated your skills section to include Kubernetes. Here is the updated draft in the editor:
      <UPDATE_RESUME>
      {
        "name": "Alex Morgan",
        "contactLine": "...",
        "summary": "...",
        "experiences": [...],
        "educations": [...],
        "skills": [
          { "id": "sk-1", "title": "Technologies", "items": "React, Node.js, Kubernetes" }
        ]
      }
      </UPDATE_RESUME>"
      
      User: "Rewrite my summary to be more leadership focused"
      Agent Rez: "I've rewritten your summary to highlight your executive leadership and strategic vision. How does this look?
      <UPDATE_RESUME>
      {
        "name": "Alex Morgan",
        "contactLine": "...",
        "summary": "Visionary executive leader with 15+ years driving digital transformation and managing cross-functional teams to deliver scalable enterprise solutions. Proven track record of aligning technology initiatives with core business objectives to accelerate revenue growth.",
        "experiences": [...],
        "educations": [...],
        "projects": [...],
        "publications": [...],
        "awards": [...],
        "licenses": [...],
        "skills": [...]
      }
      </UPDATE_RESUME>"
      
      Make sure the JSON matches the schema exactly:
      - name: string
      - contactLine: string
      - summary: string
      - experiences: [{ id, title, date, bullets: [{ id, text }], meta }]
      - educations: [{ id, degree, bullets: [{ id, text }] }]
      - projects: [{ id, title, date, bullets: [{ id, text }], meta }]
      - publications: [{ id, title, date, bullets: [{ id, text }], meta }]
      - awards: [{ id, title, date, bullets: [{ id, text }], meta }]
      - skills: [{ id, title, items }]
      - licenses: [{ id, text }]
      
      Ensure each object in experiences, educations, projects, publications, awards, and skills has a unique 'id' string (e.g., 'exp-X', 'edu-X', 'proj-X', 'sk-X').
      If the user is just asking a question and no resume changes are needed, do not include the <UPDATE_RESUME> tags. Just reply conversationally.`;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/groq", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: rawInput,
          systemPrompt,
          temperature: 0.4,
          aiAction: "general"
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as any).error || "Failed to generate response.");
      }

      // Consume the SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let textResponse = "";

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                const token = parsed.choices?.[0]?.delta?.content ?? "";
                textResponse += token;
              } catch (e: any) {
                textResponse += `\n[ERROR: ${e.message} | RAW: ${data}]\n`;
              }
            }
          }
        }
      }
      const updateMatch = textResponse.match(/<UPDATE_RESUME>([\s\S]*?)<\/UPDATE_RESUME>/);
      let actionExecuted = undefined;

      if (updateMatch) {
        try {
          const parsed = JSON.parse(updateMatch[1].trim());
          applyParsedResumeToState(parsed);
          actionExecuted = "updated_resume";
          toast.success("Resume updated live! ✨");
        } catch (err) {
          console.error("Failed to parse update JSON:", err);
          toast.error("Failed to apply active edits automatically.");
        }
      }

      setAgentMessages([
        ...updatedMessages,
        {
          role: "assistant" as const,
          content: textResponse,
          actionExecuted
        }
      ]);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
      setAgentMessages([
        ...updatedMessages,
        {
          role: "assistant" as const,
          content: `❌ **Error:** ${err.message || "An error occurred while communicating with Groq."}`
        }
      ]);
    } finally {
      setIsAgentResponding(false);
    }
  };

  const handleApplyAI = () => {
    if (aiPresetType === "summary") {
      setSummary(aiOutput);
      toast.success("Applied to Professional Summary! ✨");
    } else {
      toast("Please use the 'Apply to...' options below to choose which part of your resume to update.");
    }
  };

  const handleApplyToTarget = (targetType: string, targetId?: string) => {
    if (!aiOutput) return;
    
    isHistoryActionRef.current = true;
    
    if (targetType === "summary") {
      setSummary(aiOutput);
      toast.success("Applied to Professional Summary! ✨");
    } else if (targetType === "experience-bullets" && targetId) {
      setExperiences((prev: any[]) => prev.map(exp => {
        if (exp.id === targetId) {
          // Parse lines starting with •, -, *, or normal lines
          const lines = aiOutput.split(/[\n•\-*]/).map(l => l.trim()).filter(Boolean);
          const newBullets = lines.map((text, idx) => ({
            id: `b-ai-${Date.now()}-${idx}`,
            text
          }));
          return {
            ...exp,
            bullets: [...exp.bullets, ...newBullets]
          };
        }
        return exp;
      }));
      toast.success("Appended bullet points to job entry! ✨");
    } else if (targetType === "experience-title" && targetId) {
      setExperiences((prev: any[]) => prev.map(exp => {
        if (exp.id === targetId) {
          return { ...exp, title: aiOutput };
        }
        return exp;
      }));
      toast.success("Updated Job Title & Company! ✨");
    } else if (targetType === "skills-add") {
      setSkills((prev: any[]) => [
        ...prev,
        { id: `sk-ai-${Date.now()}`, title: "AI Recommended Skills", items: aiOutput }
      ]);
      toast.success("Added new Skill Category Group! ✨");
    } else if (targetType === "licenses-add") {
      setLicenses((prev: any[]) => [
        ...prev,
        { id: `lic-ai-${Date.now()}`, text: aiOutput }
      ]);
      toast.success("Added new Certification/License! ✨");
    } else if (targetType === "education-add") {
      setEducations((prev: any[]) => [
        ...prev,
        {
          id: `edu-ai-${Date.now()}`,
          degree: aiOutput,
          bullets: []
        }
      ]);
      toast.success("Added new Education entry! ✨");
    }
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aiInput.trim()) {
      toast.error("Please enter some text or context for the AI.");
      return;
    }

    setAiIsGenerating(true);
    setAiOutput("");

    posthog.capture('ai_feature_used', { preset_type: aiPresetType });

    try {
      // 1. Get optional supabase session to obtain JWT
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 2. Formulate prompts based on active preset
      let systemPrompt = "You are a professional resume writer.";
      if (aiPresetType === "summary") {
        systemPrompt = `You are an elite, professional resume-writing assistant. Refine, improve, or suggest professional phrasing for the user's summary. Make it impact-driven, professional, and clear. Do NOT use generic buzzwords or fluff. Return ONLY the polished summary text. Do not include any introduction, conversational chat, greeting, or outer quotes.

Examples of rewriting:
Input: "I am a software engineer who likes coding and working on teams. I know react and node."
Output: "Results-driven Software Engineer with expertise in full-stack development using React and Node.js. Proven ability to collaborate within cross-functional agile teams to deliver scalable, user-centric web applications while maintaining high code quality."

Input: "marketing person who did ads and got more sales"
Output: "Data-driven Marketing Specialist with a proven track record of designing and executing high-ROI digital advertising campaigns. Adept at leveraging market analytics to drive user acquisition and increase revenue."`;
      } else if (aiPresetType === "bullets") {
        systemPrompt = `You are an elite resume editor. Rewrite the user's raw experience or bullet points into highly professional, action-oriented bullet points using the STAR method (Situation, Task, Action, Result). Use strong, metric-focused active verbs. Start each line with a bullet symbol (•) or a clean list format. Return ONLY the updated bullet points. Do not write introductory or conversational text.

Examples of rewriting:
Input: "helped with the database and made it faster"
Output: 
• Optimized database query performance by 40% through index restructuring, reducing average load times for critical endpoints.

Input: "talked to customers to figure out what they want"
Output:
• Conducted over 50 user discovery interviews to synthesize product requirements, directly influencing the Q3 product roadmap.

Input: "fixed bugs in the app"
Output:
• Resolved 100+ critical software defects, increasing application stability by 25% and significantly improving end-user satisfaction.`;
      } else {
        systemPrompt = "You are an expert resume writer. Help the user with their custom request regarding their resume content. Be concise, impact-oriented, and return ONLY the relevant rewritten resume text or direct suggestions without any conversational chat.";
      }

      // 3. Make fetch request to our server proxy
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Determine aiAction from the current preset type
      const aiActionForMode = aiPresetType === "bullets" ? "rewrite_bullet" as const
        : aiPresetType === "summary" ? "generate_summary" as const
        : aiPresetType === "custom" ? "general" as const
        : "general" as const;

      const response = await fetch("/api/groq", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: aiInput,
          systemPrompt,
          temperature: 0.4,
          aiAction: aiActionForMode
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as any).error || "Failed to generate text from Groq API.");
      }

      // Consume the SSE stream for real-time word-by-word output
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (!reader) throw new Error("No response stream received.");

      setAiOutput(""); // Clear previous output
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        // Parse SSE lines: "data: {...}" or ": meta {...}"
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith(": meta ")) {
            try {
              const meta = JSON.parse(line.slice(7));
              if (meta.remaining !== undefined) setAiRemaining(meta.remaining);
            } catch { /* ignore parse errors */ }
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content ?? "";
              if (token) {
                accumulated += token;
                setAiOutput(accumulated);
              }
            } catch (e: any) {
              accumulated += `\n[ERROR: ${e.message} | RAW: ${data}]\n`;
              setAiOutput(accumulated);
            }
          }
        }
      }

      if (!accumulated.trim()) throw new Error("AI returned an empty response.");
      toast.success("AI suggestion ready! Click 'Apply' to update. ✨");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during AI generation");
    } finally {
      setAiIsGenerating(false);
    }
  };

  const handleParseResume = async (rawText: string) => {
    if (!user) {
      toast.error("Please log in to use AI assistant features.");
      setAuthModalOpen(true);
      return;
    }

    setAiIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Unauthorized");

      const apiUrl = aiPresetType === "linkedin" ? "/api/resume/parse-linkedin" : "/api/resume/parse";

      // For non-LinkedIn builds, include the current resume state so the AI can merge
      let payload: any;
      if (aiPresetType === "linkedin") {
        payload = { input: rawText };
      } else {
        const currentState = useResumeStore.getState();
        payload = {
          rawText,
          existingResume: {
            name: currentState.name,
            contactLine: currentState.contactLine,
            summary: currentState.summary,
            experiences: currentState.experiences,
            educations: currentState.educations,
            skills: currentState.skills,
            licenses: currentState.licenses,
            projects: currentState.projects,
            publications: currentState.publications,
            awards: currentState.awards,
          },
        };
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) throw new Error(resData.error || "Failed to parse");

      const { data } = resData;
      
      // Sanitizer to guarantee unique IDs for pagination engine
      const sanitizeItems = (items: any[], prefix: string) => {
        if (!Array.isArray(items)) return [];
        return items.map((item, idx) => ({
          ...item,
          id: `${prefix}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
          bullets: Array.isArray(item.bullets) ? item.bullets.map((b: any, bIdx: number) => ({
            ...b,
            id: `b-${Date.now()}-${idx}-${bIdx}-${Math.random().toString(36).substr(2, 5)}`
          })) : []
        }));
      };

      if (data.name) setName(data.name);
      if (data.contactLine) setContactLine(data.contactLine);
      if (data.summary) setSummary(data.summary);
      // Defensive: only overwrite array fields if the AI returned a non-empty array,
      // preventing an accidental empty array from clearing real user data.
      if (Array.isArray(data.experiences) && data.experiences.length > 0) setExperiences(sanitizeItems(data.experiences, 'exp'));
      if (Array.isArray(data.educations) && data.educations.length > 0) setEducations(sanitizeItems(data.educations, 'edu'));
      if (Array.isArray(data.projects) && data.projects.length > 0) setProjects(sanitizeItems(data.projects, 'proj'));
      if (Array.isArray(data.publications) && data.publications.length > 0) setPublications(sanitizeItems(data.publications, 'pub'));
      if (Array.isArray(data.awards) && data.awards.length > 0) setAwards(sanitizeItems(data.awards, 'award'));
      if (Array.isArray(data.licenses) && data.licenses.length > 0) {
        const sanitizedLicenses = data.licenses.map((l: any, idx: number) => ({
          ...l,
          id: `lic-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`
        }));
        setLicenses(sanitizedLicenses);
      }
      if (Array.isArray(data.skills) && data.skills.length > 0) {
        const sanitizedSkills = data.skills.map((s: any, idx: number) => ({
          ...s,
          id: `sk-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`
        }));
        setSkills(sanitizedSkills);
      }
      
      toast.success("Resume built and applied! ✨");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setAiIsGenerating(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    if (!user) {
      toast.error("Please log in to upload and parse resume files.");
      setAuthModalOpen(true);
      return;
    }

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = () => {
        setAiInput(reader.result as string);
        toast.success("Text resume loaded! Press 'Build Resume' to generate your draft. 🚀");
      };
      reader.readAsText(file);
      return;
    }

    if (file.type === "application/pdf" || file.name.endsWith(".pdf") || file.name.endsWith(".docx")) {
      const toastId = toast.loading("Uploading and parsing document with Groq... ⚡");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(",")[1];
            const response = await fetch("/api/resume/parse-doc", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                base64Data,
                mimeType: file.type || "application/pdf",
                filename: file.name,
              }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
              throw new Error(result.error || "Failed to parse document.");
            }

            applyParsedResumeToState(result.data);
            setAiPresetType("summary"); // reset
            toast.success("Resume imported and formatted successfully! 🎉", { id: toastId });
          } catch (err: any) {
            toast.error(err.message || "Could not parse document.", { id: toastId });
          }
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        toast.error(err.message || "An error occurred.", { id: toastId });
      }
      return;
    }

    toast.error("Unsupported file type. Please upload a .pdf, .txt, or .docx file.");
  };

  const handleGenerateCoverLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to use AI cover letter generation.");
      setAuthModalOpen(true);
      return;
    }

    setCoverLetterIsGenerating(true);
    posthog.capture('cover_letter_generated', { has_job_description: !!coverLetterJobDesc.trim() });
    const toastId = toast.loading("Generating your tailored cover letter... ✍️");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resumeState = {
        name,
        contactLine,
        summary,
        experiences,
        educations,
        skills,
      };

      const response = await fetch("/api/cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          resumeState,
          jobDescription: coverLetterJobDesc,
          role: coverLetterRole,
          company: coverLetterCompany,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) throw new Error(resData.error || "Failed to generate cover letter.");

      setCoverLetterOutput(resData.text);
      toast.success("Cover letter generated! ✨", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "An error occurred", { id: toastId });
    } finally {
      setCoverLetterIsGenerating(false);
    }
  };

  return (
<div className="flex-1 p-4 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Sparkles size={18} className="animate-pulse" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                    Agent Rez
                  </h2>
                </div>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="text-gray-600 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Rate Limit Status Banner */}
              <div className="bg-blue-50/60 border border-blue-200/50 rounded-xl p-3.5 text-left mb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-800 font-bold text-[10px] uppercase tracking-wider">
                    <Sparkles size={11} className="text-blue-500 shrink-0 animate-pulse" />
                    <span>{user ? "AI Included ⚡" : "Rate Limit Status"}</span>
                  </div>
                  {user && (
                    <span className="text-[9px] bg-blue-100 text-blue-700 font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-blue-200/50">
                      Active
                    </span>
                  )}
                </div>
                
                <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">
                  {user 
                    ? "Request capacity adjusts with demand to keep the service fast for everyone." 
                    : `Daily Limit: ${aiRemaining !== null ? aiRemaining : 5} / 5 requests remaining today.`
                  }
                </p>

                {user ? (
                  <div className="mt-2.5">
                    <button
                      onClick={() => setShowCapacityTip(!showCapacityTip)}
                      className="text-[10px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200/60 rounded-lg px-2.5 py-1.5 cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <span>Get More AI Requests</span>
                    </button>
                    {showCapacityTip && (
                      <div className="mt-2 p-2 bg-white border border-blue-200/60 text-[10px] text-gray-600 rounded-lg leading-relaxed shadow-xs">
                        💡 <b>Maximum speed allocated!</b> Because Agent Rez AI is 100% free with no paywalls or credit cards, request capacity is balanced dynamically in real-time. Your account already receives premium high-speed queue priority!
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="text-[10px] font-bold text-blue-600 hover:underline mt-2 flex items-center gap-0.5 cursor-pointer"
                  >
                    Log In / Sign Up to save drafts & unlock more features 🔑
                  </button>
                )}
              </div>

              {/* Agent Mode Selector Tabs */}
              <div className="flex border border-gray-200 rounded-xl p-1 bg-gray-50/50 shrink-0 mb-3 overflow-x-auto gap-0.5 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setAiAgentTab("agent")}
                  className={cn(
                    "flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap",
                    aiAgentTab === "agent"
                      ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                      : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  <Bot size={13} />
                  <span>AI Agent</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiAgentTab("presets")}
                  className={cn(
                    "flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap",
                    aiAgentTab === "presets"
                      ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                      : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  <Sparkles size={13} />
                  <span>Quick Tools</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiAgentTab("coverletter")}
                  className={cn(
                    "flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap",
                    aiAgentTab === "coverletter"
                      ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                      : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  <FileText size={13} />
                  <span>Cover Letter</span>
                </button>
              </div>

              {/* Full AI Assistant Panel content */}
              <div className="flex-1 flex flex-col min-h-0">
                {aiAgentTab === "agent" ? (
                  <div className="flex-1 flex flex-col min-h-0 h-full">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-3 bg-gray-50/50 rounded-xl p-3 border border-gray-200/60 max-h-[calc(100vh-290px)] min-h-[150px] flex flex-col">
                      {agentMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm",
                            msg.role === "user"
                              ? "bg-blue-600 text-white rounded-tr-none self-end text-left"
                              : "bg-white text-gray-800 border border-gray-200 rounded-tl-none self-start text-left"
                          )}
                        >
                          <div className="whitespace-pre-wrap font-sans">
                            {msg.content.split("\n").map((line, lIdx) => {
                              let rendered = line;
                              
                              if (rendered.includes("<UPDATE_RESUME>")) {
                                rendered = rendered.split("<UPDATE_RESUME>")[0] + "\n*(Resume loaded in editor!)*";
                              }
                              if (rendered.includes("</UPDATE_RESUME>")) {
                                return null;
                              }
                              
                              const isBullet = rendered.startsWith("•") || rendered.startsWith("- ") || rendered.startsWith("* ");
                              
                              const parts = rendered.split(/\*\*(.*?)\*\*/g);
                              const element = parts.map((part, pIdx) => {
                                if (pIdx % 2 === 1) {
                                  return <strong key={pIdx} className="font-bold">{part}</strong>;
                                }
                                return part;
                              });

                              return (
                                <div key={lIdx} className={cn(isBullet ? "pl-2 py-0.5" : "py-0.5")}>
                                  {element}
                                </div>
                              );
                            })}
                          </div>
                          {msg.actionExecuted === "updated_resume" && (
                            <div className="mt-2 pt-1.5 border-t border-gray-100 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckSquare size={11} />
                              <span>Applied changes to resume editor live!</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {isAgentResponding && (
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3 max-w-[85%] self-start flex items-center gap-1.5 text-xs text-gray-500 shadow-sm">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                          <span>Agent Rez is thinking...</span>
                        </div>
                      )}
                    </div>

                    {/* Interactive Interview HUD */}
                    {interviewStep >= 0 ? (
                      <div className="bg-indigo-50 border border-indigo-200/60 rounded-xl p-3 mb-3 shrink-0">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          <span>🎙️ Guided Interview</span>
                          <span>Step {interviewStep + 1} of 5</span>
                        </div>
                        <div className="w-full bg-indigo-200/55 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full transition-all duration-300"
                            style={{ width: `${((interviewStep + 1) / 5) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">
                          Provide your details below to feed the AI resume engine.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setInterviewStep(-1);
                            setAgentMessages((prev: any[]) => [
                              ...prev,
                              { role: "assistant", content: "Interview cancelled. You are now in conversational chat mode! Ask me to edit any parts of your resume or paste career details directly." }
                            ]);
                            toast("Interview cancelled.");
                          }}
                          className="text-[10px] font-bold text-red-600 hover:underline mt-1.5 cursor-pointer block"
                        >
                          Cancel & Switch to General Chat
                        </button>
                      </div>
                    ) : (
                      agentMessages.length <= 1 && (
                        <div className="grid grid-cols-1 gap-2 mb-3 shrink-0">
                          <button
                            type="button"
                            onClick={handleStartInterview}
                            className="p-3 text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-xl transition-all cursor-pointer shadow-sm group"
                          >
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                              <Bot size={15} className="animate-pulse text-indigo-600" />
                              <span>🎙️ Start Guided Career Interview</span>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                              We'll ask you 5 quick questions step-by-step and draft a high-impact professional resume automatically.
                            </p>
                          </button>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={handleActionVerbBooster}
                              className="p-2.5 text-left bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 rounded-xl transition-all cursor-pointer shadow-xs group"
                            >
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                                <Sparkles size={13} className="text-amber-600" />
                                <span>⚡ ATS Verb Booster</span>
                              </div>
                              <p className="text-[9px] text-amber-800/80 mt-0.5 leading-snug">
                                Upgrade passive bullet verbs to ATS impact verbs.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={handleAuditGazeFlow}
                              className="p-2.5 text-left bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/80 rounded-xl transition-all cursor-pointer shadow-xs group"
                            >
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-900">
                                <Eye size={13} className="text-purple-600" />
                                <span>👁️ Structural & ATS Audit</span>
                              </div>
                              <p className="text-[9px] text-purple-800/80 mt-0.5 leading-snug">
                                Audit visual hierarchy & ATS saliency score.
                              </p>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setAgentMessages((prev: any[]) => [
                                ...prev,
                                { role: "user", content: "Paste my old resume to rebuild" },
                                { role: "assistant", content: "Go ahead and paste your old resume text or unstructured prompt right here in the chat, and I'll analyze it, optimize it using modern ATS keywords, and rebuild it in the editor for you!" }
                              ]);
                            }}
                            className="p-3 text-left bg-white border border-gray-200 hover:border-blue-300 rounded-xl transition-all cursor-pointer shadow-sm group"
                          >
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 group-hover:text-blue-700">
                              <FileText size={15} className="text-gray-500 group-hover:text-blue-500" />
                              <span>📝 Paste Old Resume to Rebuild</span>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                              Analyze, rewrite, and format your outdated resume in seconds using Groq.
                            </p>
                          </button>
                        </div>
                      )
                    )}

                    {/* Chat Input Bar */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendAgentMessage();
                      }}
                      className="flex items-center gap-2 mt-auto shrink-0 pt-2 border-t border-gray-100"
                    >
                      <input
                        type="text"
                        value={agentChatInput}
                        onChange={(e) => setAgentChatInput(e.target.value)}
                        disabled={isAgentResponding}
                        placeholder={
                          interviewStep >= 0
                            ? `Step ${interviewStep + 1} answer...`
                            : "Ask Agent Rez to update your resume..."
                        }
                        className="flex-1 p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={isAgentResponding || !agentChatInput.trim()}
                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Send size={14} />
                      </button>
                      {agentMessages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAgentMessages([
                              {
                                role: "assistant",
                                content: "👋 Hello! I am **Agent Rez**, your personal AI Career Agent. I can build or refine your entire resume in real-time.\n\nChoose an option below to get started:",
                              }
                            ]);
                            setInterviewStep(-1);
                            toast.success("Conversation cleared.");
                          }}
                          title="Reset Conversation"
                          className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors cursor-pointer"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                    </form>
                  </div>
                ) : aiAgentTab === "presets" ? (
                  <div className="flex-1 flex flex-col min-h-0 space-y-3">
                    {/* Category select buttons */}
                    <div className="flex border border-gray-200 rounded-xl p-1 bg-gray-50/50 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setAiPresetType("summary");
                          setAiOutput("");
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                          aiPresetType === "summary"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                            : "text-gray-600 hover:text-gray-800"
                        )}
                      >
                        Summary
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiPresetType("bullets");
                          setAiOutput("");
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                          aiPresetType === "bullets"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                            : "text-gray-600 hover:text-gray-800"
                        )}
                      >
                        Bullet Points
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiPresetType("parser");
                          setAiOutput("");
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                          aiPresetType === "parser"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                            : "text-gray-600 hover:text-gray-800"
                        )}
                      >
                        Builder
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiPresetType("custom");
                          setAiOutput("");
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                          aiPresetType === "custom"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                            : "text-gray-600 hover:text-gray-800"
                        )}
                      >
                        Custom
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiPresetType("linkedin");
                          setAiOutput("");
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                          aiPresetType === "linkedin"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                            : "text-gray-600 hover:text-gray-800"
                        )}
                      >
                        LinkedIn
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (aiPresetType === "parser" || aiPresetType === "linkedin") handleParseResume(aiInput);
                        else handleGenerateAI(e);
                      }}
                      className="shrink-0 flex flex-col space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                          {aiPresetType === "summary" && "Polish Professional Summary"}
                          {aiPresetType === "bullets" && "Optimize Experience Bullet Points"}
                          {aiPresetType === "parser" && "Build Resume from Prompt / Text"}
                          {aiPresetType === "custom" && "Custom AI Prompt / Query"}
                          {aiPresetType === "linkedin" && "Import from LinkedIn"}
                        </label>
                        {aiPresetType === "summary" && (
                          <button
                            type="button"
                            onClick={() => {
                              setAiInput(summary);
                              toast.success("Current summary imported! 📥");
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            📥 Load current
                          </button>
                        )}
                      </div>

                      {aiPresetType === "parser" && (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingFile(true);
                          }}
                          onDragLeave={() => setIsDraggingFile(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingFile(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleDocumentUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          className={cn(
                            "border-2 border-dashed rounded-xl p-3.5 text-center transition-all cursor-pointer",
                            isDraggingFile
                              ? "border-blue-500 bg-blue-50/50"
                              : "border-gray-200 hover:border-blue-400 bg-white"
                          )}
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = ".pdf,.docx,.txt";
                            input.onchange = (e) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (files && files[0]) {
                                handleDocumentUpload(files[0]);
                              }
                            };
                            input.click();
                          }}
                        >
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <CloudUpload className={cn("h-6 w-6", isDraggingFile ? "text-blue-600 animate-bounce" : "text-gray-400")} />
                            <div>
                              <p className="text-[11px] font-bold text-gray-700">Import PDF, Word, or Text Resume</p>
                              <p className="text-[9px] text-gray-500 mt-0.5">Drag & drop your file, or click to browse</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <textarea
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        required
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                        placeholder={
                          aiPresetType === "summary"
                            ? "Enter your current summary draft, background, or goals."
                            : aiPresetType === "bullets"
                            ? "Paste experience bullet points to rewrite... (using STAR methodology)"
                            : aiPresetType === "parser"
                            ? "Describe your experience, paste an old resume, or provide unstructured notes..."
                            : aiPresetType === "linkedin"
                            ? "Paste your public LinkedIn Profile URL or LinkedIn Data Export JSON..."
                            : "How can the AI assistant help you today? (e.g. 'Suggest some high-demand technical keywords')"
                        }
                        rows={3}
                      />

                      <button
                        type="submit"
                        disabled={aiIsGenerating || !aiInput.trim()}
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl py-2 text-xs font-bold hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {aiIsGenerating ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{(aiPresetType === "parser" || aiPresetType === "linkedin") ? "Building Resume..." : "Generating suggestions..."}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>{(aiPresetType === "parser" || aiPresetType === "linkedin") ? "Build Resume" : "Generate AI suggestions"}</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* AI Output Result Box with targets list */}
                    <div className="flex-1 flex flex-col min-h-0 bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-hidden">
                      <div className="flex items-center justify-between mb-2 shrink-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                          AI Output Suggestions
                        </span>
                        {aiOutput && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(aiOutput);
                              toast.success("Copied to clipboard! 📋");
                            }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                            title="Copy to Clipboard"
                          >
                            <Copy size={12} />
                            <span>Copy</span>
                          </button>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto text-xs text-gray-800 leading-relaxed font-sans whitespace-pre-wrap select-text pr-1 bg-white border border-gray-100 rounded-lg p-2.5 mb-2.5">
                        {aiIsGenerating ? (
                          <div className="h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        ) : aiOutput ? (
                          aiOutput
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 p-4">
                            <Sparkles size={24} className="opacity-30 mb-2 text-amber-500" />
                            <p className="text-[11px]">Your professional suggestions will appear here.</p>
                          </div>
                        )}
                      </div>

                      {aiOutput && (
                        <div className="shrink-0 border-t border-gray-200 pt-2.5 space-y-2">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-600">
                            ⚡ Quick Apply to Resume Sections:
                          </span>
                          <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                            <button
                              onClick={() => handleApplyToTarget("summary")}
                              className="w-full text-left p-1.5 text-[11px] bg-blue-50 border border-blue-200 hover:border-blue-300 hover:bg-blue-100 text-blue-900 font-bold rounded transition-all cursor-pointer"
                            >
                              ✨ Apply to Professional Summary
                            </button>
                            
                            {experiences.length > 0 && (
                              <div className="space-y-1">
                                <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-600 pl-1 mt-1">
                                  Append Bullets to Professional Job:
                                </span>
                                {experiences.map((exp) => (
                                  <button
                                    key={exp.id}
                                    onClick={() => handleApplyToTarget("experience-bullets", exp.id)}
                                    className="w-full text-left p-1.5 text-[11px] bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 font-semibold rounded transition-all truncate block cursor-pointer"
                                    title={`Append as bullet points to ${exp.title}`}
                                  >
                                    + Append to: {exp.title.split("|")[0].trim()}
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-gray-100">
                              <button
                                onClick={() => handleApplyToTarget("skills-add")}
                                className="text-left p-1.5 text-[9px] bg-gray-100 border border-gray-200 hover:border-gray-300 hover:bg-gray-200 text-gray-700 font-semibold rounded transition-all truncate cursor-pointer"
                              >
                                + Add as Skills Group
                              </button>
                              <button
                                onClick={() => handleApplyToTarget("licenses-add")}
                                className="text-left p-1.5 text-[9px] bg-gray-100 border border-gray-200 hover:border-gray-300 hover:bg-gray-200 text-gray-700 font-semibold rounded transition-all truncate cursor-pointer"
                              >
                                + Add to Certifications
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Cover Letter Panel
                  <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-y-auto pr-1">
                    <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 text-left shrink-0">
                      <h3 className="text-xs font-bold text-amber-800 flex items-center gap-1">
                        <Sparkles size={13} className="animate-pulse" />
                        AI Cover Letter Generator
                      </h3>
                      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                        Instantly write a personalized, 100% tailored cover letter using the exact achievements, technical skills, and background loaded in your active resume.
                      </p>
                    </div>

                    <form onSubmit={handleGenerateCoverLetter} className="space-y-3 shrink-0">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Target Role / Title
                        </label>
                        <input
                          type="text"
                          required
                          value={coverLetterRole}
                          onChange={(e) => setCoverLetterRole(e.target.value)}
                          placeholder="e.g. Senior Frontend Engineer"
                          className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          required
                          value={coverLetterCompany}
                          onChange={(e) => setCoverLetterCompany(e.target.value)}
                          placeholder="e.g. Vercel"
                          className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Job Description / Target Keywords (Optional)
                        </label>
                        <textarea
                          value={coverLetterJobDesc}
                          onChange={(e) => setCoverLetterJobDesc(e.target.value)}
                          placeholder="Paste details of the role here to auto-align target keywords..."
                          className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white resize-none"
                          rows={3}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={coverLetterIsGenerating}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg py-2 text-xs font-bold hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {coverLetterIsGenerating ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Writing cover letter...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            <span>Generate Cover Letter</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Result Card */}
                    <div className="flex-1 flex flex-col min-h-[160px] bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-hidden">
                      <div className="flex items-center justify-between mb-2 shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                          Tailored Letter Draft
                        </span>
                        {coverLetterOutput && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(coverLetterOutput);
                                toast.success("Copied cover letter to clipboard! 📋");
                              }}
                              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                              title="Copy to Clipboard"
                            >
                              <Copy size={11} />
                              <span>Copy</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const element = document.createElement("a");
                                const file = new Blob([coverLetterOutput], { type: "text/plain" });
                                element.href = URL.createObjectURL(file);
                                element.download = `Cover_Letter_${coverLetterCompany.replace(/\s+/g, "_")}.txt`;
                                document.body.appendChild(element);
                                element.click();
                                toast.success("Cover letter downloaded! 📥");
                              }}
                              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                              title="Download Cover Letter"
                            >
                              <Download size={11} />
                              <span>Download</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto text-[11px] text-gray-800 leading-relaxed font-mono whitespace-pre-wrap select-text pr-1 bg-white border border-gray-100 rounded-lg p-2.5">
                        {coverLetterIsGenerating ? (
                          <div className="h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          </div>
                        ) : coverLetterOutput ? (
                          coverLetterOutput
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
                            <FileText size={22} className="opacity-40 mb-1.5" />
                            <p className="text-[10px]">Your matching cover letter will be generated here.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
  );
}

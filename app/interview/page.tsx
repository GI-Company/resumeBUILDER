'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, ChevronRight, CheckSquare, X } from 'lucide-react';
import { useResumeStore } from '@/lib/store/useResumeStore';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function InterviewPage() {
  const router = useRouter();

  const [agentMessages, setAgentMessages] = useState<any[]>([]);
  const [interviewStep, setInterviewStep] = useState(0);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [agentChatInput, setAgentChatInput] = useState("");
  const [isAgentResponding, setIsAgentResponding] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages, isAgentResponding]);

  useEffect(() => {
    const userName = useResumeStore.getState().name || 'there';
    const initialQuestion = `Hi ${userName}! I'm Agent Rez, your personal career strategist. Let's build your resume step-by-step. What's the exact title of the role you're targeting?`;
    setAgentMessages([
      { role: "assistant", content: initialQuestion }
    ]);
  }, []);

  const handleSendAgentMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!agentChatInput.trim() || isAgentResponding) return;

    const rawInput = agentChatInput;
    const userMsg = { role: "user" as const, content: rawInput };
    const updatedMessages = [...agentMessages, userMsg];
    setAgentMessages(updatedMessages);
    setAgentChatInput("");
    setIsAgentResponding(true);

    try {
      const currentAnswers = { ...interviewAnswers };
      currentAnswers[`step${interviewStep}`] = rawInput;
      setInterviewAnswers(currentAnswers);
      
      const nextStepNum = interviewStep + 1;
      setInterviewStep(nextStepNum);

      if (nextStepNum === 1) {
        setAgentMessages([...updatedMessages, {
          role: "assistant",
          content: "Great! 📬 **Step 2/5:** What are your preferred **contact details**? (e.g., city/state, phone, email, LinkedIn link)"
        }]);
        setIsAgentResponding(false);
        return;
      } else if (nextStepNum === 2) {
        setAgentMessages([...updatedMessages, {
          role: "assistant",
          content: "Excellent. 💼 **Step 3/5:** Tell me about your **Work Experience**. Mention your recent job titles, company names, dates, and what you achieved or did there. (Feel free to write informal notes or paste bullet points!)"
        }]);
        setIsAgentResponding(false);
        return;
      } else if (nextStepNum === 3) {
        setAgentMessages([...updatedMessages, {
          role: "assistant",
          content: "Got it. 🎓 **Step 4/5:** What about your **Education & Certifications**? (e.g., B.S. in CS from UC Berkeley, Certifications from AWS/Scrum)"
        }]);
        setIsAgentResponding(false);
        return;
      } else if (nextStepNum === 4) {
        setAgentMessages([...updatedMessages, {
          role: "assistant",
          content: "Wonderful! 🛠️ **Step 5/5:** What are your **Core Skills & Technologies**? (e.g., React, Node.js, Python, Project Management, Agile)"
        }]);
        setIsAgentResponding(false);
        return;
      } else {
        // Interview completed!
        setInterviewStep(-1);
        const generatingMsg = {
          role: "assistant",
          content: "⚙️ **All answers collected!** I am compiling your details and drafting a complete, professional, impact-driven resume. This will take a few seconds..."
        };
        setAgentMessages([...updatedMessages, generatingMsg]);

        const userName = useResumeStore.getState().name || 'Candidate';
        const compilePrompt = `Please compile a complete, highly professional, impact-driven resume based on these career interview answers. Tailor the content, skills, and bullet points specifically for the target role:
        - User's Name: ${userName}
        - Target Role / Target Job Title: ${currentAnswers.step0}
        - Contact Details: ${currentAnswers.step1}
        - Work Experience: ${currentAnswers.step2}
        - Education & Certifications: ${currentAnswers.step3}
        - Skills & Competencies: ${rawInput}
        
        Generate the professional experience with high-impact STAR method bullet points tailored to the target role. Return the full resume in our specialized JSON format.`;

        const systemPrompt = `You are an elite, world-class resume-writing expert. Based on the user's answers, write an exceptional resume.
        
        You MUST wrap the complete resume JSON inside <UPDATE_RESUME> and </UPDATE_RESUME> XML tags.
        
        The structure MUST EXACTLY MATCH the following keys. Do NOT invent new keys (e.g. do NOT use 'jobTitle' or 'company', use ONLY the keys shown below):
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
        CRITICAL: You MUST use the exact JSON keys shown above: "title", "date", "bullets", "text", "meta", "degree", "items". If you use different keys, the resume will break and render empty!
        
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
            aiAction: "guided_interview"
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error || "Failed to compile resume.");
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
            
            // Replicate applyParsedResumeToState logic
            const storeState = useResumeStore.getState();
            let newContactLine = parsed.contactLine;
            if (!newContactLine) {
              const parts = [
                parsed.location || parsed.cityState || parsed.address,
                parsed.phone,
                parsed.email,
                parsed.linkedin,
                parsed.website || parsed.portfolio,
              ].filter(Boolean);
              if (parts.length > 0) {
                newContactLine = parts.join(' | ');
              }
            }

            useResumeStore.setState({
              name: parsed.name || storeState.name,
              contactLine: newContactLine || storeState.contactLine,
              summary: parsed.summary || storeState.summary,
              experiences: parsed.experiences?.length > 0 ? parsed.experiences.map((exp: any, i: number) => {
                const rawBullets = exp.bullets || exp.responsibilities || exp.achievements || [];
                return {
                  id: exp.id || `exp-ai-${i}-${Date.now()}`,
                  title: exp.title || exp.jobTitle || exp.role || exp.company || "",
                  date: exp.date || exp.duration || exp.timeframe || "",
                  bullets: Array.isArray(rawBullets) ? rawBullets.map((b: any, j: number) => ({
                    id: b.id || `b-ai-${i}-${j}-${Date.now()}`,
                    text: typeof b === "string" ? b : (b.text || b.description || b.content || ""),
                  })) : [],
                  meta: exp.meta || exp.location || "",
                };
              }) : storeState.experiences,
              educations: parsed.educations?.length > 0 ? parsed.educations.map((edu: any, i: number) => {
                const rawBullets = edu.bullets || edu.details || [];
                return {
                  id: edu.id || `edu-ai-${i}-${Date.now()}`,
                  degree: edu.degree || edu.school || edu.institution || "",
                  bullets: Array.isArray(rawBullets) ? rawBullets.map((b: any, j: number) => ({
                    id: b.id || `eb-ai-${i}-${j}-${Date.now()}`,
                    text: typeof b === "string" ? b : (b.text || b.description || ""),
                  })) : [],
                };
              }) : storeState.educations,
              skills: parsed.skills?.length > 0 ? parsed.skills.map((s: any, i: number) => ({
                id: s.id || `sk-ai-${i}-${Date.now()}`,
                title: s.title || s.name || s.category || "",
                items: Array.isArray(s.items) ? s.items.join(", ") : (s.items || s.details || s.skills || ""),
              })) : storeState.skills,
            });

            actionExecuted = "updated_resume";
            setIsFinished(true);
            toast.success("Resume compiled and ready! ✨");
          } catch (err) {
            console.error("Failed to parse compile JSON:", err);
          }
        }

        setAgentMessages([
          ...updatedHistory,
          {
            role: "assistant",
            content: textResponse,
            actionExecuted
          }
        ]);
        setIsAgentResponding(false);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to process message");
      setIsAgentResponding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-sm">
              <Bot size={20} />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Agent Rez <span className="text-blue-600 font-semibold text-xs bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">AI</span>
            </span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            <X size={16} /> Exit
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl px-6 py-8 flex flex-col min-h-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Guided Career Interview</h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Answer 5 quick questions and our AI will build a professional, high-impact resume tailored to your career goals.
          </p>
        </div>

        {/* Progress Bar */}
        {interviewStep >= 0 && interviewStep < 5 && (
          <div className="w-full bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-700">
              <span>🎙️ Progress</span>
              <span>Step {interviewStep + 1} of 5</span>
            </div>
            <div className="w-full bg-indigo-200/55 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${((interviewStep + 1) / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Chat Window */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[400px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {agentMessages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm",
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none self-end text-left ml-auto"
                    : "bg-gray-50 border border-gray-100 rounded-tl-none self-start text-gray-800"
                )}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content.split("\n").map((line: string, lIdx: number) => {
                    let rendered = line;
                    if (rendered.includes("<UPDATE_RESUME>")) rendered = rendered.split("<UPDATE_RESUME>")[0] + "\n*(Resume loaded in editor!)*";
                    if (rendered.includes("</UPDATE_RESUME>")) return null;
                    const isBullet = rendered.startsWith("•") || rendered.startsWith("- ") || rendered.startsWith("* ");
                    
                    const parts = rendered.split(/\*\*(.*?)\*\*/g);
                    const element = parts.map((part, pIdx) => (pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold">{part}</strong> : part));
                    return <div key={lIdx} className={cn(isBullet ? "pl-4 py-1" : "py-1")}>{element}</div>;
                  })}
                </div>
                {msg.actionExecuted === "updated_resume" && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                    <CheckSquare size={16} />
                    <span>Applied changes to resume editor!</span>
                  </div>
                )}
              </div>
            ))}
            {isAgentResponding && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none p-4 max-w-[85%] self-start flex items-center gap-2 text-sm text-gray-500 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>Agent Rez is compiling...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Action Area */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            {isFinished ? (
              <div className="flex flex-col items-center justify-center p-4">
                <p className="text-gray-900 font-bold mb-4 text-center">Your resume is ready for review!</p>
                <button
                  onClick={() => router.push('/editor?id=new')}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer text-lg"
                >
                  Load into Editor <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendAgentMessage} className="relative">
                <textarea
                  className="w-full resize-none rounded-xl border border-gray-200 p-4 pr-24 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={3}
                  placeholder="Type your answer here..."
                  value={agentChatInput}
                  onChange={(e) => setAgentChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAgentMessage();
                    }
                  }}
                  disabled={isAgentResponding}
                />
                
                {/* Sample Fill Button */}
                {!agentChatInput && !isAgentResponding && (
                  <button
                    type="button"
                    onClick={() => {
                      const SAMPLE_ANSWERS = [
                        "Senior Full Stack Software Engineer",
                        "San Francisco, CA | (415) 555-0198 | dev@example.com | linkedin.com/in/sampledev",
                        "Tech Lead at Acme Corp (2020-Present): Led a team of 5 engineers to rebuild the core React dashboard, reducing load times by 40%. Previously Frontend Developer at Globex (2018-2020): Built standard UI components and integrated REST APIs.",
                        "B.S. Computer Science from University of California, Berkeley (2018). AWS Certified Solutions Architect (2021).",
                        "React, Next.js, Node.js, TypeScript, PostgreSQL, AWS, Docker, Agile/Scrum"
                      ];
                      setAgentChatInput(SAMPLE_ANSWERS[interviewStep] || "Sample answer");
                    }}
                    className="absolute bottom-4 left-4 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    ✨ Fill Sample Answer
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!agentChatInput.trim() || isAgentResponding}
                  className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all"
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

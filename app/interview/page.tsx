'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, ChevronRight, CheckSquare, X } from 'lucide-react';
import { useResumeStore } from "@/lib/store/useResumeStore";
import { applyAiResumeUpdate } from "@/lib/applyAiResumeUpdate";
import { checkResumeCompleteness } from "@/lib/agent-rez";
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

/** Streams one Groq completion and extracts the <UPDATE_RESUME> JSON payload, if any. */
async function requestResumeCompletion(
  prompt: string,
  systemPrompt: string,
  headers: Record<string, string>
): Promise<{ textResponse: string; parsed: any | null }> {
  const response = await fetch("/api/groq", {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt, systemPrompt, temperature: 0.3, aiAction: "guided_interview" }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error || "Failed to compile resume.");
  }

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
  let parsed: any = null;
  if (updateMatch) {
    try {
      let jsonString = updateMatch[1].trim();
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }
      parsed = JSON.parse(jsonString);
    } catch (err) {
      console.error("Failed to parse compile JSON:", err);
    }
  }

  return { textResponse, parsed };
}

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
    const initialQuestion = `Hi there! I'm Agent Rez, your personal career strategist. Let's build your resume step-by-step. What's your full name?`;
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
          content: "Great to meet you! 🎯 **Step 2/6:** What's the exact title of the role you're targeting?"
        }]);
        setIsAgentResponding(false);
        return;
      } else if (nextStepNum === 2) {
        setAgentMessages([...updatedMessages, {
          role: "assistant",
          content: "Got it. 📬 **Step 3/6:** What are your preferred **contact details**? (e.g., city/state, phone, email, LinkedIn link)"
        }]);
        setIsAgentResponding(false);
        return;
      } else if (nextStepNum === 3) {
        setAgentMessages([...updatedMessages, {
          role: "assistant",
          content: "Excellent. 💼 **Step 4/6:** Tell me about your **Work Experience**. Mention your recent job titles, company names, dates, and what you achieved or did there. (Feel free to write informal notes or paste bullet points!)"
        }]);
        setIsAgentResponding(false);
        return;
      } else if (nextStepNum === 4) {
        setAgentMessages([...updatedMessages, {
          role: "assistant",
          content: "Got it. 🎓 **Step 5/6:** What about your **Education & Certifications**? (e.g., B.S. in CS from UC Berkeley, Certifications from AWS/Scrum)"
        }]);
        setIsAgentResponding(false);
        return;
      } else if (nextStepNum === 5) {
        setAgentMessages([...updatedMessages, {
          role: "assistant",
          content: "Wonderful! 🛠️ **Step 6/6:** What are your **Core Skills & Technologies**? (e.g., React, Node.js, Python, Project Management, Agile)"
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

        const userName = currentAnswers.step0 || 'Candidate';
        const compilePrompt = `Please compile a complete, highly professional, impact-driven resume based on these career interview answers. Tailor the content, skills, and bullet points specifically for the target role:
        - name: ${userName}
        - contactLine: ${currentAnswers.step2}
        - summary: (Draft a professional summary for a ${currentAnswers.step1})
        - experiences: ${currentAnswers.step3}
        - educations: ${currentAnswers.step4}
        - skills: ${rawInput}
        
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
        CRITICAL: Education entries (degrees, GPA, university names) must ONLY go in the 'educations' array, NEVER in 'experiences' — even if the user described their education in the same message as their work history. If an item mentions a degree or university, it belongs in educations, period.
        
        Provide a friendly, conversational message before the XML block congratulating the user on finishing their career interview and explaining how their resume was crafted.`;

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        let { textResponse, parsed } = await requestResumeCompletion(compilePrompt, systemPrompt, headers);
        let completeness = parsed ? checkResumeCompleteness(parsed) : { complete: false, missingSections: ['experiences', 'educations', 'skills', 'summary'] };

        // Verification gate: if the AI dropped whole sections (the "header only"
        // failure mode), retry once with an explicit correction prompt instead of
        // silently committing a broken resume. Capped at 1 retry to bound latency/cost.
        if (parsed && !completeness.complete) {
          console.warn('[Interview] AI response missing sections, retrying:', completeness.missingSections);
          const retryPrompt = `${compilePrompt}\n\nYour previous response was missing these required sections: ${completeness.missingSections.join(', ')}. Regenerate the COMPLETE resume JSON with every section filled in from the interview answers above — do not omit any of them.`;
          const retryResult = await requestResumeCompletion(retryPrompt, systemPrompt, headers);
          if (retryResult.parsed) {
            const retryCompleteness = checkResumeCompleteness(retryResult.parsed);
            // Use the retry if it's more complete than the original attempt.
            if (retryCompleteness.missingSections.length < completeness.missingSections.length) {
              textResponse = retryResult.textResponse;
              parsed = retryResult.parsed;
              completeness = retryCompleteness;
            }
          }
        }

        const updatedHistory = [...updatedMessages, generatingMsg];
        let actionExecuted = undefined;

        if (parsed) {
          applyAiResumeUpdate(parsed);
          actionExecuted = "updated_resume";
          setIsFinished(true);

          if (!completeness.complete) {
            toast.error(`Resume compiled, but still missing: ${completeness.missingSections.join(', ')}. You may need to add it manually.`);
          } else {
            toast.success("Resume compiled and ready! ✨");
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
        {interviewStep >= 0 && interviewStep < 6 && (
          <div className="w-full bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-700">
              <span>🎙️ Progress</span>
              <span>Step {interviewStep + 1} of 6</span>
            </div>
            <div className="w-full bg-indigo-200/55 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${((interviewStep + 1) / 6) * 100}%` }}
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
                  {(() => {
                    let displayContent = msg.content;
                    if (displayContent.includes("<UPDATE_RESUME>")) {
                      displayContent = displayContent.replace(/<UPDATE_RESUME>[\s\S]*?(<\/UPDATE_RESUME>|$)/, "\n*(Resume loaded in editor!)*");
                    }
                    return displayContent.split("\n").map((line: string, lIdx: number) => {
                      const isBullet = line.startsWith("•") || line.startsWith("- ") || line.startsWith("* ");
                      const parts = line.split(/\*\*(.*?)\*\*/g);
                      const element = parts.map((part, pIdx) => (pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold">{part}</strong> : part));
                      return <div key={lIdx} className={cn(isBullet ? "pl-4 py-1" : "py-1")}>{element}</div>;
                    });
                  })()}
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
                        "Alex Morgan",
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

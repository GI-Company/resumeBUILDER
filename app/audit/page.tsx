'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StructuralParser, LayoutRebalancer } from '@/lib/agent-rez';
import { boostVerbs } from '@/lib/agent-rez/verb-booster';
import { useResumeStore } from '@/lib/store/useResumeStore';
import { toast } from 'react-hot-toast';
import { Bot, ChevronRight, FileText, CheckCircle2, Zap } from 'lucide-react';

export default function AuditPage() {
  const [text, setText] = useState('');
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAudit = () => {
    if (!text.trim()) {
      toast.error('Please paste your resume text first.');
      return;
    }
    const saliencyScore = StructuralParser.calculateSaliencyScore(text);
    const layout = LayoutRebalancer.calculateOptimalLayout(text.length, 1056); // Letter size
    const verbStats = boostVerbs(text);

    setReport({
      saliencyScore: (saliencyScore || 0).toFixed(1),
      whitespaceDensity: (layout.calculatedWhitespaceRatio * 100).toFixed(0),
      verbsReplaced: verbStats.replacements,
    });
    toast.success('Audit complete! 🚀');
  };

  const handleLoadIntoEditor = async () => {
    setIsLoading(true);
    toast.loading('Parsing resume into editor...', { id: 'parsing' });
    try {
      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text }),
      });
      const data = await res.json();
      if (data.success === false) {
        throw new Error(data.error || 'Failed to parse resume');
      }
      
      const parsedData = data.data || data; // handle shape depending on route response
      
      // Update store with parsed data
      useResumeStore.setState((state) => ({
        ...state,
        ...parsedData, // Merge the parsed fields (name, experiences, etc.)
      }));

      toast.success('Loaded successfully!', { id: 'parsing' });
      router.push('/editor?id=new');
    } catch (e: any) {
      toast.error(e.message || 'Error parsing resume', { id: 'parsing' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8">
        
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-2">
            <Bot size={32} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Instant ATS & Readability Audit</h1>
          <p className="text-gray-600">
            Paste your raw resume text below for a free, instant structural analysis. No account required, zero AI costs.
          </p>
        </div>

        <div className="bg-white p-4 shadow-sm rounded-xl border border-gray-200">
          <textarea
            className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800 resize-y"
            placeholder="Paste your resume text here (experience, skills, summary)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAudit}
              disabled={!text.trim()}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              <FileText size={18} />
              Run Free Audit
            </button>
          </div>
        </div>

        {report && (
          <div className="bg-white p-6 shadow-sm rounded-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-green-500" /> Audit Results
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                <div className="text-2xl font-black text-gray-900">{report.saliencyScore} <span className="text-sm text-gray-500 font-medium">/ 5.0</span></div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-1">ATS Saliency</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                <div className="text-2xl font-black text-gray-900">{report.whitespaceDensity}%</div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-1">Whitespace Density</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                <div className="text-2xl font-black text-blue-600">+{report.verbsReplaced}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-1">Verbs Upgraded</div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-4">
              <Zap className="text-blue-500 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900">Ready to apply these fixes?</h3>
                <p className="text-sm text-blue-800 mt-1 mb-3">
                  Our Agent Rez editor can instantly apply ATS verb upgrades and format your text perfectly into a professional layout.
                </p>
                <button
                  onClick={handleLoadIntoEditor}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 text-sm"
                >
                  {isLoading ? 'Parsing...' : 'Load into Editor to Fix'} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

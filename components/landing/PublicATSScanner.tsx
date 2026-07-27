'use client';

import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ScanResult {
  score: number;
  flaws: string[];
}

export function PublicATSScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a valid PDF resume.');
      }
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobDescription.trim()) {
      setError('Please provide both a resume PDF and a job description.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);

      const response = await fetch('/api/scanner', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan resume');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCtaClick = () => {
    router.push('/signup');
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Free Instant ATS Compatibility Scanner
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Test how well your resume matches any job description instantly. See your score and major gaps before recruiters do.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-10 shadow-2xl">
        {/* Input Form */}
        <form onSubmit={handleScan} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload Resume (PDF)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-2xl cursor-pointer bg-background/50 hover:bg-background/80 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  {file ? (
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> {file.name}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PDF (MAX. 10MB)</p>
                    </>
                  )}
                </div>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="jobDescription" className="block text-sm font-medium text-foreground mb-2">
              Paste Target Job Description
            </label>
            <textarea
              id="jobDescription"
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full rounded-2xl border border-border bg-background/50 p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Resume & Keywords...
              </>
            ) : (
              <>
                Scan ATS Score Now
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Results Section */}
        <div className="bg-background/40 border border-border/50 rounded-2xl p-6 sm:p-8 flex flex-col justify-between h-full min-h-[420px]">
          {result ? (
            <div className="space-y-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">ATS Scan Results</h3>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <span className="text-2xl font-extrabold text-primary">{result.score}/100</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Identified Gaps & Flaws
                  </h4>
                  <div className="space-y-3">
                    {result.flaws.map((flaw, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50 text-sm text-foreground">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{flaw}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50 mt-6">
                <button
                  onClick={handleCtaClick}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-semibold shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Sign up free to let AgentRez automatically fix these gaps
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Scan Performed Yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Upload your resume PDF and paste a job description on the left to see your instant ATS breakdown.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

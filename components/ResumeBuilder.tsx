'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { GripVertical, X, Bold, Italic, Underline, Minus, Plus, Eraser, Printer, Save, HelpCircle, Palette, FileText, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

// --- Utility Functions ---
function shadeColor(hex: string, percent: number) {
  const f = parseInt(hex.slice(1), 16), t = percent < 0 ? 0 : 255, p = Math.abs(percent);
  const R = f >> 16, G = (f >> 8) & 0x00FF, B = f & 0x0000FF;
  const nR = Math.round((t - R) * p / 100) + R, nG = Math.round((t - G) * p / 100) + G, nB = Math.round((t - B) * p / 100) + B;
  return "#" + (0x1000000 + nR * 0x10000 + nG * 0x100 + nB).toString(16).slice(1);
}

const TEMPLATES = [
  { id: 'classic', name: 'Classic Script', desc: 'Warm handwritten headings over a soft neutral panel. A safe, personable all-rounder.', layout: 'classic', heading: "'Kalam',cursive", body: "'Lora',serif", accent: '#3a353a', panel: '#f4f3f3', radius: 10, headingStyle: 'bar', italic: true },
  { id: 'modern', name: 'Modern Sans', desc: 'Clean geometric sans with an underline rule. Good for tech and product roles.', layout: 'classic', heading: "'Poppins',sans-serif", body: "'Inter',sans-serif", accent: '#2f5d62', panel: '#eef3f2', radius: 6, headingStyle: 'underline', italic: false },
  { id: 'traditional', name: 'Traditional Serif', desc: 'Editorial serif pairing with plain headings. Reads formal and established.', layout: 'classic', heading: "'Playfair Display',serif", body: "'Source Serif 4',serif", accent: '#4a3324', panel: '#f6f1ea', radius: 2, headingStyle: 'plain', italic: true },
  { id: 'minimal', name: 'Minimal ATS-Safe', desc: 'No color, no boxes, small caps headings. Built to parse cleanly in applicant tracking systems.', layout: 'classic', heading: "Georgia,serif", body: "Georgia,serif", accent: '#000000', panel: '#ffffff', radius: 0, headingStyle: 'smallcaps', italic: false },
  { id: 'sidebar-executive', name: 'Sidebar Executive', desc: 'Two-column layout: certifications, skills, and education in a side rail; summary and experience take the lead column.', layout: 'sidebar', heading: "'Playfair Display',serif", body: "'Source Serif 4',serif", accent: '#2c3e50', panel: '#eef1f4', radius: 4, headingStyle: 'plain', italic: false },
  { id: 'sidebar-fresh', name: 'Sidebar Fresh', desc: 'Two-column layout with a teal accent and rounded panels. Approachable and modern.', layout: 'sidebar', heading: "'Poppins',sans-serif", body: "'Nunito Sans',sans-serif", accent: '#0f766e', panel: '#eafaf7', radius: 12, headingStyle: 'bar', italic: false }
];

const TUTORIAL_STEPS = [
  { eyebrow: 'Step 1 of 5', title: 'Welcome to Resume Builder', body: "This whole page is your resume. There's no separate form — click directly on any text (like your name, up top) and start typing." },
  { eyebrow: 'Step 2 of 5', title: 'Change the look anytime', body: 'Open <b>🎨 Design</b> in the toolbar to swap templates, fonts, colors, spacing, or switch between a single-column and sidebar layout.' },
  { eyebrow: 'Step 3 of 5', title: 'Drag to reorder', body: 'Grab the ⠿ handle on any section, job, bullet, or skill category to drag it into a new position.' },
  { eyebrow: 'Step 4 of 5', title: 'Add and remove freely', body: 'Use the small <b>+</b> buttons to add sections, jobs, certifications, or bullets. Hover an item to reveal its <b>✕ remove</b> option.' },
  { eyebrow: 'Step 5 of 5', title: "You're ready", body: 'When it looks right, use <b>⬇ Export / Save as PDF</b> to print or save a PDF, or <b>💾 Save editable copy</b> to download an HTML file you can reopen and keep editing later.' }
];

// --- Subcomponents ---
const DragHandle = ({ dragControls }: { dragControls: any }) => (
  <span
    className="drag-handle inline-flex items-center justify-center w-5 h-5 rounded-md cursor-grab text-[var(--ink-soft)] text-sm bg-black/5 hover:bg-black/10 hover:text-[var(--ink)] active:cursor-grabbing font-sans shrink-0 select-none no-print"
    onPointerDown={(e) => dragControls.start(e)}
    title="Drag to reorder"
  >
    <GripVertical size={14} />
  </span>
);

const SaveResponseSchema = z.object({
  success: z.boolean(),
  code: z.string(),
  message: z.string().optional(),
  id: z.string().optional()
});

export default function ResumeBuilder() {
  // --- UI State ---
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(true);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [designPanelOpen, setDesignPanelOpen] = useState(false);
  const [pageDrawerOpen, setPageDrawerOpen] = useState(false);
  
  // --- Design State ---
  const [design, setDesign] = useState({
    template: 'classic', fontHeading: "'Kalam',cursive", fontBody: "'Lora',serif", accent: '#3a353a', panel: '#f4f3f3', layout: 'classic',
    scale: 100, radius: 10, lineHeight: 1.55, gap: 14, headingStyle: 'bar', italic: true, pageSize: 'letter'
  });

  // --- Content State ---
  const [sections, setSections] = useState([
    { id: 'summary' }, { id: 'licenses' }, { id: 'skills' }, { id: 'experience' }, { id: 'education' }
  ]);
  const [manualBreaks, setManualBreaks] = useState<Record<string, boolean>>({});
  
  const [licenses, setLicenses] = useState([
    { id: 'lic-1', text: '<b>Credential Name</b> — Issuing Organization (Expires: Month Year)' },
    { id: 'lic-2', text: '<b>Second Credential</b> — Issuing Organization (Expires: Month Year)' }
  ]);

  const [skills, setSkills] = useState([
    { id: 'sk-1', title: 'Core Skills', items: 'List 4–6 of your strongest, most relevant skills here.' },
    { id: 'sk-2', title: 'Tools & Software', items: 'List the platforms, tools, or systems you\'re proficient in.' }
  ]);

  const [experiences, setExperiences] = useState([
    { id: 'exp-1', title: 'Job Title | Company Name – City, State', date: 'Month Year – Present', bullets: [{ id: 'b-1', text: 'Describe a key responsibility or achievement, ideally with a measurable result.' }, { id: 'b-2', text: 'Add a second bullet focused on impact rather than just duties.' }], meta: 'Optional details: team size, tools used, scope, or scale — delete this line if you don\'t need it.' },
    { id: 'exp-2', title: 'Previous Job Title | Previous Company – City, State', date: 'Month Year – Month Year', bullets: [{ id: 'b-3', text: 'Describe a key responsibility or achievement, ideally with a measurable result.' }, { id: 'b-4', text: 'Add a second bullet focused on impact rather than just duties.' }], meta: '' }
  ]);

  const [educations, setEducations] = useState([
    { id: 'edu-1', degree: 'Degree | School Name – City, State', bullets: [{ id: 'eb-1', text: 'Graduation: Month Year' }, { id: 'eb-2', text: 'Optional: honors, GPA, or relevant coursework' }] }
  ]);

  // --- Backend State ---
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Generate a simple client ID for rate limiting purposes if none exists
    let cid = localStorage.getItem('resume_client_id');
    if (!cid) {
      cid = 'client_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('resume_client_id', cid);
    }
    setClientId(cid);

    // Load from URL if present
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setResumeId(id);
      loadResumeFromCloud(id);
    }
  }, []);

  const loadResumeFromCloud = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('content')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data && data.content) {
        const c = data.content as any;
        if (c.design) setDesign(c.design);
        if (c.sections) setSections(c.sections);
        if (c.manualBreaks) setManualBreaks(c.manualBreaks);
        if (c.licenses) setLicenses(c.licenses);
        if (c.skills) setSkills(c.skills);
        if (c.experiences) setExperiences(c.experiences);
        if (c.educations) setEducations(c.educations);
        setTemplateGalleryOpen(false);
        toast.success('Resume loaded from cloud');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load resume');
    }
  };

  const handleSaveToCloud = async () => {
    if (!clientId) return;
    setIsSaving(true);
    
    const payload = {
      design,
      sections,
      manualBreaks,
      licenses,
      skills,
      experiences,
      educations
    };

    try {
      const { data, error } = await supabase.rpc('save_resume', {
        p_id: resumeId || null,
        p_content: payload,
        p_client_id: clientId
      });

      if (error) throw error;

      // Zod validation of RPC response based on Strict distributed systems constraints
      const parsed = SaveResponseSchema.parse(data);
      
      if (!parsed.success) {
        if (parsed.code === 'RATE_LIMIT') {
          toast.error('⚠️ ' + (parsed.message || 'Rate limit exceeded'));
        } else {
          toast.error('⚠️ Error: ' + parsed.code);
        }
        return;
      }

      if (parsed.id) {
        setResumeId(parsed.id);
        toast.success('Saved to Supabase securely 🔒');
        
        // Update URL without reloading
        const url = new URL(window.location.href);
        url.searchParams.set('id', parsed.id);
        window.history.pushState({}, '', url);
      }
    } catch (err: any) {
      console.error('Save failed', err);
      toast.error('Failed to save to cloud');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Format Bar State ---
  const [formatBar, setFormatBar] = useState({ visible: false, x: 0, y: 0, active: { b: false, i: false, u: false } });

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0 || sel.toString().trim() === '') {
        setFormatBar(p => ({ ...p, visible: false }));
        return;
      }
      const node = sel.anchorNode;
      const el = node?.nodeType === 3 ? node.parentElement : (node as HTMLElement);
      if (!el || !el.closest('.page') || !el.closest('[contenteditable="true"]')) {
        setFormatBar(p => ({ ...p, visible: false }));
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setFormatBar({
        visible: true,
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY - 10,
        active: {
          b: document.queryCommandState('bold'),
          i: document.queryCommandState('italic'),
          u: document.queryCommandState('underline')
        }
      });
    };
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);
    return () => { document.removeEventListener('mouseup', handleSelection); document.removeEventListener('keyup', handleSelection); };
  }, []);

  const fmt = (cmd: string, val?: string) => {
    if (cmd === 'clear') {
      document.execCommand('removeFormat');
      // Simple clear implementation
    } else if (cmd === 'increaseFontSize' || cmd === 'decreaseFontSize') {
      const factor = cmd === 'increaseFontSize' ? 1.12 : 0.89;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      let container = range.commonAncestorContainer;
      if (container.nodeType === 3) container = container.parentElement as Node;
      const existingSpan = (container as HTMLElement).closest?.('span[data-fsz]');
      if (existingSpan && existingSpan.textContent === range.toString()) {
        const cur = parseFloat((existingSpan as HTMLElement).style.fontSize) || 1;
        (existingSpan as HTMLElement).style.fontSize = (cur * factor).toFixed(2) + 'em';
        return;
      }
      const span = document.createElement('span');
      span.setAttribute('data-fsz', '1');
      span.style.fontSize = factor.toFixed(2) + 'em';
      try { range.surroundContents(span); } catch (e) {
        const frag = range.extractContents(); span.appendChild(frag); range.insertNode(span);
      }
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    } else {
      document.execCommand(cmd, false, val);
    }
    setFormatBar(p => ({
      ...p, active: { b: document.queryCommandState('bold'), i: document.queryCommandState('italic'), u: document.queryCommandState('underline') }
    }));
  };

  // --- Page Breaks Calculation ---
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const resumeRef = useRef<HTMLDivElement>(null);

  const calcPages = useCallback(() => {
    if (!resumeRef.current) return;
    const resume = resumeRef.current;
    const dims = design.pageSize === 'letter' ? { w: 8.5, h: 11 } : { w: 210 / 25.4, h: 297 / 25.4 };
    const marginPx = 0.4 * 96;
    const contentHeightPx = dims.h * 96 - marginPx * 2;
    const resumeRect = resume.getBoundingClientRect();
    const units = Array.from(resume.querySelectorAll('.header, .section-heading, .summary, .bullet-list, .skills-grid, .exp-entry, .edu-entry'));
    
    if (units.length === 0) { setPageBreaks([]); return; }

    let pageStartY: number | null = null;
    const breakStarts: HTMLElement[] = [];

    units.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (pageStartY === null) { pageStartY = rect.top; return; }
      const section = el.closest('.section');
      const isHeading = el.classList.contains('section-heading');
      const manualBreakHere = isHeading && section && section.classList.contains('manual-break');
      const prevEl = units[i - 1];
      const coupledWithHeading = !isHeading && prevEl && prevEl.classList.contains('section-heading') && prevEl.closest('.section') === section;
      const checkTop = coupledWithHeading ? prevEl.getBoundingClientRect().top : rect.top;

      const wouldOverflow = (rect.bottom - pageStartY) > contentHeightPx;
      if ((manualBreakHere || wouldOverflow) && checkTop !== pageStartY) {
        pageStartY = checkTop;
        const breakEl = coupledWithHeading ? (prevEl as HTMLElement) : (el as HTMLElement);
        if (breakStarts[breakStarts.length - 1] !== breakEl) breakStarts.push(breakEl);
      }
    });
    const newBreaks = breakStarts.map(el => el.getBoundingClientRect().top - resumeRect.top);
    setPageBreaks(prev => {
      if (prev.length === newBreaks.length && prev.every((v, i) => v === newBreaks[i])) {
        return prev;
      }
      return newBreaks;
    });
  }, [design.pageSize]);

  useEffect(() => {
    calcPages();
    const observer = new MutationObserver(calcPages);
    if (resumeRef.current) observer.observe(resumeRef.current, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', calcPages);
    return () => { observer.disconnect(); window.removeEventListener('resize', calcPages); };
  }, [calcPages]);

  const applyTemplate = (t: any) => {
    setDesign(prev => ({
      ...prev, template: t.id, fontHeading: t.heading, fontBody: t.body, accent: t.accent, panel: t.panel, radius: t.radius, layout: t.layout, headingStyle: t.headingStyle, italic: t.italic
    }));
  };

  const saveHTML = () => {
    const clone = document.documentElement.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.no-print, .overlay-scrim, .format-bar, .design-panel').forEach(el => el.remove());
    const blob = new Blob(['<!DOCTYPE html>\n' + clone.outerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'resume-editable.html'; a.click();
    URL.revokeObjectURL(url);
  };

  const pageStyles = {
    '--ink': '#232025', '--ink-soft': '#6b6568', '--hairline': '#dcd7da',
    '--mauve': design.panel, '--mauve-dark': shadeColor(design.panel, -8),
    '--panel': design.panel, '--accent': design.accent, '--paper': '#ffffff', '--toolbar-bg': '#1d1b1e', '--danger': '#a94442',
    '--radius': `${design.radius}px`, '--font-heading': design.fontHeading, '--font-body': design.fontBody,
    '--text-scale': design.scale / 100, '--line-height': design.lineHeight, '--section-gap': `${design.gap}px`,
    '--page-width': design.pageSize === 'letter' ? '816px' : '794px', '--page-margin': '38.4px', '--sidebar-w': '230px',
  } as React.CSSProperties;

  const layoutClasses = [
    design.italic ? '' : 'no-italic-body',
    design.headingStyle === 'bar' ? '' : `heading-${design.headingStyle}`,
    design.layout === 'sidebar' ? 'layout-sidebar' : '',
  ].filter(Boolean).join(' ');

  // --- Renderers ---
  const SectionWrapper = ({ id, item, children }: any) => {
    const dragControls = useDragControls();
    return (
      <Reorder.Item value={item} id={id} dragListener={false} dragControls={dragControls} data-section={id} className={cn("section mt-0 relative", manualBreaks[id] && "manual-break")}>
        <div className="section-heading font-[family:var(--font-heading)] font-bold text-base tracking-wide text-[var(--ink)] bg-[var(--mauve-dark)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(30,28,30,0.06)] py-2 px-6 mt-3.5 mb-[var(--section-gap)] flex items-center justify-between gap-2 print:shadow-none print-break-after-avoid">
          <div className="heading-left flex items-center gap-2">
            <DragHandle dragControls={dragControls} />
            {id === 'summary' && 'Professional Summary'}
            {id === 'licenses' && 'Certifications & Licenses'}
            {id === 'skills' && 'Skills'}
            {id === 'experience' && 'Professional Experience'}
            {id === 'education' && 'Education'}
          </div>
          <div className="heading-left flex items-center gap-2">
            <button onClick={() => setManualBreaks(p => ({ ...p, [id]: !p[id] }))} className={cn("font-sans text-[10px] font-bold tracking-normal bg-transparent border border-[var(--hairline)] rounded-md px-2 py-1 cursor-pointer no-print", manualBreaks[id] ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "text-[var(--ink-soft)]")} title="Force this section to start a new printed page">⤓ break</button>
            {id === 'licenses' && <button className="font-sans text-[10px] font-bold bg-[var(--accent)] text-white border-none rounded-md px-2 py-1 cursor-pointer no-print" onClick={() => setLicenses([...licenses, { id: Date.now().toString(), text: '<b>New Credential</b> — Issuing Organization' }])}>+ add</button>}
            {id === 'skills' && <button className="font-sans text-[10px] font-bold bg-[var(--accent)] text-white border-none rounded-md px-2 py-1 cursor-pointer no-print" onClick={() => setSkills([...skills, { id: Date.now().toString(), title: 'New Category', items: 'List skills here' }])}>+ category</button>}
            {id === 'experience' && <button className="font-sans text-[10px] font-bold bg-[var(--accent)] text-white border-none rounded-md px-2 py-1 cursor-pointer no-print" onClick={() => setExperiences([...experiences, { id: Date.now().toString(), title: 'New Job | Company', date: 'Date', bullets: [{ id: Date.now().toString(), text: 'New bullet' }], meta: '' }])}>+ position</button>}
            {id === 'education' && <button className="font-sans text-[10px] font-bold bg-[var(--accent)] text-white border-none rounded-md px-2 py-1 cursor-pointer no-print" onClick={() => setEducations([...educations, { id: Date.now().toString(), degree: 'Degree | School', bullets: [{ id: Date.now().toString(), text: 'New bullet' }] }])}>+ entry</button>}
          </div>
        </div>
        {children}
      </Reorder.Item>
    );
  };

  return (
    <div className={cn("min-h-screen bg-[#d9d6d7] font-sans text-[var(--ink)] antialiased", layoutClasses)} style={pageStyles}>
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-[var(--toolbar-bg)] text-[#f2ecef] flex items-center gap-2 py-3 px-4 flex-wrap shadow-[0_2px_10px_rgba(0,0,0,0.25)] no-print">
        <span className="font-[family:'Kalam',cursive] font-bold text-lg mr-3 text-[#d7d2d4] whitespace-nowrap">✎ Resume Builder</span>
        <button onClick={() => window.print()} className="bg-[var(--accent)] text-[#f2ecef] border border-[var(--accent)] px-3 py-1.5 rounded-md text-sm font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all hover:bg-opacity-80 active:translate-y-px whitespace-nowrap"><Printer size={16}/> Export / Save as PDF</button>
        <button onClick={() => setTemplateGalleryOpen(true)} className="bg-[#372c3b] text-[#f2ecef] border border-[#4d3f52] px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-[#4a3c50] inline-flex items-center gap-1.5"><Palette size={16}/> Templates</button>
        <button onClick={() => setDesignPanelOpen(!designPanelOpen)} className="bg-[#372c3b] text-[#f2ecef] border border-[#4d3f52] px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-[#4a3c50] inline-flex items-center gap-1.5"><FileText size={16}/> Design</button>
        <button onClick={() => setExperiences([...experiences, { id: Date.now().toString(), title: 'Job Title', date: 'Date', bullets: [{ id: Date.now().toString(), text: 'New bullet' }], meta: '' }])} className="bg-[#372c3b] text-[#f2ecef] border border-[#4d3f52] px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-[#4a3c50] whitespace-nowrap">+ Experience</button>
        <button onClick={() => setSkills([...skills, { id: Date.now().toString(), title: 'New Category', items: 'Skills' }])} className="bg-[#372c3b] text-[#f2ecef] border border-[#4d3f52] px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-[#4a3c50] whitespace-nowrap">+ Skills</button>
        <button onClick={handleSaveToCloud} disabled={isSaving} className="bg-[var(--accent)] text-[#f2ecef] border border-[var(--accent)] px-3 py-1.5 rounded-md text-sm font-semibold hover:opacity-80 inline-flex items-center gap-1.5 disabled:opacity-50"><CloudUpload size={16}/> {isSaving ? 'Saving...' : 'Save to Cloud'}</button>
        <button onClick={saveHTML} className="bg-[#372c3b] text-[#f2ecef] border border-[#4d3f52] px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-[#4a3c50] inline-flex items-center gap-1.5"><Save size={16}/> Save HTML</button>
        <button onClick={() => setTutorialOpen(true)} className="bg-[#372c3b] text-[#f2ecef] border border-[#4d3f52] px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-[#4a3c50] inline-flex items-center gap-1.5"><HelpCircle size={16}/> Help</button>
        <span className="flex-1"></span>
        <span className="text-[11px] text-[#b9b3b6] ml-1 hidden lg:inline">Click text to edit · drag ⠿ to reorder · select text for formatting</span>
      </div>

      {/* Design Panel */}
      {designPanelOpen && (
        <div className="absolute top-16 left-4 right-4 z-60 bg-[#2a262b] border border-[#443f47] rounded-xl p-5 shadow-[0_12px_30px_rgba(0,0,0,0.4)] grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 gap-x-6 no-print">
          <div><label className="block text-[10px] font-bold uppercase tracking-wider text-[#b9b3b6] mb-1">Heading Font</label><select className="w-full bg-[#372c3b] text-[#f2ecef] border border-[#4d3f52] rounded-md px-2 py-1 text-sm" value={design.fontHeading} onChange={e => setDesign(p => ({ ...p, fontHeading: e.target.value }))}><option value="'Kalam',cursive">Kalam</option><option value="'Playfair Display',serif">Playfair</option><option value="'Poppins',sans-serif">Poppins</option><option value="Georgia,serif">Georgia</option></select></div>
          <div><label className="block text-[10px] font-bold uppercase tracking-wider text-[#b9b3b6] mb-1">Body Font</label><select className="w-full bg-[#372c3b] text-[#f2ecef] border border-[#4d3f52] rounded-md px-2 py-1 text-sm" value={design.fontBody} onChange={e => setDesign(p => ({ ...p, fontBody: e.target.value }))}><option value="'Lora',serif">Lora</option><option value="'Inter',sans-serif">Inter</option><option value="'Source Serif 4',serif">Source Serif 4</option><option value="Georgia,serif">Georgia</option></select></div>
          <div><label className="block text-[10px] font-bold uppercase tracking-wider text-[#b9b3b6] mb-1">Accent Color</label><input type="color" className="w-full h-7 rounded-md cursor-pointer" value={design.accent} onChange={e => setDesign(p => ({ ...p, accent: e.target.value }))} /></div>
          <div><label className="block text-[10px] font-bold uppercase tracking-wider text-[#b9b3b6] mb-1">Panel Color</label><input type="color" className="w-full h-7 rounded-md cursor-pointer" value={design.panel} onChange={e => setDesign(p => ({ ...p, panel: e.target.value }))} /></div>
          <div><label className="block text-[10px] font-bold uppercase tracking-wider text-[#b9b3b6] mb-1">Layout</label><select className="w-full bg-[#372c3b] text-[#f2ecef] border border-[#4d3f52] rounded-md px-2 py-1 text-sm" value={design.layout} onChange={e => setDesign(p => ({ ...p, layout: e.target.value }))}><option value="classic">Single column</option><option value="sidebar">Sidebar</option></select></div>
          <div><label className="block text-[10px] font-bold uppercase tracking-wider text-[#b9b3b6] mb-1">Text Size</label><input type="range" min="85" max="130" className="w-full" value={design.scale} onChange={e => setDesign(p => ({ ...p, scale: parseInt(e.target.value) }))} /></div>
        </div>
      )}

      {/* Format Bar */}
      <div className={cn("fixed z-[70] bg-[#1d1b1e] rounded-lg p-1.5 flex items-center gap-1 shadow-lg -translate-x-1/2 no-print", formatBar.visible ? 'flex' : 'hidden')} style={{ left: formatBar.x, top: formatBar.y }}>
        <button onMouseDown={(e) => { e.preventDefault(); fmt('bold'); }} className={cn("w-7 h-7 rounded flex items-center justify-center text-[#f2ecef] hover:bg-[#3a353a]", formatBar.active.b && "bg-[var(--accent)]")}><Bold size={14}/></button>
        <button onMouseDown={(e) => { e.preventDefault(); fmt('italic'); }} className={cn("w-7 h-7 rounded flex items-center justify-center text-[#f2ecef] hover:bg-[#3a353a]", formatBar.active.i && "bg-[var(--accent)]")}><Italic size={14}/></button>
        <button onMouseDown={(e) => { e.preventDefault(); fmt('underline'); }} className={cn("w-7 h-7 rounded flex items-center justify-center text-[#f2ecef] hover:bg-[#3a353a]", formatBar.active.u && "bg-[var(--accent)]")}><Underline size={14}/></button>
        <div className="w-px h-5 bg-[#443f47] mx-1"></div>
        <button onMouseDown={(e) => { e.preventDefault(); fmt('decreaseFontSize'); }} className="w-7 h-7 rounded flex items-center justify-center text-[#f2ecef] hover:bg-[#3a353a]"><Minus size={14}/></button>
        <button onMouseDown={(e) => { e.preventDefault(); fmt('increaseFontSize'); }} className="w-7 h-7 rounded flex items-center justify-center text-[#f2ecef] hover:bg-[#3a353a]"><Plus size={14}/></button>
        <div className="w-px h-5 bg-[#443f47] mx-1"></div>
        <input type="color" onInput={(e) => fmt('foreColor', e.currentTarget.value)} className="w-6 h-6 rounded border-none bg-transparent cursor-pointer" />
        <div className="w-px h-5 bg-[#443f47] mx-1"></div>
        <button onMouseDown={(e) => { e.preventDefault(); fmt('clear'); }} className="w-7 h-7 rounded flex items-center justify-center text-[#f2ecef] hover:bg-[#3a353a]"><Eraser size={14}/></button>
      </div>

      {/* Page Drawer Tab */}
      <div onClick={() => setPageDrawerOpen(true)} className="fixed right-0 top-1/2 -translate-y-1/2 bg-[var(--toolbar-bg)] text-[#f2ecef] z-[80] py-3 px-1.5 rounded-l-lg cursor-pointer font-sans text-[11px] font-bold shadow-[-2px_0_10px_rgba(0,0,0,0.2)] flex items-center gap-1 hover:bg-[#372c3b] no-print" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
        📄 PAGES · {pageBreaks.length + 1}
      </div>

      {/* Page Drawer */}
      <div className={cn("fixed right-0 top-0 h-full w-48 z-[79] bg-[#241f26] text-[#f2ecef] shadow-[-6px_0_20px_rgba(0,0,0,0.3)] transition-transform duration-200 p-4 overflow-y-auto font-sans no-print", pageDrawerOpen ? "translate-x-0" : "translate-x-full")}>
        <button className="float-right text-[#b9b3b6] hover:text-white" onClick={() => setPageDrawerOpen(false)}><X size={16}/></button>
        <h4 className="text-xs tracking-wider text-[#d7d2d4] uppercase mb-4 mt-1">Printed Pages</h4>
        {Array.from({ length: pageBreaks.length + 1 }).map((_, i) => (
          <div key={i} onClick={() => { setPageDrawerOpen(false); if (i === 0) window.scrollTo({ top: 0, behavior: 'smooth' }); else document.querySelectorAll('.page-break-line')[i - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="bg-[#33303a] border border-[#443f47] rounded-md p-2.5 mb-2 cursor-pointer text-xs flex justify-between items-center hover:bg-[#443f4d] transition-colors">
            <span className="font-bold">Page {i + 1}</span>
            <span className="text-[10px] text-[#b9b3b6]">{i === 0 ? 'top' : 'jump ↳'}</span>
          </div>
        ))}
      </div>

      {/* Template Overlay */}
      {templateGalleryOpen && (
        <div className="fixed inset-0 bg-[#141214]/75 z-[200] flex items-center justify-center p-4 md:p-8 font-sans no-print overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-8 shadow-[0_30px_70px_rgba(0,0,0,0.35)] m-auto">
            <h2 className="font-[family:'Kalam',cursive] text-2xl text-[#232025] mb-1">Pick a starting template</h2>
            <p className="text-[#6b6568] text-sm mb-6">Every template is fully editable afterward &mdash; fonts, colors, and layout can all be changed later from Design.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATES.map(t => (
                <div key={t.id} onClick={() => { applyTemplate(t); setTemplateGalleryOpen(false); setTutorialOpen(true); }} className={cn("border-2 border-[#e7e3e6] rounded-xl p-4 cursor-pointer transition-all bg-white hover:border-[#b9b3b6] hover:-translate-y-0.5", design.template === t.id && "border-[#3a353a] shadow-inner")}>
                  <div className="h-32 rounded-lg mb-3 overflow-hidden flex flex-col p-2" style={{ background: t.panel }}>
                     <div className="text-base mb-1" style={{ fontFamily: t.heading, color: t.accent }}>Aa</div>
                     <div className="flex flex-col gap-1">
                       <span className="h-1.5 rounded-full w-[55%]" style={{ background: t.accent }}></span>
                       <span className="h-1.5 rounded-full w-[92%]" style={{ background: shadeColor(t.accent, 55) }}></span>
                       <span className="h-1.5 rounded-full w-[80%]" style={{ background: shadeColor(t.accent, 55) }}></span>
                     </div>
                  </div>
                  <div className="font-bold text-[15px] text-[#232025] mb-0.5">{t.name}</div>
                  <div className="text-[12px] text-[#6b6568] leading-relaxed">{t.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-[#e7e3e6] flex justify-end">
              <button onClick={() => { setTemplateGalleryOpen(false); setTutorialOpen(true); }} className="text-[#6b6568] text-sm hover:underline">Skip, use current design</button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      {tutorialOpen && (
        <div className="fixed inset-0 bg-[#141214]/75 z-[200] flex items-center justify-center p-4 font-sans no-print">
          <div className="bg-white rounded-2xl w-full max-w-[440px] p-6 shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
            <div className="text-[11px] font-bold tracking-widest text-[#a19b9d] uppercase mb-1">{TUTORIAL_STEPS[tutorialStep].eyebrow}</div>
            <h3 className="font-[family:'Kalam',cursive] text-xl text-[#232025] mb-2">{TUTORIAL_STEPS[tutorialStep].title}</h3>
            <div className="text-sm text-[#4a4548] leading-relaxed min-h-[70px]" dangerouslySetInnerHTML={{ __html: TUTORIAL_STEPS[tutorialStep].body }} />
            <div className="flex gap-1.5 my-4">
              {TUTORIAL_STEPS.map((_, i) => <span key={i} className={cn("w-2 h-2 rounded-full", i === tutorialStep ? "bg-[#232025]" : "bg-[#e7e3e6]")} />)}
            </div>
            <div className="flex items-center justify-between mt-6">
              <label className="flex items-center gap-2 text-xs text-[#6b6568] cursor-pointer"><input type="checkbox" /> Don&apos;t show this again</label>
              <div className="flex gap-2">
                {tutorialStep > 0 && <button onClick={() => setTutorialStep(p => p - 1)} className="rounded-lg px-4 py-2 text-sm font-semibold border border-[#e7e3e6] hover:bg-gray-50">Back</button>}
                {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                  <button onClick={() => setTutorialStep(p => p + 1)} className="rounded-lg px-4 py-2 text-sm font-semibold bg-[#232025] text-white hover:bg-black">Next</button>
                ) : (
                  <button onClick={() => setTutorialOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold bg-[#232025] text-white hover:bg-black">Let&apos;s go</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="pt-8 pb-16 px-4 flex justify-center canvas-wrap">
        <div ref={resumeRef} className="page relative w-[var(--page-width)] max-w-full bg-[var(--paper)] shadow-[0_10px_35px_rgba(0,0,0,0.18)] mb-8 p-[var(--page-margin)] text-[calc(1em*var(--text-scale))]">
          
          {/* Page Breaks Visuals */}
          {pageBreaks.map((top, idx) => (
            <div key={idx} className="absolute left-0 right-0 h-0 border-t-2 border-dashed border-[#b9757a] pointer-events-none z-10 no-print page-break-line" style={{ top: `${Math.round(top)}px` }}>
              <span className="absolute right-0 -top-4 bg-[#b9757a] text-white font-sans text-[10px] font-bold px-1.5 py-0.5 rounded-t-md tracking-wide">
                Page {idx + 2} starts
              </span>
            </div>
          ))}

          {/* Header */}
          <div className="header text-center bg-[var(--panel)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(30,28,30,0.06)] py-6 px-6 mb-[var(--section-gap)] print-avoid-break">
            <div className="name font-[family:var(--font-heading)] font-bold text-3xl text-[var(--ink)] m-0 mb-1.5 tracking-wide outline-none" contentEditable suppressContentEditableWarning>YOUR NAME</div>
            <div className="contact-line font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] outline-none" contentEditable suppressContentEditableWarning>
              City, State ZIP <span className="text-[var(--hairline)] mx-2">|</span> (555) 123-4567 <span className="text-[var(--hairline)] mx-2">|</span> your.email@example.com
            </div>
          </div>

          {/* Sections */}
          <Reorder.Group values={sections} onReorder={setSections} id="sections-container" className="w-full">
            {sections.map(section => (
              <SectionWrapper key={section.id} id={section.id} item={section}>
                {/* SUMMARY */}
                {section.id === 'summary' && (
                  <div className="summary font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] bg-[var(--panel)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(30,28,30,0.06)] p-4 md:p-5 mb-[var(--section-gap)] print-avoid-break outline-none" contentEditable suppressContentEditableWarning>
                    A two-to-three sentence pitch: your title/field, years of experience, and the kind of impact you make. Write it last — it's easiest once the rest of the resume is filled in.
                  </div>
                )}

                {/* LICENSES */}
                {section.id === 'licenses' && (
                  <Reorder.Group values={licenses} onReorder={setLicenses} as="ul" className="bullet-list m-0 p-4 md:p-5 pl-9 bg-[var(--panel)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(30,28,30,0.06)] mb-[var(--section-gap)] list-disc print-avoid-break">
                    {licenses.map(lic => {
                      const dc = useDragControls(); // eslint-disable-line react-hooks/rules-of-hooks
                      return (
                        <Reorder.Item key={lic.id} value={lic} id={lic.id} dragListener={false} dragControls={dc} className="relative group pl-1 mb-2">
                          <div className="absolute left-[-1.8rem] top-0 no-print"><DragHandle dragControls={dc} /></div>
                          <span className="font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] outline-none" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: lic.text }} />
                          <button className="hidden group-hover:inline ml-2 text-[var(--danger)] text-[10px] font-bold cursor-pointer font-sans no-print" onClick={() => setLicenses(l => l.filter(x => x.id !== lic.id))}>✕ remove</button>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                )}

                {/* SKILLS */}
                {section.id === 'skills' && (
                  <Reorder.Group values={skills} onReorder={setSkills} className="skills-grid grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 bg-[var(--panel)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(30,28,30,0.06)] p-5 mb-[var(--section-gap)] print-avoid-break">
                    {skills.map(sk => {
                      const dc = useDragControls(); // eslint-disable-line react-hooks/rules-of-hooks
                      return (
                        <Reorder.Item key={sk.id} value={sk} dragListener={false} dragControls={dc} className="skill-cat relative pl-6 group">
                          <div className="absolute left-0 top-0.5 no-print"><DragHandle dragControls={dc} /></div>
                          <button className="hidden group-hover:block absolute right-0 top-0 text-[var(--danger)] text-[10px] font-bold cursor-pointer font-sans no-print" onClick={() => setSkills(s => s.filter(x => x.id !== sk.id))}>✕</button>
                          <div className="cat-title font-[family:var(--font-heading)] font-bold text-[14px] text-[var(--ink)] mb-1 outline-none" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: sk.title }} />
                          <div className="cat-items font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] outline-none" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: sk.items }} />
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                )}

                {/* EXPERIENCE */}
                {section.id === 'experience' && (
                  <Reorder.Group values={experiences} onReorder={setExperiences}>
                    {experiences.map(exp => {
                      const dc = useDragControls(); // eslint-disable-line react-hooks/rules-of-hooks
                      return (
                        <Reorder.Item key={exp.id} value={exp} id={exp.id} dragListener={false} dragControls={dc} className="exp-entry relative bg-[var(--panel)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(30,28,30,0.06)] p-4 md:p-5 mb-[var(--section-gap)] print-avoid-break pl-9 group">
                          <div className="absolute left-2 top-4 no-print"><DragHandle dragControls={dc} /></div>
                          <button onClick={() => setExperiences(e => e.filter(x => x.id !== exp.id))} className="remove-entry absolute top-2 right-2 md:top-3 md:right-3 bg-transparent border-none text-[var(--danger)] text-[11px] font-bold cursor-pointer opacity-50 hover:opacity-100 font-sans no-print flex items-center gap-1 hidden group-hover:flex"><X size={12}/> remove</button>
                          <div className="exp-line1 font-[family:var(--font-heading)] font-bold text-base text-[var(--ink)] outline-none" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: exp.title }} />
                          <div className="exp-line2 font-[family:var(--font-body)] italic font-semibold text-[13px] text-[var(--ink-soft)] my-1 outline-none" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: exp.date }} />
                          <ul className="m-0 pl-5 list-disc mt-2">
                            {exp.bullets.map(b => (
                              <li key={b.id} className="relative group/bullet pl-1 mb-1.5">
                                <span className="font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] block outline-none" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: b.text }} />
                                <button className="hidden group-hover/bullet:inline absolute -left-4 top-1 text-[var(--danger)] text-[10px] font-bold cursor-pointer font-sans no-print" onClick={() => setExperiences(e => e.map(x => x.id === exp.id ? { ...x, bullets: x.bullets.filter(y => y.id !== b.id) } : x))}>✕</button>
                              </li>
                            ))}
                          </ul>
                          <button onClick={() => setExperiences(e => e.map(x => x.id === exp.id ? { ...x, bullets: [...x.bullets, { id: Date.now().toString(), text: 'New bullet' }] } : x))} className="add-bullet font-sans text-[11px] font-semibold text-[var(--accent)] bg-transparent border border-dashed border-[var(--accent)] rounded-md px-2 py-1 cursor-pointer mt-2 ml-5 no-print">+ bullet</button>
                          {exp.meta !== undefined && (
                            <div className="exp-meta mt-3 pt-2 border-t border-[var(--hairline)] font-sans text-xs text-[var(--ink-soft)] font-medium leading-relaxed outline-none" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: exp.meta }} />
                          )}
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                )}

                {/* EDUCATION */}
                {section.id === 'education' && (
                  <Reorder.Group values={educations} onReorder={setEducations}>
                    {educations.map(edu => {
                      const dc = useDragControls(); // eslint-disable-line react-hooks/rules-of-hooks
                      return (
                        <Reorder.Item key={edu.id} value={edu} id={edu.id} dragListener={false} dragControls={dc} className="edu-entry relative bg-[var(--panel)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(30,28,30,0.06)] p-4 md:p-5 mb-2 print-avoid-break pl-9 group">
                          <div className="absolute left-2 top-4 no-print"><DragHandle dragControls={dc} /></div>
                          <button onClick={() => setEducations(e => e.filter(x => x.id !== edu.id))} className="remove-entry absolute top-2 right-2 md:top-3 md:right-3 bg-transparent border-none text-[var(--danger)] text-[11px] font-bold cursor-pointer opacity-50 hover:opacity-100 font-sans no-print flex items-center gap-1 hidden group-hover:flex"><X size={12}/> remove</button>
                          <div className="edu-degree font-[family:var(--font-heading)] font-bold text-base text-[var(--ink)] outline-none" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: edu.degree }} />
                          <ul className="m-0 pl-5 list-disc mt-1">
                            {edu.bullets.map(b => (
                              <li key={b.id} className="relative group/bullet pl-1 mb-1">
                                <span className="font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] block outline-none" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: b.text }} />
                                <button className="hidden group-hover/bullet:inline absolute -left-4 top-1 text-[var(--danger)] text-[10px] font-bold cursor-pointer font-sans no-print" onClick={() => setEducations(e => e.map(x => x.id === edu.id ? { ...x, bullets: x.bullets.filter(y => y.id !== b.id) } : x))}>✕</button>
                              </li>
                            ))}
                          </ul>
                          <button onClick={() => setEducations(e => e.map(x => x.id === edu.id ? { ...x, bullets: [...x.bullets, { id: Date.now().toString(), text: 'New bullet' }] } : x))} className="add-bullet font-sans text-[11px] font-semibold text-[var(--accent)] bg-transparent border border-dashed border-[var(--accent)] rounded-md px-2 py-1 cursor-pointer mt-2 ml-5 no-print">+ bullet</button>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                )}

              </SectionWrapper>
            ))}
          </Reorder.Group>

          <div className="page-footer text-center font-sans text-[10px] text-[#a19b9d] mt-4 outline-none" contentEditable suppressContentEditableWarning>Your Name</div>
        </div>
      </div>
    </div>
  );
}

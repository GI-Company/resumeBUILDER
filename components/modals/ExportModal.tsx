import React from 'react';
import { FileDown, X as CloseIcon, Loader2, Printer } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadPdf: () => void;
  isExportingPdf: boolean;
}

export function ExportModal({ isOpen, onClose, onDownloadPdf, isExportingPdf }: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileDown size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Export Resume to PDF</h2>
              <p className="text-xs text-gray-500">Choose the format that best fits your needs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="space-y-3 my-5">
          <button
            onClick={onDownloadPdf}
            disabled={isExportingPdf}
            className="w-full text-left p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all group flex items-start gap-3 cursor-pointer disabled:opacity-60"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-all">
              {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-gray-900 flex items-center justify-between">
                <span>Direct Download (.pdf)</span>
                <span className="text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">Recommended</span>
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Instantly downloads a WYSIWYG multi-page PDF directly to your device. No system print margins or dialogs required.
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              setTimeout(() => window.print(), 150);
            }}
            disabled={isExportingPdf}
            className="w-full text-left p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all group flex items-start gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-all">
              <Printer size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-gray-900 flex items-center justify-between">
                <span>System Print / ATS Vector</span>
                <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">ATS Selectable</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Opens system print dialog (`Save as PDF`). Essential for ATS text parsers. Note: Set Margins to `None` and uncheck Headers/Footers.
              </p>
            </div>
          </button>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { toast } from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId: string | null;
  isPublic: boolean;
  setIsPublic: (val: boolean) => void;
  onSaveNow: () => void;
  executeSaveToCloud: () => void;
}

export function ShareModal({
  isOpen,
  onClose,
  resumeId,
  isPublic,
  setIsPublic,
  onSaveNow,
  executeSaveToCloud
}: ShareModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Share Resume</h2>
        <p className="text-sm text-gray-500 mb-4">
          {resumeId ? "Anyone with this link can view your resume." : "Please save your resume to the cloud first to generate a shareable link."}
        </p>
        {resumeId ? (
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/share/${resumeId}`}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-600 focus:outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/share/${resumeId}`);
                  toast.success("Link copied to clipboard! 📋");
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Copy
              </button>
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="relative inline-block w-10 h-5 align-middle select-none">
                <input 
                  type="checkbox" 
                  className="peer sr-only" 
                  checked={isPublic}
                  onChange={(e) => {
                    setIsPublic(e.target.checked);
                    setTimeout(() => executeSaveToCloud(), 0);
                  }}
                />
                <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:bg-blue-600 transition-colors"></div>
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">Make Link Public</span>
                <span className="text-[11px] text-gray-500 leading-tight">If disabled, the share link will return a 404 for visitors.</span>
              </div>
            </label>
          </div>
        ) : (
          <button
            onClick={() => {
              onClose();
              onSaveNow();
            }}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
          >
            Save Resume Now
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full mt-2 px-3 py-2 text-gray-500 hover:text-gray-900 text-xs font-bold transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}

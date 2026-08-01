import React, { RefObject } from 'react';
import { Eraser, X } from 'lucide-react';

interface EraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  eraserCanvasRef: RefObject<HTMLCanvasElement | null>;
  startDrawing: (e: any) => void;
  draw: (e: any) => void;
  stopDrawing: () => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  resetEraserCanvas: () => void;
  saveErasedImage: () => void;
}

export function EraseModal({
  isOpen,
  onClose,
  eraserCanvasRef,
  startDrawing,
  draw,
  stopDrawing,
  brushSize,
  setBrushSize,
  resetEraserCanvas,
  saveErasedImage
}: EraseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex flex-col items-center justify-center p-4 font-sans no-print backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 text-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Eraser className="text-[#00f0ff] animate-pulse" size={18} />
            <h3 className="font-bold text-lg">Erase & Touch Up Brush</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        {/* Workspace */}
        <div className="flex-1 bg-black/50 p-6 flex flex-col items-center justify-center min-h-[350px]">
          <p className="text-xs text-neutral-400 mb-4 flex items-center gap-1">
            <span className="text-[#00f0ff] font-bold">💡 Tip:</span> Click and drag directly on the image below to erase backgrounds or unwanted objects manually.
          </p>
          <div className="relative border-2 border-dashed border-neutral-700/50 rounded-xl p-2 bg-neutral-950 flex items-center justify-center">
            <canvas
              ref={eraserCanvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair max-w-full max-h-[400px] object-contain rounded-lg"
            />
          </div>
        </div>
        
        {/* Controls */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-[200px]">
            <span className="text-xs text-neutral-300 font-medium whitespace-nowrap">Brush Size: {brushSize}px</span>
            <input
              type="range"
              min="5"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="accent-[#00f0ff] flex-1"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={resetEraserCanvas}
              className="px-4 py-2 text-xs font-semibold border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Reset Original
            </button>
            <button
              onClick={saveErasedImage}
              className="px-5 py-2 text-xs font-bold bg-[#00f0ff] text-neutral-950 rounded-lg hover:bg-[#33f5ff] transition-colors flex items-center gap-1.5"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

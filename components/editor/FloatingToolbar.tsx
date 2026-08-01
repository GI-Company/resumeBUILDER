import React, { useEffect, useState, useRef } from 'react';
import { Bold, Italic, Underline, Type, Minus, Plus } from 'lucide-react';

export const FloatingToolbar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);
  
  // Track formatting states for the current selection
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);

  const updateFormatState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      // Don't show toolbar if we clicked inside the toolbar itself
      if (toolbarRef.current?.contains(document.activeElement)) {
        return;
      }

      if (!selection || selection.rangeCount === 0) {
        setIsVisible(false);
        setActiveElement(null);
        return;
      }

      const range = selection.getRangeAt(0);
      let targetNode = range.commonAncestorContainer as Node | HTMLElement;
      
      if (targetNode.nodeType === Node.TEXT_NODE) {
        targetNode = targetNode.parentNode!;
      }

      const editableParent = (targetNode as HTMLElement).closest('[contenteditable="true"]') as HTMLElement;

      if (editableParent) {
        // Selection is inside an editable area
        setActiveElement(editableParent);
        updateFormatState();

        const rect = range.getBoundingClientRect();
        
        // If selection is collapsed (just a cursor), position above the field itself
        if (selection.isCollapsed) {
          const fieldRect = editableParent.getBoundingClientRect();
          setPosition({
            top: fieldRect.top + window.scrollY - 45, // 45px above
            left: fieldRect.left + window.scrollX + (fieldRect.width / 2),
          });
        } else {
          // Position above the text selection
          setPosition({
            top: rect.top + window.scrollY - 45,
            left: rect.left + window.scrollX + (rect.width / 2),
          });
        }
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setActiveElement(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    
    // Also listen to focusout to hide the toolbar if we click away completely
    const handleFocusOut = (e: FocusEvent) => {
      // Need a small timeout to let new focus settle
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || (!active.closest('[contenteditable="true"]') && !toolbarRef.current?.contains(active))) {
          setIsVisible(false);
        }
      }, 10);
    };
    
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  if (!isVisible) return null;

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateFormatState();
    
    // Trigger the input event manually on the content editable field so it saves
    if (activeElement) {
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const changeItemStyle = (updates: { deltaSize?: number; color?: string }) => {
    if (!activeElement) return;
    
    const currentHtml = activeElement.innerHTML;
    
    // Check if it's already wrapped in our custom style span
    const match = currentHtml.match(/^<span class="custom-item-style" style="([^"]*)">(.*)<\/span>$/);
    
    let currentSize = 1.0;
    let currentColor = '';
    let innerHtml = currentHtml;
    
    if (match) {
      const styleStr = match[1];
      innerHtml = match[2];
      
      const sizeMatch = styleStr.match(/font-size:\s*([\d.]+)em/);
      if (sizeMatch) currentSize = parseFloat(sizeMatch[1]);
      
      const colorMatch = styleStr.match(/color:\s*([^;]+)/);
      if (colorMatch) currentColor = colorMatch[1];
    }
    
    let newSize = currentSize;
    if (updates.deltaSize) {
      newSize = Math.max(0.5, Math.min(2.0, currentSize + updates.deltaSize));
    }
    
    let newColor = currentColor;
    if (updates.color !== undefined) {
      newColor = updates.color;
    }
    
    // If defaults, unwrap
    if (Math.abs(newSize - 1.0) < 0.01 && !newColor) {
      activeElement.innerHTML = innerHtml;
    } else {
      let styleStr = '';
      if (Math.abs(newSize - 1.0) >= 0.01) styleStr += `font-size: ${newSize.toFixed(2)}em;`;
      if (newColor) styleStr += `color: ${newColor};`;
      activeElement.innerHTML = `<span class="custom-item-style" style="${styleStr}">${innerHtml}</span>`;
    }
    
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 flex items-center gap-1 px-2 py-1.5 bg-gray-900 rounded-lg shadow-xl border border-gray-700 transition-all duration-150 transform -translate-x-1/2"
      style={{
        top: position.top,
        left: position.left,
      }}
      // Prevent mousedown from stealing focus from the editable field
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={() => handleCommand('bold')}
        className={`p-1.5 rounded transition-colors ${isBold ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => handleCommand('italic')}
        className={`p-1.5 rounded transition-colors ${isItalic ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => handleCommand('underline')}
        className={`p-1.5 rounded transition-colors ${isUnderline ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
        title="Underline"
      >
        <Underline size={16} />
      </button>
      
      <div className="w-px h-5 bg-gray-700 mx-1"></div>
      
      {/* Color Picker (Per-Item) */}
      <div className="relative flex items-center p-1.5 hover:bg-gray-800 rounded group cursor-pointer" title="Item Text Color">
        <div className="w-4 h-4 rounded-full border border-gray-600 overflow-hidden relative">
          <input 
            type="color" 
            className="absolute -top-2 -left-2 w-8 h-8 cursor-pointer"
            onChange={(e) => changeItemStyle({ color: e.target.value })}
          />
        </div>
      </div>

      <div className="w-px h-5 bg-gray-700 mx-1"></div>

      {/* Font Size Per-Item Controls */}
      <button
        onClick={() => changeItemStyle({ deltaSize: -0.1 })}
        className="p-1.5 text-gray-300 hover:bg-gray-800 rounded transition-colors flex items-center"
        title="Decrease Item Font Size"
      >
        <Minus size={14} />
      </button>
      <div className="text-gray-400 text-xs font-medium px-1 flex items-center">
        <Type size={14} />
      </div>
      <button
        onClick={() => changeItemStyle({ deltaSize: 0.1 })}
        className="p-1.5 text-gray-300 hover:bg-gray-800 rounded transition-colors flex items-center"
        title="Increase Item Font Size"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

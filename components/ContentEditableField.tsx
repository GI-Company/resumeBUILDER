import React, { useEffect, useRef, useCallback, memo } from 'react';

interface ContentEditableFieldProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  html: string;
  onChange: (val: string) => void;
  tagName?: string;
  debounceMs?: number;
}

export const ContentEditableField = memo(({
  html,
  onChange,
  tagName = 'div',
  debounceMs = 300,
  ...props
}: ContentEditableFieldProps) => {
  const elementRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store the initial HTML to prevent React from diffing/updating it on re-renders,
  // which causes the cursor to jump to the left.
  const initialHtmlRef = useRef(html);

  // Track the current DOM value to compare against incoming html
  const currentHtmlRef = useRef(html);
  
  // Keep track of the last flushed value so we know if we need to call onChange on blur
  const lastFlushedRef = useRef(html);

  useEffect(() => {
    if (elementRef.current && html !== currentHtmlRef.current) {
      // Don't overwrite if we are currently focused, to avoid cursor jumps!
      if (document.activeElement !== elementRef.current) {
        elementRef.current.innerHTML = html;
        currentHtmlRef.current = html;
        lastFlushedRef.current = html;
      }
    }
  }, [html]);

  const handleInput = useCallback((e: React.FormEvent<HTMLElement>) => {
    const val = e.currentTarget.innerHTML;
    currentHtmlRef.current = val;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      lastFlushedRef.current = val;
      onChange(val);
    }, debounceMs);
  }, [onChange, debounceMs]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const val = e.currentTarget.innerHTML;
    if (val !== lastFlushedRef.current) {
      lastFlushedRef.current = val;
      onChange(val);
    }
  }, [onChange]);

  const Tag = tagName as any;

  return (
    <Tag
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
      dangerouslySetInnerHTML={{ __html: initialHtmlRef.current }}
      {...props}
    />
  );
});

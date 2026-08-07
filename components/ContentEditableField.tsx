import React, { useEffect, useRef, useCallback, memo } from 'react';

interface ContentEditableFieldProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange' | 'onFocus' | 'onBlur'> {
  html: string;
  onChange: (val: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLElement>) => void;
  tagName?: string;
  debounceMs?: number;
}

export const ContentEditableField = memo(({
  html,
  onChange,
  onFocus,
  onBlur,
  tagName = 'div',
  debounceMs = 300,
  ...props
}: ContentEditableFieldProps) => {
  const elementRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFocused = useRef(false);
  
  const initialHtmlRef = useRef(html);
  const currentHtmlRef = useRef(html);
  const lastFlushedRef = useRef(html);

  useEffect(() => {
    if (elementRef.current && html !== currentHtmlRef.current) {
      if (!isFocused.current && !elementRef.current.contains(document.activeElement)) {
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

  const handleFocus = useCallback((e: React.FocusEvent<HTMLElement>) => {
    isFocused.current = true;
    if (onFocus) onFocus(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLElement>) => {
    isFocused.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const val = e.currentTarget.innerHTML;
    if (val !== lastFlushedRef.current) {
      lastFlushedRef.current = val;
      onChange(val);
    }
    if (onBlur) onBlur(e);
  }, [onChange, onBlur]);

  const Tag = tagName as any;

  return (
    <Tag
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
      dangerouslySetInnerHTML={{ __html: initialHtmlRef.current }}
      {...props}
    />
  );
});

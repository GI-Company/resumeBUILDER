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
  const lastHtmlRef = useRef(html);

  useEffect(() => {
    if (elementRef.current && html !== lastHtmlRef.current) {
      elementRef.current.innerHTML = html;
      lastHtmlRef.current = html;
    }
  }, [html]);

  const handleInput = useCallback((e: React.FormEvent<HTMLElement>) => {
    const val = e.currentTarget.innerHTML;
    lastHtmlRef.current = val;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(val);
    }, debounceMs);
  }, [onChange, debounceMs]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const val = e.currentTarget.innerHTML;
    if (val !== lastHtmlRef.current) {
      lastHtmlRef.current = val;
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
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
});

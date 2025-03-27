import React, { forwardRef, useRef, useEffect } from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoResize?: boolean;
  maxHeight?: number;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = "", autoResize = false, maxHeight = 200, ...props }, forwardedRef) => {
    const inputId = props.id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const baseClasses = "px-3 py-2 bg-white dark:bg-gray-800 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full";
    const errorClasses = error ? "border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500" : "border-gray-300 dark:border-gray-600";

    // Use callback ref to merge the forwarded ref and local ref
    const setTextareaRef = (element: HTMLTextAreaElement) => {
      textareaRef.current = element;
      
      if (typeof forwardedRef === 'function') {
        forwardedRef(element);
      } else if (forwardedRef) {
        forwardedRef.current = element;
      }
    };

    const resizeTextarea = () => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;
      
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Set new height based on scrollHeight, with maxHeight limit
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      // Add scrollbar if content exceeds maxHeight
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    };

    // Auto-resize on content change
    useEffect(() => {
      if (autoResize) {
        resizeTextarea();
      }
    }, [props.value, autoResize]);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        resizeTextarea();
      }
      
      if (props.onInput) {
        props.onInput(e);
      }
    };

    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={setTextareaRef}
          id={inputId}
          className={`${baseClasses} ${errorClasses}`}
          onInput={handleInput}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          style={autoResize ? { overflow: 'hidden' } : {}}
          rows={props.rows || 3}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";

export default TextArea;

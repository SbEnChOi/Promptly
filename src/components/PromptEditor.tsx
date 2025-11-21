import React, { useRef, useEffect } from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

const PromptEditor: React.FC<EditorProps> = ({ value, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="w-full h-full bg-white text-gray-800 font-mono text-base leading-relaxed p-6 overflow-hidden relative">
        {/* 
          This component represents the "Target Application" (e.g., Notepad, Slack).
          It purely handles text input.
        */}
        <textarea
          ref={textareaRef}
          className="w-full h-full resize-none outline-none border-none bg-transparent placeholder-gray-300"
          placeholder="Type here to test the overlay widget..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
    </div>
  );
};

export default PromptEditor;
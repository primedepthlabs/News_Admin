"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function TiptapEditor({
  value,
  onChange,
  className = "",
  style,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false, // 🔴 REQUIRED FOR NEXT.JS SSR
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
      // false = no history entry
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${className}`}
      style={style}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300">
        {/* buttons unchanged */}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

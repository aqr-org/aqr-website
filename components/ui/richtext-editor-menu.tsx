import { type Editor } from '@tiptap/react'
import { Pilcrow, Bold, Italic, Strikethrough } from "lucide-react";

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) { return null }

  return (
    <div className="control-group">
      <div 
        className="
          button-group
          flex gap-1 mb-0 flex-wrap text-xs font-bold
          p-2 bg-gray-100 rounded-t-md border border-b-0
          *:w-8 *:h-8 *:flex *:items-center *:justify-center
          *:p-2 *:py-1 *:bg-white *:hover:bg-slate-300 *:rounded-md *:cursor-pointer
        "
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive('paragraph') ? 'is-active' : ''}
        >
          <Pilcrow />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
        >
          <Bold />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
        >
          <Italic />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
        >
          <Strikethrough />
        </button>
      </div>
    </div>
  )
};

export default MenuBar;
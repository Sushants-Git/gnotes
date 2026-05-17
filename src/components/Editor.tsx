import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

type Props = {
  content: string
  editable: boolean
  onChange: (html: string) => void
}

export function Editor({ content, editable, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: editable ? 'Start writing…' : 'Empty note',
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  return <EditorContent editor={editor} className="h-full" />
}

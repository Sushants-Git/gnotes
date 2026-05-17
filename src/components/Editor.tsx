import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import xml from 'highlight.js/lib/languages/xml'

const lowlight = createLowlight()
lowlight.register('js', javascript)
lowlight.register('javascript', javascript)
lowlight.register('jsx', javascript)
lowlight.register('ts', typescript)
lowlight.register('typescript', typescript)
lowlight.register('tsx', typescript)
lowlight.register('go', go)
lowlight.register('rust', rust)
lowlight.register('rs', rust)
lowlight.register('xml', xml)
lowlight.register('html', xml)

type Props = {
  initialContent: string
  editable: boolean
  onChange: (html: string) => void
}

export function Editor({ initialContent, editable, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'ts' }),
      Placeholder.configure({
        placeholder: editable ? 'Start writing…' : 'Empty note',
      }),
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  return <EditorContent editor={editor} className="h-full" />
}

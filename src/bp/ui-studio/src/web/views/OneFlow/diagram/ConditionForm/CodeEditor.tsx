import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api'
import { debounce } from 'lodash'
import React from 'react'
import MonacoEditor, { EditorDidMount, MonacoEditorProps } from 'react-monaco-editor'

import style from './style.scss'
export default class InlineMonacoEditor extends React.Component<MonacoEditorProps> {
  constructor(props: MonacoEditorProps) {
    super(props)
  }

  render() {
    const { options = {}, editorDidMount } = this.props

    // override a word wrapping, disable and hide the scroll bars
    const optionsOverride = {
      ...options,
      minimap: false,
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      scrollbar: {
        vertical: 'hidden',
        horizontal: 'hidden'
      }
    } as monacoEditor.editor.IEditorConstructionOptions

    return (
      <div className={style.codeEditor}>
        <MonacoEditor {...this.props} editorDidMount={this.editorDidMount(editorDidMount)} options={optionsOverride} />
      </div>
    )
  }

  updateEditorHeight(editor, monaco) {
    let prevHeight = 0

    const editorElement = editor.getDomNode()

    if (!editorElement) {
      return
    }

    const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight)
    const lineCount = editor.getModel()?.getLineCount() || 1
    const height = editor.getTopForLineNumber(lineCount + 1) + lineHeight

    if (prevHeight !== height) {
      prevHeight = height
      editorElement.style.height = `${height}px`
      editor.layout()
    }
  }

  private editorDidMount(prevEditorDidMount: EditorDidMount | undefined): EditorDidMount {
    return (editor, monaco) => {
      // on each edit recompute height (wait a bit)
      editor.onDidChangeModelDecorations(() => {
        debounce(() => {
          this.updateEditorHeight(editor, monaco) // typing
          requestAnimationFrame(() => this.updateEditorHeight(editor, monaco)) // folding
        }, 300)
      })
    }
  }
}

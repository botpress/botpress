import React from 'react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { wrapper } from './utils/actions'

import style from './style.scss'

export default class Editor extends React.Component {
  componentDidMount() {
    this.setupEditor()
    this.loadTypings()
  }

  componentWillUnmount() {
    this.editor && this.editor.dispose()
  }

  componentDidUpdate(prevProps) {
    if (this.props.selectedFile === prevProps.selectedFile) {
      return
    }

    if (this.props.selectedFile) {
      this.loadFile(this.props.selectedFile)
    }
  }

  setupEditor() {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES6,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowJs: true,
      typeRoots: ['types']
    })

    this.editor = monaco.editor.create(this.editorContainer, { theme: 'vs-dark' })
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, this.props.onSaveClicked)
    this.editor.onDidChangeModelContent(this.handleContentChanged)
  }

  loadFile(selectedFile, noWrapper) {
    const { content, name } = selectedFile

    const uri = 'bp://files/' + name.replace('.js', '.ts')
    let model = monaco.editor.getModel(uri)
    if (!model) {
      const fileContent = noWrapper ? content : wrapper.add(content)
      model = monaco.editor.createModel(fileContent, 'typescript', uri)
    }

    this.editor && this.editor.setModel(model)
  }

  async loadTypings() {
    const { data: typings } = await this.props.bp.axios.get('/mod/code-editor/typings')

    Object.keys(typings).forEach(name => {
      const uri = 'bp://types/' + name
      const content = typings[name]

      monaco.languages.typescript.typescriptDefaults.addExtraLib(content, uri)
    })
  }

  handleContentChanged = () => {
    const content = wrapper.remove(this.editor.getValue())
    const uri = this.editor.getModel().uri
    const markers = monaco.editor.getModelMarkers({ resource: uri })

    this.props.onContentChanged && this.props.onContentChanged(content, markers)
  }

  render() {
    return <div ref={ref => (this.editorContainer = ref)} className={style.editor} />
  }
}

import React from 'react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { MdClose } from 'react-icons/md'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { wrapper } from './utils/actions'

import style from './style.scss'

export default class Editor extends React.Component {
  componentDidMount() {
    this.setupEditor()
    this.loadTypings()

    if (this.props.selectedFile) {
      this.loadFile(this.props.selectedFile)
    }
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
    this.editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_N,
      this.props.onCreateNewClicked
    )
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_P, () =>
      this.editor.trigger('', 'editor.action.quickCommand')
    )

    this.editor.onDidChangeModelContent(this.handleContentChanged)
    this.editor.onDidChangeModelDecorations(this.handleDecorationChanged)
  }

  loadFile(selectedFile, noWrapper) {
    const { content, location } = selectedFile
    const uri = 'bp://files/' + location.replace('.js', '.ts')

    let oldModel = monaco.editor.getModel(uri)
    if (oldModel) {
      oldModel.dispose()
    }

    const fileContent = noWrapper ? content : wrapper.add(content)
    const model = monaco.editor.createModel(fileContent, 'typescript', uri)

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
    this.props.onContentChanged && this.props.onContentChanged(content)
  }

  handleDecorationChanged = () => {
    const uri = this.editor.getModel().uri
    const markers = monaco.editor.getModelMarkers({ resource: uri })
    this.props.onProblemsChanged && this.props.onProblemsChanged(markers)
  }

  render() {
    return (
      <div className={style.editorContainer}>
        <div className={style.tabsContainer}>
          <div className={style.tab}>
            <span>{this.props.selectedFile.name}</span>

            <div>
              <OverlayTrigger placement="top" overlay={<Tooltip>Discard</Tooltip>}>
                <a className={style.btn} onClick={this.props.onDiscardChanges}>
                  <MdClose />
                </a>
              </OverlayTrigger>
            </div>
          </div>
        </div>
        <div ref={ref => (this.editorContainer = ref)} className={style.editor} />
      </div>
    )
  }
}

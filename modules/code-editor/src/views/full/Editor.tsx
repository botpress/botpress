import { Icon, Position, Tooltip } from '@blueprintjs/core'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import React from 'react'

import { EditableFile } from '../../backend/typings'

import style from './style.scss'
import { wrapper } from './utils/wrapper'

export default class Editor extends React.Component<Props> {
  private editor
  private editorContainer

  async componentDidMount() {
    this.setupEditor()
    await this.loadTypings()

    if (this.props.selectedFile) {
      await this.loadFile(this.props.selectedFile)
    }
  }

  componentWillUnmount() {
    this.editor && this.editor.dispose()
  }

  async componentDidUpdate(prevProps) {
    if (this.props.selectedFile === prevProps.selectedFile) {
      return
    }

    if (this.props.selectedFile) {
      await this.loadFile(this.props.selectedFile)
    }
  }

  setupEditor() {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowJs: true,
      typeRoots: ['types']
    })

    this.editor = monaco.editor.create(this.editorContainer, { theme: 'vs-light', automaticLayout: true })
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, this.props.onSaveClicked)
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_N, () =>
      this.props.onCreateNewClicked('action')
    )
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_P, () =>
      this.editor.trigger('', 'editor.action.quickCommand')
    )

    this.editor.onDidChangeModelContent(this.handleContentChanged)
    this.editor.onDidChangeModelDecorations(this.handleDecorationChanged)
  }

  loadFile(selectedFile: EditableFile, noWrapper?: boolean) {
    const { content, location, type, hookType } = selectedFile
    const uri = monaco.Uri.parse('bp://files/' + location.replace('.js', '.ts'))

    const oldModel = monaco.editor.getModel(uri)
    if (oldModel) {
      oldModel.dispose()
    }

    const fileContent = noWrapper ? content : wrapper.add(content, type, hookType)
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
              <Tooltip content="Discard" position={Position.RIGHT}>
                <Icon icon="delete" iconSize={10} className={style.btn} onClick={this.props.onDiscardChanges} />
              </Tooltip>
            </div>
          </div>
        </div>
        <div ref={ref => (this.editorContainer = ref)} className={style.editor} />
      </div>
    )
  }
}

interface Props {
  onContentChanged: (code: string) => void
  onDiscardChanges: () => void
  onCreateNewClicked: (type: string) => void
  onProblemsChanged: (markers: monaco.editor.IMarker[]) => void
  onSaveClicked: () => void
  selectedFile: EditableFile
  bp: any
}

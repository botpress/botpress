import { Icon, Position, Tooltip } from '@blueprintjs/core'
import { observe } from 'mobx'
import { inject, observer } from 'mobx-react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import React from 'react'

import SplashScreen from './components/SplashScreen'
import { RootStore, StoreDef } from './store'
import { EditorStore } from './store/editor'
import style from './style.scss'

class Editor extends React.Component<Props> {
  private editor: monaco.editor.IStandaloneCodeEditor
  private editorContainer: HTMLDivElement

  async componentDidMount() {
    this.setupEditor()
    // tslint:disable-next-line: no-floating-promises
    this.loadTypings()

    observe(this.props.editor, 'currentFile', this.loadFile, true)
  }

  componentWillUnmount() {
    this.editor && this.editor.dispose()
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
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, this.props.editor.saveChanges)
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_N, this.props.createNewAction)
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_P, () =>
      this.editor.trigger('', 'editor.action.quickCommand', '')
    )

    this.editor.onDidChangeModelContent(this.handleContentChanged)
    this.editor.onDidChangeModelDecorations(this.handleDecorationChanged)

    this.props.store.editor.setMonacoEditor(this.editor)
  }

  loadFile = () => {
    if (!this.props.editor.currentFile) {
      return
    }

    const { location } = this.props.editor.currentFile
    const fileType = location.endsWith('.json') ? 'json' : 'typescript'
    const filepath = fileType === 'json' ? location : location.replace('.js', '.ts')

    const uri = monaco.Uri.parse(`bp://files/${filepath}`)

    const oldModel = monaco.editor.getModel(uri)
    if (oldModel) {
      oldModel.dispose()
    }

    const model = monaco.editor.createModel(this.props.editor.fileContentWrapped, fileType, uri)
    this.editor && this.editor.setModel(model)
  }

  loadTypings = async () => {
    const typings = await this.props.fetchTypings()
    if (!typings) {
      return
    }

    Object.keys(typings).forEach(name => {
      const uri = 'bp://types/' + name
      const content = typings[name]

      if (name.endsWith('.json')) {
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          schemas: [{ uri, fileMatch: ['bot.config.json'], schema: JSON.parse(content) }],
          validate: true
        })
      } else {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(content, uri)
      }
    })
  }

  handleContentChanged = () => {
    this.props.editor.updateContent(this.editor.getValue())
  }

  handleDecorationChanged = () => {
    const uri = this.editor.getModel().uri
    const markers = monaco.editor.getModelMarkers({ resource: uri })
    this.props.editor.setFileProblems(markers)
  }

  render() {
    return (
      <React.Fragment>
        {!this.props.editor.isOpenedFile && <SplashScreen />}
        <div className={style.editorContainer}>
          <div className={style.tabsContainer}>
            <div className={style.tab}>
              <span>{this.props.editor.currentFile && this.props.editor.currentFile.name}</span>

              <div>
                <Tooltip content="Discard" position={Position.RIGHT}>
                  <Icon icon="delete" iconSize={10} className={style.btn} onClick={this.props.editor.discardChanges} />
                </Tooltip>
              </div>
            </div>
          </div>
          <div ref={ref => (this.editorContainer = ref)} className={style.editor} />
        </div>
      </React.Fragment>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  store,
  createNewAction: store.createNewAction,
  typings: store.typings,
  fetchTypings: store.fetchTypings,
  editor: store.editor
}))(observer(Editor))

type Props = { store?: RootStore; editor?: EditorStore } & Pick<
  StoreDef,
  'typings' | 'fetchTypings' | 'createNewAction'
>

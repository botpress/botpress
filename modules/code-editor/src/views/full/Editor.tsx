import { Icon, Position, Tooltip, Button } from '@blueprintjs/core'
import { confirmDialog, lang, toast } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import { observe } from 'mobx'
import { inject, observer } from 'mobx-react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import babylon from 'prettier/parser-babylon'
import prettier from 'prettier/standalone'
import React from 'react'
import { EditableFile } from '../../backend/typings'

import SplashScreen from './components/SplashScreen'
import { RootStore, StoreDef } from './store'
import { EditorStore } from './store/editor'
import CodeEditorApi from './store/api'
import style from './style.scss'
import { wrapper } from './utils/wrapper'

export type FileWithMetadata = EditableFile & {
  uri: monaco.Uri
  state?: any
  lastSaveVersion?: number
  hasChanges?: boolean
}

const MONACO_MARKER_ERROR_SEVERITY = 8

class Editor extends React.Component<Props> {
  private editor: monaco.editor.IStandaloneCodeEditor
  private editorContainer: HTMLDivElement

  async componentDidMount() {
    this.setupEditor()
    // tslint:disable-next-line: no-floating-promises
    this.loadTypings()

    observe(this.props.editor, 'currentTab', this.tabChanged, true)
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

    monaco.languages.registerDocumentFormattingEditProvider('typescript', {
      async provideDocumentFormattingEdits(model, options, token) {
        const text = prettier.format(model.getValue(), {
          parser: 'babel',
          plugins: [babylon],
          singleQuote: true,
          printWidth: 120,
          trailingComma: 'none',
          semi: false,
          bracketSpacing: true,
          requirePragma: false
        })

        return [
          {
            range: model.getFullModelRange(),
            text
          }
        ]
      }
    })

    this.editor = monaco.editor.create(this.editorContainer, { theme: 'vs-light', automaticLayout: true })
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, this.saveChanges)
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_N, this.props.createNewAction)
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_P, () =>
      this.editor.trigger('', 'editor.action.quickCommand', '')
    )

    this.editor.onDidChangeModelContent(this.handleContentChanged)
    this.editor.onDidChangeModelDecorations(this.handleDecorationChanged)

    this.props.store.editor.setMonacoEditor(this.editor)
  }

  tabChanged = () => {
    const file = this.props.editor.currentTab
    if (!file) {
      return
    }

    const { uri, readOnly, content, location } = file
    const fileType = location.endsWith('.json') ? 'json' : 'typescript'

    const model = monaco.editor.getModel(uri)
    if (!model) {
      this.editor.setModel(monaco.editor.createModel(wrapper.add(file, content), fileType, uri))
    } else {
      this.editor.setModel(model)
      this.editor.restoreViewState(file.state)
    }

    this.editor.updateOptions({ readOnly })
    this.editor.focus()
  }

  saveChanges = async () => {
    await this.editor.getAction('editor.action.formatDocument').run()
    await this.props.editor.saveCurrentFile()

    toast.success(lang.tr('module.code-editor.store.fileSaved'))
  }

  closeFile = async (uri?: monaco.Uri) => {
    const file = this.props.editor.currentFile
    if (file?.hasChanges) {
      if (
        await confirmDialog(lang.tr('module.code-editor.store.confirmSaveFile', { file: file.name }), {
          acceptLabel: lang.tr('save'),
          declineLabel: lang.tr('discard')
        })
      ) {
        await this.saveChanges()
      }
    }

    this.props.editor.closeFile(this.props.editor.currentTab)
  }

  loadTypings = async () => {
    const typings = await this.props.fetchTypings()

    this.setSchemas(typings)

    _.forEach(typings, (content, name) => {
      if (!name.includes('.schema.')) {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(content, 'bp://types/' + name)
      }
    })
  }

  setSchemas = (typings: any) => {
    const schemas = _.reduce(
      _.pickBy(typings, (content, name) => name.includes('.schema.')),
      (result, content, name) => {
        result.push({
          uri: 'bp://types/' + name,
          schema: JSON.parse(content)
        })
        return result
      },
      []
    )

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      schemas,
      validate: true
    })
  }

  handleContentChanged = () => {
    const currentVersion = this.editor.getModel().getAlternativeVersionId()
    const currentFile = this.props.editor.currentFile
    const hasChanges = currentFile?.lastSaveVersion !== currentVersion

    this.props.editor.updateCurrentFileContent({ hasChanges })
  }

  handleDecorationChanged = () => {
    const uri = this.editor.getModel().uri
    const markers = monaco.editor
      .getModelMarkers({ resource: uri })
      .filter(x => x.severity === MONACO_MARKER_ERROR_SEVERITY)

    this.props.editor.setFileProblems(markers)
  }

  render() {
    const hasRawPermissions = this.props.permissions?.['root.raw']?.read
    const { isAdvanced, setAdvanced } = this.props.editor
    const isFileOpened = !!this.props.editor.openedFiles.length

    return (
      <React.Fragment>
        {!isFileOpened && (
          <SplashScreen hasRawPermissions={hasRawPermissions} isAdvanced={isAdvanced} setAdvanced={setAdvanced} />
        )}
        <div className={cx(style.editorContainer, { [style.hidden]: !isFileOpened })}>
          <div className={style.tabsContainer}>
            {this.props.editor.openedFiles.map(({ uri, hasChanges }) => {
              const isActive = uri === this.props.editor.currentFile?.uri
              return (
                <div className={cx(style.tab, { [style.active]: isActive })}>
                  <span onClick={() => this.props.editor.switchTab(uri)}>{uri.path}</span>

                  <div>
                    <Tooltip content={lang.tr('close')} position={Position.RIGHT}>
                      <Icon
                        icon={hasChanges ? 'record' : 'small-cross'}
                        iconSize={10}
                        className={style.btn}
                        onClick={() => this.closeFile(uri)}
                      />
                    </Tooltip>
                  </div>
                </div>
              )
            })}{' '}
          </div>
          <div id="monaco-editor" ref={ref => (this.editorContainer = ref)} className={style.editor}>
            <div className={style.floatingButtons}>
              <Tooltip content={lang.tr('save')}>
                <Button onClick={this.props.editor.saveCurrentFile} icon="floppy-disk"></Button>
              </Tooltip>
              &nbsp;
              <Tooltip content={lang.tr('discard')}>
                <Button onClick={() => this.closeFile()} icon="disable"></Button>
              </Tooltip>
            </div>
          </div>
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
  editor: store.editor,
  api: store.api,
  permissions: store.permissions
}))(observer(Editor))

type Props = { store?: RootStore; editor?: EditorStore; api?: CodeEditorApi } & Pick<
  StoreDef,
  'typings' | 'fetchTypings' | 'createNewAction' | 'permissions'
>

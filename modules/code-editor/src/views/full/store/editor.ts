import { lang, toast } from 'botpress/shared'
import { action, computed, observable, runInAction } from 'mobx'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import path from 'path'

import { EditableFile } from '../../../backend/typings'

import { wrapper } from '../utils/wrapper'

import { RootStore } from '.'
import { FileWithMetadata } from 'full/Editor'

const NO_EDIT_EXTENSIONS = ['.tgz', '.sqlite', '.png', '.gif', '.jpg']

const getFileUri = (file: EditableFile): monaco.Uri => {
  const { location } = file
  const fileType = location.endsWith('.json') ? 'json' : 'typescript'
  const filepath = fileType === 'json' ? location : location.replace(/\.js$/i, '.ts')

  return monaco.Uri.parse(`bp://files/${filepath}`)
}

class EditorStore {
  /** Reference to monaco the editor so we can call triggers */
  private _editorRef: monaco.editor.IStandaloneCodeEditor
  private rootStore: RootStore

  @observable
  public openedFiles: FileWithMetadata[] = []

  @observable
  public currentTab: FileWithMetadata

  @observable
  public fileProblems: monaco.editor.IMarker[]

  @observable
  public isAdvanced: boolean = false

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
  }

  @computed
  get currentFile() {
    return this.openedFiles.find(x => x.uri === this.currentTab?.uri)
  }

  @computed
  get fileChangeStatus() {
    return this.openedFiles.map(x => ({ location: x.location, hasChanges: x.hasChanges }))
  }

  @action.bound
  updateCurrentFileContent(obj) {
    const idx = this.openedFiles.findIndex(x => x.uri === this.currentTab?.uri)
    if (idx !== -1) {
      this.openedFiles[idx] = { ...this.openedFiles[idx], ...obj }
    }
  }

  @action.bound
  async saveCurrentFile() {
    this.rootStore.api.saveFile({
      ...this.currentTab,
      content: wrapper.remove(this._editorRef.getValue(), this.currentTab.type)
    })

    setTimeout(() => {
      this.updateCurrentFileContent({
        lastSaveVersion: this._editorRef.getModel().getAlternativeVersionId(),
        hasChanges: false
      })
    }, 200)
  }

  @action.bound
  async switchTab(nextUri: monaco.Uri) {
    this.updateCurrentFileContent({ state: this._editorRef.saveViewState() })

    this.currentTab = this.openedFiles.find(x => x.uri.path === nextUri.path)
  }

  @action.bound
  async openFile(file: EditableFile) {
    if (NO_EDIT_EXTENSIONS.includes(path.extname(file.location))) {
      toast.warning('module.code-editor.error.cannotOpenFile')
      return
    }

    let content = file.content
    if (!content) {
      file.content = await this.rootStore.api.readFile(file)
    }

    runInAction('-> openFile', () => {
      const uri = getFileUri(file)
      const existingFile = this.openedFiles.find(x => x.uri.path === uri.path)

      if (existingFile) {
        return this.switchTab(uri)
      }

      const newFile = { ...file, hasChanges: false, uri, lastSaveVersion: 1 }
      this.openedFiles.push(newFile)
      this.switchTab(uri)
    })
  }

  @action.bound
  setFileProblems(problems) {
    this.fileProblems = problems
  }

  @action.bound
  async setAdvanced(isAdvanced) {
    if (this.rootStore.permissions?.['root.raw']?.read) {
      this.isAdvanced = isAdvanced
      await this.rootStore.fetchFiles()
    } else {
      console.error(lang.tr('module.code-editor.store.onlySuperAdmins'))
    }
  }

  @action.bound
  closeFile(file: EditableFile) {
    const uri = getFileUri(file)
    monaco.editor.getModel(uri).dispose()

    const idx = this.openedFiles.findIndex(x => x.uri === uri)
    this.openedFiles.splice(idx, 1)

    if (this.openedFiles.length) {
      this.switchTab(this.openedFiles[0].uri)
    }
  }

  @action.bound
  setMonacoEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    this._editorRef = editor
  }
}

export { EditorStore }

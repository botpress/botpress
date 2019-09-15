import { action, computed, observable } from 'mobx'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import { EditableFile } from '../../../backend/typings'
import { calculateHash, toastSuccess } from '../utils'
import { wrapper } from '../utils/wrapper'

import { RootStore } from '.'

class EditorStore {
  /** Reference to monaco the editor so we can call triggers */
  private _editorRef: monaco.editor.IStandaloneCodeEditor
  private rootStore: RootStore

  @observable
  public currentFile: EditableFile

  @observable
  public fileContentWrapped: string

  @observable
  public fileContent: string

  @observable
  public fileProblems: monaco.editor.IMarker[]

  @observable
  private _isFileLoaded: boolean

  @observable
  private _originalHash: string

  constructor(rootStore) {
    this.rootStore = rootStore
  }

  @computed
  get isDirty() {
    return this.fileContentWrapped && this._originalHash !== calculateHash(this.fileContentWrapped)
  }

  @computed
  get isOpenedFile() {
    return !!this.currentFile && this._isFileLoaded
  }

  @action.bound
  openFile(file: EditableFile) {
    const { content, type, hookType } = file

    this.fileContent = content
    this.fileContentWrapped = wrapper.add(content, type, hookType)

    this.currentFile = file
    this._isFileLoaded = true

    this.resetOriginalHash()
  }

  @action.bound
  updateContent(newContent: string) {
    this.fileContentWrapped = newContent
    this.fileContent = wrapper.remove(newContent, this.currentFile.type)
  }

  @action.bound
  resetOriginalHash() {
    this._originalHash = calculateHash(this.fileContentWrapped)
  }

  @action.bound
  setFileProblems(problems) {
    this.fileProblems = problems
  }

  @action.bound
  async saveChanges() {
    if (!this.fileContent) {
      return
    }

    await this._editorRef.getAction('editor.action.formatDocument').run()

    if (await this.rootStore.api.saveFile({ ...this.currentFile, content: this.fileContent })) {
      toastSuccess('File saved successfully!')

      await this.rootStore.fetchFiles()
      this.resetOriginalHash()
    }
  }

  @action.bound
  async discardChanges() {
    if (this.isDirty && this.fileContent) {
      if (window.confirm(`Do you want to save the changes you made to ${this.currentFile.name}?`)) {
        await this.saveChanges()
      }
    }

    this.closeFile()
  }

  @action.bound
  closeFile() {
    this._isFileLoaded = false
    this.currentFile = undefined
    this.fileContent = undefined
    this.fileContentWrapped = undefined
  }

  @action.bound
  setMonacoEditor(editor) {
    this._editorRef = editor
  }
}

export { EditorStore }

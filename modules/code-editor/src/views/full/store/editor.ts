import { lang, toast } from 'botpress/shared'
import { FileWithMetadata } from 'full/Editor'
import { action, computed, observable, runInAction } from 'mobx'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import path from 'path'

import { FileDefinition, FileTypes } from '../../../backend/definitions'
import { EditableFile, FilePermissions } from '../../../backend/typings'

import { wrapper } from '../utils/wrapper'

import { RootStore } from '.'

const NO_EDIT_EXTENSIONS = ['.tgz', '.sqlite', '.png', '.gif', '.jpg']

const getFileUri = (file: EditableFile): monaco.Uri => {
  const { location } = file
  const fileType = location.endsWith('.json') ? 'json' : 'typescript'
  const fileName = fileType === 'json' ? location : location.replace(/\.js$/i, '.ts')
  const filepath = `${file.botId ? 'local' : 'global'}/${file.type}/${fileName}`
  return monaco.Uri.parse(`bp://files/${filepath}`)
}

// Copied from backend/utils
export const arePermissionsValid = (
  def: FileDefinition,
  editableFile: EditableFile,
  permissions: FilePermissions,
  actionType: 'read' | 'write'
): boolean => {
  const hasGlobalPerm = def.allowGlobal && permissions[`global.${def.permission}`][actionType]
  const hasScopedPerm = def.allowScoped && permissions[`bot.${def.permission}`][actionType]

  const isGlobalValid = def.allowGlobal && !editableFile.botId
  const isScopedValid = def.allowScoped && !!editableFile.botId

  const hasRootPerm = def.allowRoot && permissions[`root.${def.permission}`][actionType]

  return (hasGlobalPerm && isGlobalValid) || (hasScopedPerm && isScopedValid) || hasRootPerm
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
  get canSaveFile() {
    const fileDef = FileTypes[this.currentFile?.type]
    return fileDef && arePermissionsValid(fileDef, this.currentFile, this.rootStore.permissions, 'write')
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
  updateFileContent(obj, uri?: monaco.Uri) {
    const idx = this.openedFiles.findIndex(x => x.uri === uri)

    if (idx !== -1) {
      this.openedFiles[idx] = { ...this.openedFiles[idx], ...obj }
    }
  }

  @action.bound
  async saveFile(uri: monaco.Uri) {
    if (!this.canSaveFile) {
      return
    }

    const file = this.openedFiles.find(x => x.uri === uri)
    const model = monaco.editor.getModel(uri)

    const result = await this.rootStore.api.saveFile({
      ...file,
      content: wrapper.remove(model.getValue(), file.type)
    })

    await this.rootStore.fetchFiles()

    // Necessary so monaco has the time to update the version correctly
    setTimeout(() => {
      this.updateFileContent(
        {
          lastSaveVersion: model.getAlternativeVersionId(),
          hasChanges: false
        },
        uri
      )
    }, 200)

    return result
  }

  @action.bound
  switchTab(nextUri: monaco.Uri) {
    if (this.currentTab) {
      this.updateFileContent({ state: this._editorRef.saveViewState() }, this.currentTab.uri)
    }

    this.currentTab = this.openedFiles.find(x => x.uri.path === nextUri.path)
  }

  @action.bound
  async openFile(file: EditableFile) {
    if (NO_EDIT_EXTENSIONS.includes(path.extname(file.location))) {
      toast.warning('module.code-editor.error.cannotOpenFile')
      return
    }

    if (!file.content) {
      file = {
        ...file,
        content: await this.rootStore.api.readFile(file)
      }
    }

    if (file.content === undefined) {
      return
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
    const model = monaco.editor.getModel(uri)
    if (model) {
      model.dispose()
    }

    const idx = this.openedFiles.findIndex(x => x.uri.path === uri.path)
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

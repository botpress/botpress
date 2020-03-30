import { confirmDialog } from 'botpress/shared'
import { action, observable, runInAction } from 'mobx'
import path from 'path'

import { EditableFile, FilePermissions, FilesDS, FileType } from '../../../backend/typings'
import { FileFilters } from '../typings'
import { FILENAME_REGEX, toastFailure, toastSuccess } from '../utils'
import { baseAction, baseHook } from '../utils/templates'

import CodeEditorApi from './api'
import { EditorStore } from './editor'

/** Includes the partial definitions of all classes */
export type StoreDef = Partial<RootStore> & Partial<FilePermissions> & Partial<EditorStore>

interface DuplicateOption {
  forCurrentBot?: boolean
  keepSameName?: boolean
}

class RootStore {
  public api: CodeEditorApi
  public editor: EditorStore

  @observable
  public permissions: FilePermissions

  public typings: { [fileName: string]: string } = {}

  @observable
  public files: FilesDS

  @observable
  public filters: FileFilters

  @observable
  public fileFilter: string

  constructor({ bp }) {
    this.api = new CodeEditorApi(bp.axios)
    this.editor = new EditorStore(this)
    // Object required for the observer to be useful.
    this.filters = {
      filename: ''
    }
  }

  @action.bound
  async initialize(): Promise<void> {
    try {
      await this.fetchPermissions()
      await this.fetchFiles()
      await this.fetchTypings()
    } catch (err) {
      console.error('Error while fetching data', err)
    }
  }

  @action.bound
  async fetchPermissions() {
    const permissions = await this.api.fetchPermissions()
    runInAction('-> setEditorConfig', () => {
      this.permissions = permissions
    })
  }

  @action.bound
  async fetchFiles() {
    const files = await this.api.fetchFiles(this.editor.isAdvanced)
    runInAction('-> setFiles', () => {
      this.files = files
    })
  }

  @action.bound
  async fetchTypings() {
    const typings = await this.api.fetchTypings()
    runInAction('-> setTypings', () => {
      this.typings = typings
    })

    return this.typings
  }

  @action.bound
  setFiles(messages: FilesDS) {
    this.files = messages
  }

  @action.bound
  setFilenameFilter(filter: string) {
    this.filters.filename = filter
  }

  @action.bound
  async createFilePrompt(type: FileType, isGlobal?: boolean, hookType?: string) {
    let name = window.prompt(`Choose the name of your ${type}. No special chars. Use camel case`)
    if (!name) {
      return
    }

    if (!FILENAME_REGEX.test(name)) {
      alert('Invalid filename')
      return
    }

    name = name.endsWith('.js') ? name : name + '.js'

    await this.editor.openFile({
      name,
      location: name,
      content: type === 'action' ? baseAction : baseHook,
      type,
      hookType,
      botId: isGlobal ? undefined : window.BOT_ID
    })
  }

  @action.bound
  createNewAction() {
    // This is called by the code editor & the shortcut, so it's the default create
    return this.createFilePrompt('action', false)
  }

  @action.bound
  async deleteFile(file: EditableFile): Promise<void> {
    if (
      await confirmDialog(`Are you sure you want to delete the file named ${file.name}?`, {
        acceptLabel: 'Delete'
      })
    ) {
      if (await this.api.deleteFile(file)) {
        this.editor.closeFile()
        toastSuccess('File deleted successfully!')
        await this.fetchFiles()
      }
    }
  }

  @action.bound
  async disableFile(file: EditableFile): Promise<void> {
    const newName = file.name.charAt(0) !== '.' ? '.' + file.name : file.name
    if (await this.api.renameFile(file, newName)) {
      toastSuccess('File disabled successfully!')
      await this.fetchFiles()
    }
  }

  @action.bound
  async enableFile(file: EditableFile): Promise<void> {
    const newName = file.name.charAt(0) === '.' ? file.name.substr(1) : file.name

    if (await this.api.renameFile(file, newName)) {
      toastSuccess('File enabled successfully!')
      await this.fetchFiles()
    }
  }

  @action.bound
  async renameFile(file: EditableFile, newName: string) {
    if (await this.api.renameFile(file, newName)) {
      toastSuccess('File renamed successfully!')
      await this.fetchFiles()
    }
  }

  @action.bound
  async duplicateFile(file: EditableFile, { keepSameName, forCurrentBot }: DuplicateOption = {}) {
    const fileExt = path.extname(file.location)

    const duplicate = {
      ...file,
      content: file.content || (await this.api.readFile(file)),
      location: keepSameName ? file.location : file.location.replace(fileExt, '_copy' + fileExt)
    }

    if (forCurrentBot) {
      duplicate.botId = window.BOT_ID
    }

    if (await this.api.fileExists(duplicate)) {
      toastFailure('A file with that name already exists')
      return
    }

    if (await this.api.saveFile(duplicate)) {
      toastSuccess('File duplicated successfully!')
      await this.fetchFiles()
    }
  }
}

export { RootStore }

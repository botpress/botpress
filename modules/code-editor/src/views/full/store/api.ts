import _ from 'lodash'

import { EditableFile, FilePermissions, FilesDS } from '../../../backend/typings'
import { toastFailure } from '../utils'

export default class CodeEditorApi {
  private axios

  constructor(axiosInstance) {
    this.axios = axiosInstance
  }

  async fetchPermissions(): Promise<FilePermissions> {
    try {
      const { data } = await this.axios.get('/mod/code-editor/permissions')
      return data
    } catch (err) {
      console.error(`Error while fetching code editor permissions`, err)
    }
  }

  async fetchFiles(): Promise<FilesDS> {
    try {
      const { data } = await this.axios.get('/mod/code-editor/files')
      return data
    } catch (err) {
      this.handleApiError(err, 'Could not fetch files from server')
    }
  }

  async fetchTypings(): Promise<any> {
    try {
      const { data } = await this.axios.get('/mod/code-editor/typings')
      return data
    } catch (err) {
      console.error(`Error while fetching typings`, err)
    }
  }

  async deleteFile(file: EditableFile): Promise<boolean> {
    try {
      await this.axios.post('/mod/code-editor/remove', file)
      return true
    } catch (err) {
      this.handleApiError(err, 'Could not delete your file')
    }
  }

  async renameFile(file: EditableFile, newName: string): Promise<boolean> {
    try {
      await this.axios.post('/mod/code-editor/rename', { file, newName })
      return true
    } catch (err) {
      this.handleApiError(err, 'Could not rename file')
    }
  }

  async fileExists(file: EditableFile): Promise<boolean> {
    try {
      const { data } = await this.axios.post('/mod/code-editor/exists', file)
      return data
    } catch (err) {
      this.handleApiError(err, 'Could not check if file already exists')
    }
  }

  async readFile(file: EditableFile): Promise<string> {
    try {
      const { data } = await this.axios.post('/mod/code-editor/readFile', file)
      return data
    } catch (err) {
      this.handleApiError(err, 'Could not check if file already exists')
    }
  }

  async saveFile(file: EditableFile): Promise<boolean> {
    try {
      await this.axios.post('/mod/code-editor/save', file)
      return true
    } catch (err) {
      this.handleApiError(err, 'Could not save your file')
    }
  }

  handleApiError = (error, customMessage?: string) => {
    if (error.response && error.response.status === 403) {
      return // not enough permissions, nothing to do
    }
    const data = _.get(error, 'response.data', {})
    const errorInfo = data.full || data.message
    customMessage ? toastFailure(`${customMessage}: ${errorInfo}`) : toastFailure(errorInfo)
  }
}

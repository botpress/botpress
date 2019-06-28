import _ from 'lodash'

import { EditableFile, FilesDS } from '../../../backend/typings'
import { Config } from '../typings'
import { toastFailure } from '../utils'

export default class CodeEditorApi {
  private axios

  constructor(axiosInstance) {
    this.axios = axiosInstance
  }

  async fetchConfig(): Promise<Config> {
    try {
      const { data } = await this.axios.get('/mod/code-editor/config')
      return data
    } catch (err) {
      console.error(`Error while fetching code editor config`, err)
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
      await this.axios.put('/mod/code-editor/rename', { file, newName })
      return true
    } catch (err) {
      this.handleApiError(err, 'Could not rename file')
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
    const data = _.get(error, 'response.data', {})
    const errorInfo = data.full || data.message
    customMessage ? toastFailure(`${customMessage}: ${errorInfo}`) : toastFailure(errorInfo)
  }
}

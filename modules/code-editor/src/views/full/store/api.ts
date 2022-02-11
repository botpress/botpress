import { lang, toast } from 'botpress/shared'
import _ from 'lodash'

import { EditableFile, FilePermissions, FilesDS } from '../../../backend/typings'

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
      console.error('Error while fetching code editor permissions', err)
    }
  }

  async fetchFiles(useRawEditor?: boolean): Promise<FilesDS> {
    try {
      const { data } = await this.axios.get(`/mod/code-editor/files${useRawEditor ? '?rawFiles=true' : ''}`)
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
      console.error('Error while fetching typings', err)
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
      return data.fileContent
    } catch (err) {
      this.handleApiError(err, 'Error while reading file')
    }
  }

  async downloadFile(file: EditableFile) {
    try {
      const { data } = await this.axios.post('/mod/code-editor/download', file, { responseType: 'blob' })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([data]))
      link.download = file.name
      link.click()
    } catch (err) {
      this.handleApiError(err, 'Could not check if file already exists')
    }
  }

  async saveFile(file: EditableFile): Promise<boolean> {
    try {
      await this.axios.post('/mod/code-editor/save', file)
      return true
    } catch (err) {
      this.handleApiError(err, 'module.code-editor.error.cannotSaveFile')
    }
  }

  async uploadFile(data: FormData): Promise<boolean> {
    try {
      await this.axios.post('/mod/code-editor/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return true
    } catch (err) {
      this.handleApiError(err, 'module.code-editor.error.cannotUploadFile')
    }
  }

  handleApiError = (error, customMessage?: string) => {
    if (error.response && error.response.status === 403) {
      return // not enough permissions, nothing to do
    }
    const data = _.get(error, 'response.data', {})
    const errorInfo = data.full || data.message

    customMessage
      ? toast.failure(`${lang.tr(customMessage)}: ${lang.tr(errorInfo, { details: data.details })}`)
      : toast.failure(errorInfo, data.details)
  }
}

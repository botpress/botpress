import { AxiosError } from 'axios'
import { CreateFileResponse } from './gen/operations/createFile'

export * from './gen/errors'

export class CreateAndUploadFileError extends Error {
  public constructor(
    message: string,
    public readonly innerError?: AxiosError,
    public readonly file?: CreateFileResponse['file']
  ) {
    super(message)
    this.name = 'FileUploadError'
  }
}

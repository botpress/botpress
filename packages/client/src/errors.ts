import { AxiosError } from 'axios'
import { UpsertFileResponse } from './gen/operations/upsertFile'

export * from './gen/errors'

export class UploadFileError extends Error {
  public constructor(
    message: string,
    public readonly innerError?: AxiosError,
    public readonly file?: UpsertFileResponse['file']
  ) {
    super(message)
    this.name = 'FileUploadError'
  }
}

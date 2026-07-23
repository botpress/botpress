import { UpsertFileResponse } from './gen/public/operations/upsertFile'

export * from './gen/public/errors'

export class UploadFileError extends Error {
  public constructor(
    message: string,
    public readonly innerError?: Error,
    public readonly file?: UpsertFileResponse['file']
  ) {
    super(message)
    this.name = 'FileUploadError'
  }
}

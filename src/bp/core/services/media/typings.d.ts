// The idea here is to provide multiple backend implementation of this like ghost drivers
// type MediaBackend = 'ghost' | 'fs' | 'database' | 's3'
export interface IMediaService {
  saveFile: (fileName: string, content: Buffer) => Promise<string> // TODO Buffer | ReadStream
  readFile: (fileName: string) => Promise<Buffer> // TODO Buffer | ReadStream
  deleteFile: (fileName: string) => Promise<void>
  getPublicURL: (fileName: string) => string
}

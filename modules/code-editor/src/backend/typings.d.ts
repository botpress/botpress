import Editor from './editor'

export type EditorByBot = { [botId: string]: Editor }

export interface TypingDefinitions {
  [file: string]: string
}

export type FileType = 'action'

export interface EditableFile {
  /** The name of the file, extracted from its location */
  name: string
  content: string
  /** Type of file allowed (used to determine storage) */
  type: FileType
  /** The relative location of the file of the specified type */
  location: string
  /** If not set, the file is considered global */
  botId?: string
}

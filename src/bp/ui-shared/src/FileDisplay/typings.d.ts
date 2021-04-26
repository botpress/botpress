import { SupportedFileType } from '../Form/FormFields/typings'

export interface FileDisplayProps {
  url: string
  type: SupportedFileType
  deletable: boolean
  onDelete(): void
}

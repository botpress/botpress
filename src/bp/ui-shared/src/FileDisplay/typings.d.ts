export interface FileDisplayProps {
  url: string
  type: 'image' | 'audio' | string
  deletable: boolean
  onDelete(): void
}

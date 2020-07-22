import { FormData } from 'botpress/sdk'

export interface ItemProps {
  content: FormData
  contentLang: string
  active: boolean
  onEdit: () => void
}

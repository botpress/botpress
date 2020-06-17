import { FormData } from 'botpress/sdk'

export interface ItemProps {
  content: FormData
  active: boolean
  onEdit: () => void
}

import { FormData } from 'common/typings'

export interface ItemProps {
  content: FormData
  active: boolean
  onEdit: () => void
}

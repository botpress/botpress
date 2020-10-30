export interface CollapsibleProps {
  name: string
  children: any
  opened?: boolean
  toggleExpand?: (expanded: boolean) => void
  hidden?: boolean
}

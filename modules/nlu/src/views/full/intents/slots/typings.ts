export type SlotOperation = 'deleted' | 'created' | 'modified'

export interface SlotModification {
  operation: SlotOperation
  name: string
  oldName?: string
}

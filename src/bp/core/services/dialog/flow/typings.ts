type Modification = 'rename' | 'delete' | 'create' | 'update'

export interface FlowModification {
  name: string
  modification: Modification
  newName?: string
  payload?: any
}

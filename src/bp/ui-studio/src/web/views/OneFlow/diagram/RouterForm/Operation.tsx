export interface Operation {
  variable: string
  operator: string
  args: OperationArgs
  negate: boolean
}

export type OperationArgs = { [key: string]: any }

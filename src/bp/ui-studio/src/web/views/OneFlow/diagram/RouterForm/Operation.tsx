export interface Operation {
  variable: string
  operator: string
  args: OperationArgs
}

export type OperationArgs = { [key: string]: any }

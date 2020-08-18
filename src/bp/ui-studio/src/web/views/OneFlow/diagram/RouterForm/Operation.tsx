export interface Operation {
  variable: string
  operator: string
  args: { [key: string]: any }
  negate: boolean
}

export type Result<T> = {
  success: boolean
  message: string
  result?: T
}

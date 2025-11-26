export type Result<T> = {
  message: string
} & (
  | {
      success: true
      result: T
    }
  | {
      success: false
      result?: undefined
    }
)

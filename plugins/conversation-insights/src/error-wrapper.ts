import * as types from './types'

export function wrap<T extends types.CommonProps, Fn extends (props: T) => any>(
  func: Fn,
  context: string
): (props: T) => Promise<Awaited<ReturnType<Fn>> | undefined> {
  return async (props) => {
    try {
      return await func(props)
    } catch (thrown) {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      const message = `An error occured in the conversation-insights plugin while ${context}: ${error.message}`
      props.logger.error(message)
    }
  }
}

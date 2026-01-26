import { TrelloClient } from '../trello-api/trello-client'
import * as bp from '.botpress'

export const printActionTriggeredMsg = ({ type, ctx, logger, input }: bp.AnyActionProps) => {
  logger.forBot().debug(`Running action "${type}" [bot id: ${ctx.botId}]`, { input })
}

type ResolvedFactoryTools<T extends Record<string, (props: bp.CommonHandlerProps) => unknown>> = {
  readonly [K in keyof T]: ReturnType<T[K]>
} & {} // <-- Empty object used for improving readability in IDE type previews

const _createToolFactory = <T extends Record<string, (props: bp.CommonHandlerProps) => unknown>>(toolBuilders: T) => {
  return (props: bp.CommonHandlerProps) => {
    // Of all the options I tested, Proxy had the best average
    // performance, especially as more "toolBuilders" are added.
    return new Proxy(toolBuilders, {
      get(target, tool: string) {
        const builder = target[tool]
        if (!builder) {
          // Sanity check, should never actually be thrown
          throw new Error(`No tool builder found for key: ${String(tool)}`)
        }
        return builder(props)
      },
    }) as ResolvedFactoryTools<T>
  }
}

export const getTools = _createToolFactory({
  trelloClient({ ctx }: bp.CommonHandlerProps) {
    return new TrelloClient({ ctx })
  },
})

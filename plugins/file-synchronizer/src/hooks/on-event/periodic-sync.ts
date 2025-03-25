import * as pluginActions from '../../actions'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['periodicSync'] = async (props) => {
  const syncIntervalHours = props.configuration.enablePeriodicSync?.everyNHours ?? 0

  if (!syncIntervalHours) {
    props.logger.debug('Periodic sync is disabled. Ignoring event.')
    return
  }

  const elapsedHours = (await _getElapsedHours(props, syncIntervalHours)) + 1

  if (elapsedHours < syncIntervalHours) {
    props.logger.debug('Not enough time has passed since the last sync. Ignoring event.')
    await _updateElapsedHours(props, elapsedHours)
    return
  }

  await _updateElapsedHours(props, 0)
  await pluginActions.syncFilesToBotpess.callAction({ ...props, input: {} })
}

const _getElapsedHours = async (props: bp.EventHandlerProps, defaultValue: number): Promise<number> => {
  const { state } = await props.client.getOrSetState({
    id: props.ctx.botId,
    type: 'bot',
    name: 'periodicSync',
    payload: {
      elapsedHoursSinceLastSync: defaultValue,
    },
  })

  return state.payload.elapsedHoursSinceLastSync
}

const _updateElapsedHours = async (props: bp.EventHandlerProps, elapsedHours: number) => {
  await props.client.setState({
    id: props.ctx.botId,
    type: 'bot',
    name: 'periodicSync',
    payload: {
      elapsedHoursSinceLastSync: elapsedHours,
    },
  })
}

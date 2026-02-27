import * as bp from '.botpress'

export async function persistRunMapping(
  client: bp.Client,
  integrationId: string,
  runId: string,
  kbId: string,
  logger: bp.Logger
) {
  let currentMap: Record<string, string> = {}
  try {
    const existingMapping = await client.getState({
      type: 'integration',
      id: integrationId,
      name: 'apifyRunMappings',
    })
    const payload = existingMapping.state.payload
    currentMap = { ...payload }
  } catch {
    logger.forBot().debug(`No existing run mapping found, starting fresh`)
    currentMap = {}
  }

  currentMap[runId] = kbId

  await client.setState({
    type: 'integration',
    id: integrationId,
    name: 'apifyRunMappings',
    payload: currentMap,
  })
}

export async function cleanupRunMapping(client: bp.Client, integrationId: string, runId: string, logger: bp.Logger) {
  try {
    const existingMapping = await client.getState({
      type: 'integration',
      id: integrationId,
      name: 'apifyRunMappings',
    })
    const payload = existingMapping.state.payload as Record<string, string>

    if (payload && payload[runId]) {
      delete payload[runId]
      await client.setState({
        type: 'integration',
        id: integrationId,
        name: 'apifyRunMappings',
        payload,
      })
      logger.forBot().debug(`Cleaned up run mapping for ${runId}`)
    }
  } catch (error) {
    logger.forBot().debug(`Could not clean up run mapping: ${error}`)
  }
}

import * as bp from '.botpress'

export const configureNewHitlSession = async (props: {
  states: bp.ActionHandlerProps['states']
  configuration: bp.configuration.Configuration
  configurationOverrides?: Partial<bp.configuration.Configuration>
  upstreamConversationId: string
}): Promise<bp.configuration.Configuration> => {
  const effectiveSessionConfiguration = {
    ...props.configuration,
    ...props.configurationOverrides,
  }

  await props.states.conversation.effectiveSessionConfig.set(
    props.upstreamConversationId,
    effectiveSessionConfiguration
  )

  return effectiveSessionConfiguration
}

export const retrieveSessionConfig = async (props: {
  states: bp.ActionHandlerProps['states']
  configuration: bp.configuration.Configuration
  upstreamConversationId: string
}): Promise<bp.configuration.Configuration> =>
  await props.states.conversation.effectiveSessionConfig
    .get(props.upstreamConversationId)
    .catch(() => props.configuration)

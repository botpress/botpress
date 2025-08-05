import * as bp from '../../.botpress'

export const addReaction: bp.IntegrationProps['actions']['addReaction'] = async (props) => {
  console.log({ userId: props.input.teamsUserId, messageId: props.input.teamsUserId })
  // TODO: Implement multiple reactions action logic
  return {}
}

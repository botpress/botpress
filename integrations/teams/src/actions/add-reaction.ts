import * as bp from '../../.botpress'

export const addReactions: bp.IntegrationProps['actions']['addReactions'] = async (props) => {
  console.log({ userId: props.input.teamsUserId, messageId: props.input.teamsUserId })
  // TODO: Implement multiple reactions action logic
  return {}
}

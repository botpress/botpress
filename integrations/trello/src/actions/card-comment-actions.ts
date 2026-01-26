import { printActionTriggeredMsg, getTools } from './helpers'
import * as bp from '.botpress'

export const addCardComment: bp.Integration['actions']['addCardComment'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { cardId, commentBody } = props.input
  const newCommentId = await trelloClient.addCardComment({ cardId, commentBody })

  return { message: 'Comment successfully added to the card', newCommentId }
}

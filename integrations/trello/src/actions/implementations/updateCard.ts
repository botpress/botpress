import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const updateCard: bp.Integration['actions']['updateCard'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const {
    bodyText,
    cardId,
    closedState,
    completeState,
    dueDate,
    labelsToAdd,
    labelsToRemove,
    membersToAdd,
    membersToRemove,
    name,
  } = props.input

  const card = await trelloClient.getCardById({ cardId })
  await trelloClient.updateCard({
    partialCard: {
      id: cardId,
      name,
      description: bodyText,
      isClosed: closedState === 'archived',
      isCompleted: completeState === 'complete',
      dueDate,
      labelIds: card.labelIds.concat(labelsToAdd ?? []).filter((labelId) => !labelsToRemove?.includes(labelId)),
      memberIds: card.memberIds.concat(membersToAdd ?? []).filter((memberId) => !membersToRemove?.includes(memberId)),
    },
  })

  return { message: 'Card updated successfully.' }
}

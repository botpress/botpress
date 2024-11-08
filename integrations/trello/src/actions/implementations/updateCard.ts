import { wrapAction } from '../action-wrapper'

export const updateCard = wrapAction(
  { actionName: 'updateCard' },
  async (
    { trelloClient },
    {
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
    }
  ) => {
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
)

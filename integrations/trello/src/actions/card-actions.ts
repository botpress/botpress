import { nameCompare } from '../string-utils'
import { printActionTriggeredMsg, getTools } from './helpers'
import { moveCardVertically } from './move-card-helpers'
import * as bp from '.botpress'

export const getCardsInList: bp.Integration['actions']['getCardsInList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { listId } = props.input
  const matchingCards = await trelloClient.getCardsInList({ listId })

  return { cards: matchingCards }
}

export const getCardById: bp.Integration['actions']['getCardById'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const card = await trelloClient.getCardById({ cardId: props.input.cardId })
  return { card }
}

export const getCardsByDisplayName: bp.Integration['actions']['getCardsByDisplayName'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { listId, cardName } = props.input
  const cards = await trelloClient.getCardsInList({ listId })
  const matchingCards = cards.filter((c) => nameCompare(c.name, cardName))

  return { cards: matchingCards }
}

export const createCard: bp.Integration['actions']['createCard'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { listId, cardName, cardBody, memberIds, labelIds, dueDate, completionStatus } = props.input
  const newCard = await trelloClient.createCard({
    card: {
      name: cardName,
      description: cardBody ?? '',
      listId,
      memberIds,
      labelIds,
      dueDate,
      isCompleted: completionStatus === 'Complete',
    },
  })

  return { message: `Card created successfully. Card ID: ${newCard.id}`, newCardId: newCard.id }
}

export const updateCard: bp.Integration['actions']['updateCard'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const {
    cardId,
    listId,
    cardName,
    cardBody,
    closedStatus,
    completionStatus,
    dueDate,
    labelIdsToAdd,
    labelIdsToRemove,
    memberIdsToAdd,
    memberIdsToRemove,
    verticalPosition,
  } = props.input

  const card = await trelloClient.getCardById({ cardId })
  await trelloClient.updateCard({
    partialCard: {
      id: cardId,
      listId,
      name: cardName,
      description: cardBody,
      isClosed: closedStatus === 'Archived',
      isCompleted: completionStatus === 'Complete',
      dueDate,
      labelIds: card.labelIds.concat(labelIdsToAdd ?? []).filter((labelId) => !labelIdsToRemove?.includes(labelId)),
      memberIds: card.memberIds
        .concat(memberIdsToAdd ?? [])
        .filter((memberId) => !memberIdsToRemove?.includes(memberId)),
      verticalPosition,
    },
  })

  return { message: 'Card updated successfully.' }
}

export const deleteCard: bp.Integration['actions']['deleteCard'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { cardId, hardDelete = false } = props.input

  if (hardDelete) {
    await trelloClient.deleteCard(cardId)
  } else {
    await trelloClient.updateCard({
      partialCard: {
        id: cardId,
        isClosed: true,
      },
    })
  }

  return {}
}

export const moveCardToList: bp.Integration['actions']['moveCardToList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { cardId, newListId } = props.input
  const card = await trelloClient.getCardById({ cardId })
  const newList = await trelloClient.getListById({ listId: newListId })

  await trelloClient.updateCard({ partialCard: { id: card.id, listId: newList.id } })

  return { message: 'Card successfully moved to the new list' }
}

export const moveCardDown: bp.Integration['actions']['moveCardDown'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { cardId, moveDownByNSpaces } = props.input
  const numOfPositions = moveDownByNSpaces ?? 1
  await moveCardVertically({ trelloClient, cardId, numOfPositions })

  return { message: 'Card successfully moved down' }
}

export const moveCardUp: bp.Integration['actions']['moveCardUp'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { cardId, moveUpByNSpaces } = props.input
  const numOfPositions = -(moveUpByNSpaces ?? 1)
  await moveCardVertically({ trelloClient, cardId, numOfPositions })

  return { message: 'Card successfully moved up' }
}

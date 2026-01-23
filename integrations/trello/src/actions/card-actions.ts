import { z, RuntimeError } from '@botpress/sdk'
import { nameCompare } from '../string-utils'
import { CardPosition } from '../trello-api'
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

const _verticalPositionSchema = z.union([z.literal('top'), z.literal('bottom'), z.coerce.number()]).optional()
const _validateVerticalPosition = (verticalPosition: string | undefined): CardPosition | undefined => {
  const result = _verticalPositionSchema.safeParse(verticalPosition?.toLowerCase().trim())
  if (!result.success) {
    throw new RuntimeError(
      `Invalid verticalPosition value. It must be either "top", "bottom", or a float. -> ${result.error.message}`
    )
  }

  return result.data
}

export const updateCard: bp.Integration['actions']['updateCard'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const {
    cardId,
    listId,
    cardName,
    cardBody,
    lifecycleStatus,
    completionStatus,
    dueDate,
    labelIdsToAdd,
    labelIdsToRemove,
    memberIdsToAdd,
    memberIdsToRemove,
    verticalPosition,
  } = props.input

  // When sending null for the due date, the Trello API ignores it. However, an empty string removes the due date.
  // A blank string from a Botpress bot should be treated as undefined (no change), while null is converted to an
  // empty string to should remove the due date.
  let formattedDueDate = dueDate?.trim() !== '' ? dueDate : undefined
  formattedDueDate = formattedDueDate !== null ? formattedDueDate : ''

  const card = await trelloClient.getCardById({ cardId })
  await trelloClient.updateCard({
    partialCard: {
      id: cardId,
      listId,
      name: cardName,
      description: cardBody,
      isClosed: lifecycleStatus ? lifecycleStatus === 'Archived' : undefined,
      isCompleted: completionStatus ? completionStatus === 'Complete' : undefined,
      dueDate: formattedDueDate,
      labelIds: card.labelIds.concat(labelIdsToAdd ?? []).filter((labelId) => !labelIdsToRemove?.includes(labelId)),
      memberIds: card.memberIds
        .concat(memberIdsToAdd ?? [])
        .filter((memberId) => !memberIdsToRemove?.includes(memberId)),
      verticalPosition: _validateVerticalPosition(verticalPosition),
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

  const { cardId, newListId, newVerticalPosition } = props.input
  const card = await trelloClient.getCardById({ cardId })
  const newList = await trelloClient.getListById({ listId: newListId })

  await trelloClient.updateCard({
    partialCard: {
      id: card.id,
      listId: newList.id,
      verticalPosition: _validateVerticalPosition(newVerticalPosition),
    },
  })

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

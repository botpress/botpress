import * as sdk from '@botpress/sdk'
import { Card } from 'definitions/schemas'
import { TrelloClient, CardPosition } from '../trello-api'

export const moveCardVertically = async ({
  trelloClient,
  cardId,
  numOfPositions,
}: {
  trelloClient: TrelloClient
  cardId: string
  numOfPositions: number
}): Promise<void> => {
  if (numOfPositions === 0) {
    return
  }

  const card = await trelloClient.getCardById({ cardId })
  const cardsInList = await trelloClient.getCardsInList({ listId: card.listId })
  cardsInList.sort((a, b) => a.verticalPosition - b.verticalPosition)

  const newPosition = _evaluateNewPosition(cardsInList, cardId, numOfPositions)

  await trelloClient.updateCard({
    partialCard: {
      id: cardId,
      verticalPosition: newPosition,
    },
  })
}

const _evaluateNewPosition = (cardsInList: Card[], cardIdToMove: string, numOfPositions: number): CardPosition => {
  const cardIndex = cardsInList.findIndex((c) => c.id === cardIdToMove)
  if (cardIndex === -1) {
    throw new sdk.RuntimeError(`Card with id ${cardIdToMove} not found in the target list of cards`)
  }

  const newIndex = cardIndex + numOfPositions

  if (newIndex <= 0) {
    return 'top'
  }

  if (newIndex >= cardsInList.length - 1) {
    return 'bottom'
  }

  const sibling = cardsInList[newIndex]
  const otherSibling = cardsInList[newIndex + Math.sign(numOfPositions)]

  if (!sibling || !otherSibling) {
    // Sanity check, should never actually be called
    throw new sdk.RuntimeError('Card must have a sibling card on each side to determine new position')
  }

  // This is supposed to be a float value. For reference, check the "pos" property in the "Update a Card" request
  // parameters: https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-put-request
  return (sibling.verticalPosition + otherSibling.verticalPosition) / 2
}

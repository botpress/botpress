import * as sdk from '@botpress/sdk'
import { Card } from 'definitions/schemas'
import { TrelloClient } from 'src/trello-api/trello-client'

export const moveCardVertically = async ({
  trelloClient,
  cardId,
  nbPositions,
}: {
  trelloClient: TrelloClient
  cardId: string
  nbPositions: number
}): Promise<void> => {
  if (nbPositions === 0) {
    return
  }

  const card = await trelloClient.getCardById({ cardId })
  const cardsInList = await trelloClient.getCardsInList({ listId: card.listId })
  const cardIndex = cardsInList.findIndex((c) => c.id === cardId)

  const updatedCard = _moveCard(cardsInList, card, cardIndex, nbPositions)

  await trelloClient.updateCard({
    partialCard: updatedCard,
  })
}

const _moveCard = (cardsInList: Card[], card: Card, cardIndex: number, nbPositions: number): Card => {
  const newIndex = _calculateNewIndex(cardIndex, nbPositions, cardsInList.length)
  const cardAtNewPosition = _getCardAtNewPosition(cardsInList, newIndex)

  return {
    ...card,
    verticalPosition: cardAtNewPosition.verticalPosition + Math.sign(nbPositions),
  }
}

const _calculateNewIndex = (cardIndex: number, nbPositions: number, listLength: number): number => {
  const newIndex = cardIndex + nbPositions

  if (newIndex < 0 || newIndex >= listLength) {
    throw new sdk.RuntimeError(
      `Impossible to move the card by ${nbPositions} positions, as it would put the card out of bounds`
    )
  }

  return newIndex
}

const _getCardAtNewPosition = (cardsInList: Card[], newIndex: number): Card => {
  const cardAtNewPosition = cardsInList[newIndex]

  if (!cardAtNewPosition) {
    throw new sdk.RuntimeError('Card to swap with must exist')
  }

  return cardAtNewPosition
}

import assert from 'assert'
import { TrelloCardRepository } from 'src/repositories/trelloCardRepository'
import { TrelloListRepository } from 'src/repositories/trelloListRepository'
import { Card } from '../schemas/entities/card'
import { nameCompare } from '../utils'

export type CardModificationRequest = {
  bodyText: Card['description']
  closedState: 'open' | 'archived'
  completeState: 'complete' | 'incomplete'
  dueDate: Card['dueDate']
  labelsToAdd: Card['labelIds']
  labelsToRemove: Card['labelIds']
  membersToAdd: Card['memberIds']
  membersToRemove: Card['memberIds']
  name: Card['name']
}

export class TrelloCardUpdateService {
  public constructor(
    private readonly cardRepository: TrelloCardRepository,
    private readonly listRepository: TrelloListRepository
  ) {}

  public async moveCardVertically(cardId: string, nbPositions: number): Promise<void> {
    if (nbPositions === 0) {
      return
    }

    const card = await this.cardRepository.getCardById(cardId)
    const cardsInList = await this.listRepository.getCardsInList(card.listId)
    const cardIndex = cardsInList.findIndex((c) => nameCompare(c.name, card.name))

    const updatedCard =
      nbPositions > 0
        ? this.moveCardUp(cardsInList, cardIndex, nbPositions)
        : this.moveCardDown(cardsInList, cardIndex, -nbPositions)

    await this.cardRepository.updateCard(updatedCard)
  }

  private moveCardUp(cards: Card[], cardIndex: number, nbPositions: number): Card {
    if (cardIndex - nbPositions < 0) {
      throw new Error(
        `Impossible to move the card up by ${nbPositions} positions, as it would put the card out of bounds`
      )
    }

    const card = cards[cardIndex]
    const cardAtNewPosition = cards[cardIndex - nbPositions]

    assert(card, 'Card to move must exist')
    assert(cardAtNewPosition, 'Card to swap with must exist')

    card.verticalPosition = cardAtNewPosition.verticalPosition - 1
    return card
  }

  private moveCardDown(cards: Card[], cardIndex: number, nbPositions: number): Card {
    if (cardIndex + nbPositions >= cards.length) {
      throw new Error(
        `Impossible to move the card down by ${nbPositions} positions, as it would put the card out of bounds`
      )
    }

    const card = cards[cardIndex]
    const cardAtNewPosition = cards[cardIndex + nbPositions]

    assert(card, 'Card to move must exist')
    assert(cardAtNewPosition, 'Card to swap with must exist')

    card.verticalPosition = cardAtNewPosition.verticalPosition + 1
    return card
  }

  public async moveCardToOtherList(cardId: string, newListId: string): Promise<void> {
    const card = await this.cardRepository.getCardById(cardId)
    const newList = await this.listRepository.getListById(newListId)

    card.listId = newList.id

    await this.cardRepository.updateCard(card)
  }

  public async updateCard(cardId: Card['id'], modifications: Partial<CardModificationRequest>): Promise<void> {
    const card = await this.cardRepository.getCardById(cardId)

    const cardData: Partial<Card> & Pick<Card, 'id'> = {
      id: cardId,
      name: modifications.name ?? card.name,
      description: modifications.bodyText ?? card.description,
      isClosed: modifications.closedState ? modifications.closedState === 'archived' : card.isClosed,
      isCompleted: modifications.completeState ? modifications.completeState === 'complete' : card.isCompleted,
      dueDate: modifications.dueDate ?? card.dueDate,
      labelIds: [...card.labelIds, ...(modifications.labelsToAdd ?? [])].filter(
        (labelId) => !modifications.labelsToRemove?.includes(labelId)
      ),
      memberIds: [...card.memberIds, ...(modifications.membersToAdd ?? [])].filter(
        (memberId) => !modifications.membersToRemove?.includes(memberId)
      ),
    } as const

    await this.cardRepository.updateCard(cardData)
  }
}

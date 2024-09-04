import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { ICardRepository } from '../interfaces/repositories/ICardRepository'
import { IListRepository } from '../interfaces/repositories/IListRepository'
import { CardModificationRequest, ICardUpdateService } from '../interfaces/services/ICardUpdateService'
import { DIToken } from '../iocContainer'
import { Card } from '../schemas/entities/Card'
import { nameCompare } from '../utils'

@injectable()
export class TrelloCardUpdateService implements ICardUpdateService {
  constructor(
    @inject(DIToken.CardRepository) private cardRepository: ICardRepository,
    @inject(DIToken.ListRepository) private listRepository: IListRepository
  ) {}

  async moveCardVertically(cardId: string, nbPositions: number): Promise<void> {
    if (nbPositions === 0) {
      return
    }

    const card = await this.cardRepository.getCard(cardId)
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

    const card = cards[cardIndex]!
    const cardAtNewPosition = cards[cardIndex - nbPositions]!

    card.verticalPosition = cardAtNewPosition.verticalPosition - 1
    return card
  }

  private moveCardDown(cards: Card[], cardIndex: number, nbPositions: number): Card {
    if (cardIndex + nbPositions >= cards.length) {
      throw new Error(
        `Impossible to move the card down by ${nbPositions} positions, as it would put the card out of bounds`
      )
    }

    const card = cards[cardIndex]!
    const cardAtNewPosition = cards[cardIndex + nbPositions]!

    card.verticalPosition = cardAtNewPosition.verticalPosition + 1
    return card
  }

  async moveCardToOtherList(cardId: string, newListId: string): Promise<void> {
    const card = await this.cardRepository.getCard(cardId)
    const newList = await this.listRepository.getList(newListId)

    card.listId = newList.id

    await this.cardRepository.updateCard(card)
  }

  async updateCard(cardId: Card['id'], modifications: Partial<CardModificationRequest>): Promise<void> {
    const card = await this.cardRepository.getCard(cardId)

    const cardData: Partial<Card> & Pick<Card, 'id'> = {
      id: cardId,
      name: modifications.name ?? card.name,
      description: modifications.bodyText ?? card.description,
      isClosed: modifications.closedState ? modifications.closedState === 'archived' : card.isClosed,
      isCompleted: modifications.completeState ? modifications.completeState === 'complete' : card.isCompleted,
      dueDate: modifications.dueDate ? new Date(modifications.dueDate) : card.dueDate,
      labelIds: [...card.labelIds, ...(modifications.labelsToAdd ?? [])].filter(
        (labelId) => !modifications.labelsToRemove?.includes(labelId)
      ),
      memberIds: [...card.memberIds, ...(modifications.membersToAdd ?? [])].filter(
        (memberId) => !modifications.membersToRemove?.includes(memberId)
      ),
    }

    await this.cardRepository.updateCard(cardData)
  }
}

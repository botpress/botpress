import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { Card } from '../interfaces/entities/Card'
import { ICardRepository } from '../interfaces/repositories/ICardRepository'
import { IListRepository } from '../interfaces/repositories/IListRepository'
import { ICardQueryService } from '../interfaces/services/ICardQueryService'
import { ICardUpdateService } from '../interfaces/services/ICardUpdateService'
import { IListQueryService } from '../interfaces/services/IListQueryService'
import { DIToken } from '../iocContainer'
import { nameCompare } from '../utils'

@injectable()
export class TrelloCardUpdateService implements ICardUpdateService {
    constructor(
        @inject(DIToken.CardQueryService) private cardQueryService: ICardQueryService,
        @inject(DIToken.CardRepository) private cardRepository: ICardRepository,
        @inject(DIToken.ListQueryService) private listQueryService: IListQueryService,
        @inject(DIToken.ListRepository) private listRepository: IListRepository,
    ) { }

    async moveCardVertically(listName: string, cardName: string, nbPositions: number): Promise<void> {
        if (nbPositions === 0) {
            return
        }

        const list = await this.listQueryService.getListByName(listName)
        const cardsInList = await this.listRepository.getCardsInList(list.id)
        const cardIndex = cardsInList.findIndex(c => nameCompare(c.name, cardName))

        const card = nbPositions > 0 ?
            this.moveCardUp(cardsInList, cardIndex, nbPositions) :
            this.moveCardDown(cardsInList, cardIndex, -nbPositions)

        await this.cardRepository.updateCard(card)
    }

    private moveCardUp(cards: Card[], cardIndex: number, nbPositions: number): Card {
        if (cardIndex - nbPositions < 0) {
            throw new Error(`Impossible to move the card up by ${nbPositions} positions, as it would put the card out of bounds`)
        }

        const card = cards[cardIndex]!
        const cardAtNewPosition = cards[cardIndex - nbPositions]!

        card.verticalPosition = cardAtNewPosition.verticalPosition - 1
        return card
    }

    private moveCardDown(cards: Card[], cardIndex: number, nbPositions: number): Card {
        if (cardIndex + nbPositions >= cards.length) {
            throw new Error(`Impossible to move the card down by ${nbPositions} positions, as it would put the card out of bounds`)
        }

        const card = cards[cardIndex]!
        const cardAtNewPosition = cards[cardIndex + nbPositions]!

        card.verticalPosition = cardAtNewPosition.verticalPosition + 1
        return card
    }

    async moveCardToOtherList(listName: string, cardName: string, newListName: string): Promise<void> {
        const card = await this.cardQueryService.getCardByName(listName, cardName)
        const newList = await this.listQueryService.getListByName(newListName)

        card.listId = newList.id

        await this.cardRepository.updateCard(card)
    }
}

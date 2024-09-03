import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { Card } from '../interfaces/entities/Card'
import { ICardRepository } from '../interfaces/repositories/ICardRepository'
import { ICardCreationService } from '../interfaces/services/ICardCreationService'
import { IListQueryService } from '../interfaces/services/IListQueryService'
import { DIToken } from '../iocContainer'

@injectable()
export class TrelloCardCreationService implements ICardCreationService {
    constructor(
        @inject(DIToken.ListQueryService) private listQueryService: IListQueryService,
        @inject(DIToken.CardRepository) private cardRepository: ICardRepository,
    ) { }

    async createCard(name: string, description: string, listName: string): Promise<Card> {
        const list = await this.listQueryService.getListByName(listName)
        const card = {
            name,
            description,
            listId: list.id
        }

        return await this.cardRepository.createCard(card)
    }
}

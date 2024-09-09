import { TrelloID } from 'src/schemas'
import { Member } from 'src/schemas/entities/member'
import { UpdateCard } from 'trello.js/out/api/parameters'
import { Card } from '../schemas/entities/card'
import { keepOnlySetProperties } from '../utils'
import { BaseRepository } from './baseRepository'

export class TrelloCardRepository extends BaseRepository {
  public async getCardMembers(cardId: Card['id']): Promise<Member[]> {
    try {
      const members: { id: TrelloID; fullName: string; username: string }[] =
        await this.trelloClient.cards.getCardMembers({
          id: cardId,
        })

      return members.map((member) => ({
        id: member.id,
        username: member.username,
        fullName: member.fullName,
      }))
    } catch (error) {
      this.handleError(`getCardMembers for id ${cardId}`, error)
    }
  }

  public async getCardById(cardId: Card['id']): Promise<Card> {
    try {
      const card = await this.trelloClient.cards.getCard({
        id: cardId,
      })

      return {
        id: card.id,
        name: card.name,
        description: card.desc,
        listId: card.idList,
        verticalPosition: card.pos,
        isClosed: card.closed,
        isCompleted: card.dueComplete,
        dueDate: card.due ?? undefined,
        labelIds: card.idLabels as TrelloID[],
        memberIds: card.idMembers as TrelloID[],
      }
    } catch (error) {
      this.handleError(`getCard for id ${cardId}`, error)
    }
  }

  public async createCard(card: Pick<Card, 'name' | 'description' | 'listId'>): Promise<Card> {
    try {
      const newCard = await this.trelloClient.cards.createCard({
        idList: card.listId,
        name: card.name,
        desc: card.description,
      })

      return {
        id: newCard.id,
        name: newCard.name,
        description: newCard.desc,
        listId: newCard.idList,
        verticalPosition: newCard.pos,
        isClosed: newCard.closed,
        isCompleted: newCard.dueComplete,
        labelIds: newCard.idLabels as TrelloID[],
        memberIds: newCard.idMembers as TrelloID[],
        dueDate: newCard.due ?? undefined,
      }
    } catch (error) {
      this.handleError('createCard', error)
    }
  }

  public async updateCard(card: Pick<Card, 'id'> & Partial<Card>): Promise<Card> {
    try {
      const updatedProperties = keepOnlySetProperties({
        id: card.id,
        name: card.name,
        desc: card.description,
        idList: card.listId,
        pos: card.verticalPosition,
        closed: card.isClosed,
        dueComplete: card.isCompleted,
        due: card.dueDate,
        idLabels: card.labelIds,
        idMembers: card.memberIds,
      }) as Pick<UpdateCard, 'id'>
      const updatedCard = await this.trelloClient.cards.updateCard(updatedProperties)

      return {
        id: updatedCard.id,
        name: updatedCard.name,
        description: updatedCard.desc,
        listId: updatedCard.idList,
        verticalPosition: updatedCard.pos,
        isClosed: updatedCard.closed,
        isCompleted: updatedCard.dueComplete,
        dueDate: updatedCard.due ?? undefined,
        labelIds: updatedCard.idLabels as TrelloID[],
        memberIds: updatedCard.idMembers as TrelloID[],
      }
    } catch (error) {
      this.handleError(`updateCard for id ${card.id}`, error)
    }
  }
}

import assert from 'assert'
import { Card } from '../schemas/entities/card'
import { BaseRepository } from './baseRepository'

export class TrelloCardCommentRepository extends BaseRepository {
  public async createComment(cardId: Card['id'], commentBody: string): Promise<string> {
    try {
      const comment = await this.trelloClient.cards.addCardComment({
        id: cardId,
        text: commentBody,
      })

      assert(comment.id, 'Comment id must be present')

      return comment.id
    } catch (error) {
      this.handleError(`createComment for card id ${cardId}`, error)
    }
  }
}

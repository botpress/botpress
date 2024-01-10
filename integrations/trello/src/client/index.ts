import { TrelloClient, Models, Parameters } from 'trello.js'

export class TrelloApi {
  private client: TrelloClient

  constructor(apiKey: string, token: string) {
    this.client = new TrelloClient({
      key: apiKey,
      token,
    })
  }

  async createCard(card: Parameters.CreateCard): Promise<Models.Card> {
    return await this.client.cards.createCard(card)
  }

  async updateCard(card: Parameters.UpdateCard): Promise<Models.Card> {
    return await this.client.cards.updateCard(card)
  }

  async addCommentToCard(comment: Parameters.AddCardComment): Promise<Models.Action> {
    return await this.client.cards.addCardComment(comment)
  }

  async getMember(memberId: string): Promise<Models.Member> {
    return await this.client.members.getMember({ id: memberId })
  }

  async getBoardMembers(boardId: string): Promise<Models.Member[]> {
    const members = await this.client.boards.getBoardMembers({ id: boardId })
    return members as Models.Member[]
  }
}

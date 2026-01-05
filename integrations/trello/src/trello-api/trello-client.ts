import { RuntimeError } from '@botpress/sdk'
import {
  webhookSchema,
  type Board,
  type Card,
  type List,
  type Member,
  type TrelloID,
  type Webhook,
} from 'definitions/schemas'
import { TrelloClient as TrelloJs, type Models as TrelloJsModels } from 'trello.js'
import { handleErrorsDecorator as handleErrors } from './error-handling/error-handler-decorator'
import { RequestMapping } from './mapping/request-mapping'
import { ResponseMapping } from './mapping/response-mapping'
import * as bp from '.botpress'

const _useHandleCaughtError = (message: string) => {
  return (thrown: unknown) => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`${message}: ${error.message}`)
  }
}

export class TrelloClient {
  private readonly _trelloJs: TrelloJs
  private readonly _token: string

  public constructor({ ctx }: { ctx: bp.Context }) {
    this._token = ctx.configuration.trelloApiToken
    this._trelloJs = new TrelloJs({ key: ctx.configuration.trelloApiKey, token: ctx.configuration.trelloApiToken })
  }

  @handleErrors('Failed to retrieve board members')
  public async getBoardMembers({ boardId }: { boardId: Board['id'] }): Promise<Member[]> {
    const members: TrelloJsModels.Member[] = await this._trelloJs.boards.getBoardMembers({
      id: boardId,
    })

    return members.map(ResponseMapping.mapMember)
  }

  @handleErrors('Failed to retrieve board by id')
  public async getBoardById({ boardId }: { boardId: Board['id'] }): Promise<Board> {
    const board = await this._trelloJs.boards.getBoard({
      id: boardId,
    })

    return ResponseMapping.mapBoard(board)
  }

  @handleErrors('Failed to retrieve all boards')
  public async getAllBoards(): Promise<Board[]> {
    const boards = await this._trelloJs.members.getMemberBoards({
      id: 'me',
    })

    return boards.map(ResponseMapping.mapBoard)
  }

  @handleErrors('Failed to retrieve lists in board')
  public async getListsInBoard({ boardId }: { boardId: Board['id'] }): Promise<List[]> {
    const lists = await this._trelloJs.boards.getBoardLists({
      id: boardId,
    })

    return lists.map(ResponseMapping.mapList)
  }

  @handleErrors('Failed to add comment to card')
  public async addCardComment({ cardId, commentBody }: { cardId: Card['id']; commentBody: string }): Promise<TrelloID> {
    const comment = await this._trelloJs.cards.addCardComment({
      id: cardId,
      text: commentBody,
    })

    return ResponseMapping.mapTrelloId(comment.id)
  }

  @handleErrors('Failed to get card by id')
  public async getCardById({ cardId }: { cardId: Card['id'] }): Promise<Card> {
    const card = await this._trelloJs.cards.getCard({
      id: cardId,
    })

    return ResponseMapping.mapCard(card)
  }

  @handleErrors('Failed to create card')
  public async createCard({
    card,
  }: {
    card: Pick<Card, 'name' | 'description' | 'listId'> & Partial<Card>
  }): Promise<Card> {
    const newCard = await this._trelloJs.cards.createCard(RequestMapping.mapCreateCard(card))

    return ResponseMapping.mapCard(newCard)
  }

  @handleErrors('Failed to update card')
  public async updateCard({ partialCard }: { partialCard: Pick<Card, 'id'> & Partial<Card> }): Promise<Card> {
    const updatedCard = await this._trelloJs.cards.updateCard(RequestMapping.mapUpdateCard(partialCard))

    return ResponseMapping.mapCard(updatedCard)
  }

  @handleErrors('Failed to get list by id')
  public async getListById({ listId }: { listId: List['id'] }): Promise<List> {
    const list: TrelloJsModels.List = await this._trelloJs.lists.getList({
      id: listId,
    })

    return ResponseMapping.mapList(list)
  }

  @handleErrors('Failed to get cards in list')
  public async getCardsInList({ listId }: { listId: List['id'] }): Promise<Card[]> {
    const cards = await this._trelloJs.lists.getListCards({
      id: listId,
    })

    return cards.map(ResponseMapping.mapCard)
  }

  @handleErrors('Failed to get member by id or username')
  public async getMemberByIdOrUsername({ memberId }: { memberId: Member['id'] | Member['username'] }): Promise<Member> {
    const member = await this._trelloJs.members.getMember({
      id: memberId,
    })

    return ResponseMapping.mapMember(member)
  }

  public listWebhooks(): Promise<Webhook[]> {
    return this._trelloJs.tokens
      .getTokenWebhooks<TrelloJsModels.Webhook[]>({
        token: this._token,
      })
      .catch(_useHandleCaughtError('Failed to list webhooks'))
      .then((rawWebhooks) => {
        const mappedWebhooks = rawWebhooks.map(ResponseMapping.mapWebhook)
        const result = webhookSchema.array().safeParse(mappedWebhooks)

        if (!result.success) {
          throw new RuntimeError('Invalid webhook data received from Trello')
        }

        return result.data
      })
  }

  @handleErrors('Failed to create webhook')
  public async createWebhook({
    description,
    url,
    modelId,
  }: {
    description: string
    url: string
    modelId: string
  }): Promise<Webhook> {
    const webhook = await this._trelloJs.webhooks.createWebhook({
      description,
      callbackURL: url,
      idModel: modelId,
    })

    return ResponseMapping.mapWebhook(webhook)
  }

  @handleErrors('Failed to delete webhook')
  public async deleteWebhook({ id }: { id: string }): Promise<void> {
    await this._trelloJs.webhooks.deleteWebhook({
      id,
    })
  }

  @handleErrors('Failed to get card members')
  public async getCardMembers({ cardId }: { cardId: Card['id'] }): Promise<Member[]> {
    const members: TrelloJsModels.Member[] = await this._trelloJs.cards.getCardMembers({
      id: cardId,
    })

    return members.map(ResponseMapping.mapMember)
  }
}

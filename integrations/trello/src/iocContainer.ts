import { TrelloClient } from 'trello.js'
import * as bp from '../.botpress'
import { TrelloBoardRepository } from './repositories/TrelloBoardRepository'
import { TrelloCardCommentRepository } from './repositories/TrelloCardCommentRepository'
import { TrelloCardRepository } from './repositories/TrelloCardRepository'
import { TrelloListRepository } from './repositories/TrelloListRepository'
import { TrelloMemberRepository } from './repositories/TrelloMemberRepository'
import { TrelloWebhookRepository } from './repositories/TrelloWebhookRepository'
import { TrelloConfig } from './schemas'
import { TrelloBoardQueryService } from './services/TrelloBoardQueryService'
import { TrelloCardCommentCreationService } from './services/TrelloCardCommentCreationService'
import { TrelloCardCreationService } from './services/TrelloCardCreationService'
import { TrelloCardQueryService } from './services/TrelloCardQueryService'
import { TrelloCardUpdateService } from './services/TrelloCardUpdateService'
import { TrelloListQueryService } from './services/TrelloListQueryService'
import { TrelloMemberQueryService } from './services/TrelloMemberQueryService'
import { TrelloWebhookCreationService } from './services/TrelloWebhookCreationService'
import { TrelloWebhookDeletionService } from './services/TrelloWebhookDeletionService'

const initializeServices = (config: TrelloConfig) => {
  const trelloClient = new TrelloClient({
    key: config.trelloApiKey,
    token: config.trelloApiToken,
  })

  const boardRepository = new TrelloBoardRepository(trelloClient)
  const cardCommentRepository = new TrelloCardCommentRepository(trelloClient)
  const cardRepository = new TrelloCardRepository(trelloClient)
  const listRepository = new TrelloListRepository(trelloClient)
  const memberRepository = new TrelloMemberRepository(trelloClient)
  const webhookRepository = new TrelloWebhookRepository(trelloClient)

  const boardQueryService = new TrelloBoardQueryService(boardRepository)
  const cardCommentCreationService = new TrelloCardCommentCreationService(cardCommentRepository)
  const cardCreationService = new TrelloCardCreationService(cardRepository)
  const cardQueryService = new TrelloCardQueryService(listRepository, cardRepository)
  const cardUpdateService = new TrelloCardUpdateService(cardRepository, listRepository)
  const listQueryService = new TrelloListQueryService(boardRepository, listRepository)
  const memberQueryService = new TrelloMemberQueryService(memberRepository)
  const webhookCreationService = new TrelloWebhookCreationService(webhookRepository)
  const webhookDeletionService = new TrelloWebhookDeletionService(webhookRepository)

  return {
    boardRepository,
    cardCommentRepository,
    cardRepository,
    listRepository,
    memberRepository,
    webhookRepository,

    boardQueryService,
    cardCommentCreationService,
    cardCreationService,
    cardQueryService,
    cardUpdateService,
    listQueryService,
    memberQueryService,
    webhookCreationService,
    webhookDeletionService,
  }
}

export type Services = ReturnType<typeof initializeServices>
export const getServices = (ctx: bp.Context): Services => initializeServices(ctx.configuration)

import 'reflect-metadata'
import { TrelloClient } from 'trello.js'
import { container, DependencyContainer, instanceCachingFactory } from 'tsyringe'
import * as bp from '../.botpress'
import { TrelloBoardRepository } from './repositories/TrelloBoardRepository'
import { TrelloCardCommentRepository } from './repositories/TrelloCardCommentRepository'
import { TrelloCardRepository } from './repositories/TrelloCardRepository'
import { TrelloListRepository } from './repositories/TrelloListRepository'
import { TrelloWebhookRepository } from './repositories/TrelloWebhookRepository'
import { TrelloConfig } from './schemas'
import { TrelloBoardQueryService } from './services/TrelloBoardQueryService'
import { TrelloCardCommentCreationService } from './services/TrelloCardCommentCreationService'
import { TrelloCardCreationService } from './services/TrelloCardCreationService'
import { TrelloCardQueryService } from './services/TrelloCardQueryService'
import { TrelloCardUpdateService } from './services/TrelloCardUpdateService'
import { TrelloListQueryService } from './services/TrelloListQueryService'
import { TrelloWebhookCreationService } from './services/TrelloWebhookCreationService'
import { TrelloWebhookDeletionService } from './services/TrelloWebhookDeletionService'

export enum DIToken {
  TrelloConfig = 'TrelloConfig',
  TrelloClient = 'TrelloClient',

  BoardRepository = 'BoardRepository',
  CardCommentRepository = 'CardCommentRepository',
  CardRepository = 'CardRepository',
  ListRepository = 'ListRepository',
  WebhookRepository = 'WebhookRepository',

  BoardQueryService = 'BoardQueryService',
  CardCommentCreationService = 'CardCommentCreationService',
  CardCreationService = 'CardCreationService',
  CardQueryService = 'CardQueryService',
  CardUpdateService = 'CardUpdateService',
  ListQueryService = 'ListQueryService',
  WebhookCreationService = 'WebhookCreationService',
  WebhookDeletionService = 'WebhookDeletionService',
}

const initializeContainer = (config: TrelloConfig): DependencyContainer => {
  const localContainer = container.createChildContainer()

  localContainer.register(DIToken.TrelloConfig, { useValue: config })

  localContainer.register(DIToken.TrelloClient, {
    useFactory: instanceCachingFactory((container) => {
      const config = container.resolve<TrelloConfig>(DIToken.TrelloConfig)
      return new TrelloClient({
        key: config.trelloApiKey,
        token: config.trelloApiToken,
      })
    }),
  })

  localContainer.register(DIToken.BoardRepository, { useClass: TrelloBoardRepository })
  localContainer.register(DIToken.CardCommentRepository, { useClass: TrelloCardCommentRepository })
  localContainer.register(DIToken.CardRepository, { useClass: TrelloCardRepository })
  localContainer.register(DIToken.ListRepository, { useClass: TrelloListRepository })
  localContainer.register(DIToken.WebhookRepository, { useClass: TrelloWebhookRepository })

  localContainer.register(DIToken.BoardQueryService, { useClass: TrelloBoardQueryService })
  localContainer.register(DIToken.CardCommentCreationService, { useClass: TrelloCardCommentCreationService })
  localContainer.register(DIToken.CardCreationService, { useClass: TrelloCardCreationService })
  localContainer.register(DIToken.CardQueryService, { useClass: TrelloCardQueryService })
  localContainer.register(DIToken.CardUpdateService, { useClass: TrelloCardUpdateService })
  localContainer.register(DIToken.ListQueryService, { useClass: TrelloListQueryService })
  localContainer.register(DIToken.WebhookCreationService, { useClass: TrelloWebhookCreationService })
  localContainer.register(DIToken.WebhookDeletionService, { useClass: TrelloWebhookDeletionService })

  return localContainer
}

export const getContainer = (ctx: bp.Context) => initializeContainer(ctx.configuration as TrelloConfig)

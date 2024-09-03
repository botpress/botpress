import * as sdk from '@botpress/sdk'
import { DependencyContainer } from 'tsyringe'
import * as bp from '../.botpress'
import { IWebhookCreationService } from './interfaces/services/IWebhookCreationService'
import { IWebhookDeletionService } from './interfaces/services/IWebhookDeletionService'
import { DIToken } from './iocContainer'

export class WebhookManager {
    private readonly WEBHOOK_DESCRIPTION = 'Botpress integration'
    ctx: bp.Context
    client: bp.Client
    container: DependencyContainer
    logger: bp.Logger

    constructor(ctx: bp.Context, client: bp.Client, container: DependencyContainer, logger: bp.Logger) {
        this.ctx = ctx
        this.client = client
        this.container = container
        this.logger = logger
    }

    async registerTrelloWebhookIfNotExists(webhookUrl: string) {
        if (await this.getWebhookId()) {
            this.logger.forBot().debug('Webhook already registered. Skipping registration...')
            return
        }

        await this.registerTrelloWebhook(webhookUrl)
    }

    async getWebhookId() {
        try {
            const webhookState = await this.client.getState({
                type: 'integration',
                name: 'webhookState',
                id: this.ctx.integrationId
            })

            return webhookState.state.payload.trelloWebhookId ?? null
        } catch (_) {
            return null
        }
    }

    async registerTrelloWebhook(webhookUrl: string) {
        const webhookCreationService = this.container.resolve<IWebhookCreationService>(DIToken.WebhookCreationService)

        this.logger.forBot().info('Registering Trello webhook...')

        try {
            const webhookId = await webhookCreationService.createWebhook(this.WEBHOOK_DESCRIPTION, webhookUrl)
            await this.setWebhookId(webhookId)
        } catch (error) {
            throw new sdk.RuntimeError(`Unable to register Trello webhook: ${error}`)
        }
    }

    async setWebhookId(webhookId: string) {
        await this.client.setState({
            type: 'integration',
            name: 'webhookState',
            id: this.ctx.integrationId,
            payload: {
                trelloWebhookId: webhookId
            }
        })
    }

    async unregisterTrelloWebhookIfExists() {
        const webhookId = await this.getWebhookId()

        if (!webhookId) {
            this.logger.forBot().warn('No webhook is currently registered for this integration. Skipping unregistration...')
            return
        }

        await this.unregisterTrelloWebhook(webhookId)
    }

    async unregisterTrelloWebhook(webhookId: string) {
        const webhookDeletionService = this.container.resolve<IWebhookDeletionService>(DIToken.WebhookDeletionService)

        this.logger.forBot().info(`Unregistering webhook id ${webhookId} on Trello...`)

        try {
            await webhookDeletionService.deleteWebhook(webhookId)
        } catch (_) {
            // We do not care about webhook deletion failures
            this.logger.forBot().warn(`Webhook id ${webhookId} is already unregistered`)
        }

        this.logger.forBot().info(`Webhook id ${webhookId} unregistered`)
        await this.setWebhookId('')
    }
}

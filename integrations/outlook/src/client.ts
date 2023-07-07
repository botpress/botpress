import moment from 'moment'
import { Client, ResponseType } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
import { ClientSecretCredential } from '@azure/identity'
import type { AckFunction, IntegrationContext } from '@botpress/sdk'
import type { Conversation, Message } from '@botpress/client'

type SendMessageProps = {
  ctx: IntegrationContext
  conversation: Conversation
  message: Message
  ack: AckFunction
  body: any
}

interface LifecycleEvent {
  subscriptionId: string
  subscriptionExpirationDateTime: string
  tenantId: string
  clientState: string
  lifecycleEvent: 'subscriptionRemoved' | 'missed' | 'reauthorizationRequired'
}

export class GraphApi {
  private client: Client
  constructor(tenantId: string, clientId: string, clientSecret: string) {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    })

    this.client = Client.initWithMiddleware({
      //debugLogging: true,
      authProvider,
    })
  }

  /**
   * Send Mail
   */
  public sendMail = async ({ message, conversation, ctx, ack, body }: SendMessageProps): Promise<void> => {
    const refMessageId = conversation.tags['outlook:refMessageId']

    if (!refMessageId) {
      console.log('conv tag missing: outlook:refMessageId')
      return
    }

    try {
      await this.client
        .api(`/users/${ctx.configuration.emailAddress}/messages/${refMessageId}/replyAll`)
        .responseType(ResponseType.RAW)
        .post({
          message: {
            body,
          },
        })
      ack({ tags: { 'outlook:id': `${message.id}` } })
    } catch (error) {
      console.log(error.message)
    }

    return
  }

  /**
   * Subscribe webhook
   */
  public subscribeWebhook = async (webhookUrl: string, ctx: IntegrationContext): Promise<string> => {
    const expirationDateTime = this.generateExpirationDate()

    const res = await this.client.api('/subscriptions').post({
      changeType: 'created',
      notificationUrl: webhookUrl,
      lifecycleNotificationUrl: webhookUrl,
      expirationDateTime,
      resource: `/users/${ctx.configuration.emailAddress}/mailFolders('${ctx.configuration.mailFolder}')/messages`,
    })
    return res.id
  }

  /**
   * Handle subscription life cycle events
   */
  public handleLifecycleEvents = async (event: LifecycleEvent) => {
    if (event.lifecycleEvent === 'reauthorizationRequired') {
      console.log('lifecycleEvent - reauthorizationRequired')

      const expirationDateTime = this.generateExpirationDate()
      await this.client.api(`/subscriptions/${event.subscriptionId}`).patch({
        expirationDateTime,
      })
      console.log('webhook reauthorization success')
    }

    return
  }
  /**
   * Unsubscribe Webhook
   */
  public unsubscribeWebhook = async (subscriptionId: string) => {
    const res = await this.client.api(`/subscriptions/${subscriptionId}`).del()

    return res
  }

  public getNotificationContent = async (odataId: string) => {
    const res = await this.client.api(odataId).get()

    return res
  }

  private generateExpirationDate = () => {
    return moment.utc().add(20, 'minutes')
  }
}

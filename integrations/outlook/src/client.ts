import moment from 'moment'
import { randomBytes } from 'crypto'
import { Client, ResponseType } from '@microsoft/microsoft-graph-client'
import type {
  Subscription,
  Message as OutlookMessage,
  Event as OutlookEvent,
  ChangeNotification,
} from '@microsoft/microsoft-graph-types'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
import { ClientSecretCredential } from '@azure/identity'
import type { IntegrationContext } from '@botpress/sdk'

import type {
  SendEmailProps,
  SendMessageProps,
  OutputEvent,
  CreateEventProps,
} from './misc/custom-types'

import { processRecipients } from './utils'

export class GraphApi {
  private client: Client
  constructor(tenantId: string, clientId: string, clientSecret: string) {
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    )
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    })

    this.client = Client.initWithMiddleware({
      //debugLogging: true,
      authProvider,
    })
  }

  public sendEmail = async ({
    ctx,
    subject,
    type = 'Text',
    body = '',
    toRecipients,
    ccRecipients,
    bccRecipients,
  }: SendEmailProps): Promise<any> => {
    let toRecipientsArray = processRecipients(toRecipients)
    let ccRecipientsArray = processRecipients(ccRecipients)
    let bccRecipientsArray = processRecipients(bccRecipients)

    const sendMail = {
      message: {
        subject,
        body: {
          contentType: type,
          content: body,
        },
        toRecipients: toRecipientsArray.map((email) => ({
          emailAddress: { address: email },
        })),
        ccRecipients:
          ccRecipientsArray?.map((email) => ({
            emailAddress: { address: email },
          })) ?? [],
        bccRecipients:
          bccRecipientsArray?.map((email) => ({
            emailAddress: { address: email },
          })) ?? [],
      },
      saveToSentItems: 'false',
    }

    const res = await this.client
      .api(`/users/${ctx.configuration.emailAddress}/sendMail`)
      .post(sendMail)
    return res
  }

  public createEvent = async ({
    ctx,
    subject,
    body,
    start,
    end,
    location,
    attendees,
  }: CreateEventProps): Promise<OutputEvent> => {
    const event = {
      subject,
      body,
      start,
      end,
      location,
      attendees,
      allowNewTimeProposals: true,
      transactionId: randomBytes(16).toString('hex'),
    }

    const res = await this.client
      .api(`/users/${ctx.configuration.emailAddress}/events`)
      .post(event)
    return res
  }

  public replyLastMessage = async ({
    client: botpressClient,
    message,
    conversation,
    ctx,
    ack,
    body,
  }: SendMessageProps): Promise<void> => {
    const stateRes = await botpressClient.getState({
      id: conversation.id,
      name: 'lastMessageRef',
      type: 'conversation',
    })

    const { state } = stateRes
    const { lastMessageId } = state.payload

    if (!lastMessageId) {
      console.log('conv tag missing: outlook:lastMessageId')
      return
    }

    try {
      await this.client
        .api(
          `/users/${ctx.configuration.emailAddress}/messages/${lastMessageId}/replyAll`
        )
        .responseType(ResponseType.RAW)
        .post({
          message: {
            body,
          },
        })
      ack({ tags: { 'outlook:id': `${message.id}` } })
    } catch (error) {
      console.log((error as Error).message)
    }

    return
  }

  public subscribeWebhook = async (
    webhookUrl: string,
    ctx: IntegrationContext
  ): Promise<string> => {
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

  public listSubscriptions = async (): Promise<Subscription[]> => {
    const res = await this.client.api('/subscriptions').get()
    return res.value
  }

  public handleLifecycleEvents = async (event: ChangeNotification) => {
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

  public unsubscribeWebhook = async (subscriptionId: string): Promise<void> => {
    const res = await this.client.api(`/subscriptions/${subscriptionId}`).del()

    return res
  }

  public getNotificationContent = async (
    odataId: string
  ): Promise<OutlookMessage> => {
    const res = await this.client.api(odataId).get()
    return res
  }

  private generateExpirationDate = () => {
    return moment.utc().add(20, 'minutes')
  }
}

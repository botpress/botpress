import moment from 'moment'
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
    subject,
    type = 'Text',
    body,
    toRecipients,
    ccRecipients,
  }: SendEmailProps): Promise<any> => {
    let toRecipientsArray =
      typeof toRecipients === 'string' ? toRecipients.split(',') : toRecipients
    let ccRecipientsArray =
      typeof ccRecipients === 'string' ? ccRecipients?.split(',') : ccRecipients

    toRecipientsArray = toRecipientsArray.map((email) => email.trim())
    ccRecipientsArray = ccRecipientsArray?.map((email) => email.trim())

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
      },
      saveToSentItems: 'false',
    }

    const res = await this.client.api('/me/sendMail').post(sendMail)
    return res
  }

  public createEvent = async ({
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
    }

    const res = await this.client.api('/me/events').post(event)
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

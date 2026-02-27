import crypto from 'crypto'
import { RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'
import { ZoomClient } from '../client'
import { zoomWebhookSchema, TranscriptCompletedPayload } from '../types'
import { cleanVtt } from '../utils'

const handleTranscriptCompleted = async ({
  payload,
  config,
  client,
  logger,
}: {
  payload: TranscriptCompletedPayload
  config: bp.configuration.Configuration
  client: bp.Client
  logger: bp.Logger
}): Promise<{ status: number; body: string }> => {
  try {
    const allowedUserIds = config.allowedZoomUserIds
    const hostId = payload.payload.object.host_id

    if (!allowedUserIds.includes(hostId)) {
      return { status: 200, body: 'Event ignored: userId not allowed' }
    }

    const zoomClient = new ZoomClient(config, logger)
    const accessToken = await zoomClient.getAccessToken()
    const meetingUUID = payload.payload.object.uuid

    const response = await zoomClient.fetchTranscriptUrl(meetingUUID, accessToken)

    if (!response) {
      throw new RuntimeError('Transcript file not found after retries')
    }

    const { transcriptUrl, audioUrl } = response

    const { data: vttText } = await axios.get<string>(transcriptUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'text',
      timeout: 30000,
    })
    const plainText = cleanVtt(vttText)

    await client.createEvent({
      type: 'transcriptReceived',
      payload: {
        meetingUUID,
        hostId,
        transcript: plainText,
        audioUrl,
        rawVtt: vttText,
      },
    })

    logger.forBot().info(`Transcript processed successfully for meeting ${meetingUUID}`)
    return { status: 200, body: 'Transcript processed.' }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.forBot().error(`Transcript handler error: ${errorMsg}`)
    return { status: 500, body: `Zoom handler error: ${errorMsg}` }
  }
}

export const handler: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  const config = ctx.configuration

  try {
    const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const validation = zoomWebhookSchema.safeParse(parsed)
    if (!validation.success) {
      logger.forBot().error('Invalid webhook body format')
      return { status: 400, body: 'Invalid request body format' }
    }

    const webhookBody = validation.data

    if (webhookBody.event === 'endpoint.url_validation') {
      const plainToken = webhookBody.payload.plainToken
      const encryptedToken = crypto.createHmac('sha256', config.secretToken).update(plainToken).digest('hex')

      return {
        status: 200,
        body: JSON.stringify({ plainToken, encryptedToken }),
        headers: { 'Content-Type': 'application/json' },
      }
    }

    if (webhookBody.event === 'recording.transcript_completed') {
      return await handleTranscriptCompleted({ payload: webhookBody, config, client, logger })
    }

    return { status: 200, body: 'Event ignored.' }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    logger.forBot().error(`Webhook handler error: ${errorMsg}`)
    return { status: 400, body: 'Invalid request' }
  }
}

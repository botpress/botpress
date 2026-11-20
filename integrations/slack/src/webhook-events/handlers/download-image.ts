import { RuntimeError } from '@botpress/sdk'
import type { FileShareMessageEvent } from '@slack/types'
import axios from 'axios'
import { SlackClient } from '../../slack-api/slack-client'
import type * as bp from '.botpress'

type SlackFile = NonNullable<FileShareMessageEvent['files']>[number]

/** Cache per event so channel-and-thread delivery shares a single upload. */
export const createImageDownloader = ({
  client,
  ctx,
  logger,
}: {
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}) => {
  const downloads = new Map<string, Promise<string>>()
  let slackClient: Promise<SlackClient> | undefined

  const download = async (image: SlackFile): Promise<string> => {
    const url = image.url_private_download || image.url_private
    if (!url) {
      throw new RuntimeError('Incoming Slack image has no private download URL')
    }
    slackClient ??= SlackClient.createFromStates({ client, ctx, logger })
    const slack = await slackClient
    const expiryHours = ctx.configuration.downloadedMediaExpiry ?? 30 * 24
    const { file } = await client.upsertFile({
      key: `slack-image_${slack.getTeamId()}_${image.id}`,
      expiresAt: expiryHours === 0 ? undefined : new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
      contentType: image.mimetype,
      size: image.size,
      accessPolicies: ['public_content'],
      publicContentImmediatelyAccessible: true,
      tags: {
        source: 'integration',
        integration: 'slack',
        channel: 'channel',
        slackFileId: image.id,
      },
    })
    const stream = await slack.downloadFile(url)
    try {
      await axios.put(file.uploadUrl, stream, {
        headers: {
          'Content-Type': image.mimetype,
          'Content-Length': image.size,
          'x-amz-tagging': 'public=true',
        },
        maxBodyLength: image.size,
      })
    } catch {
      stream.destroy()
      throw new RuntimeError('Failed to upload incoming Slack image to the Files API')
    }
    return file.url
  }

  return (image: SlackFile): Promise<string | undefined> => {
    if (ctx.configuration.downloadMedia === false) {
      return Promise.resolve(image.permalink_public)
    }
    let result = downloads.get(image.id)
    if (!result) {
      result = download(image)
      downloads.set(image.id, result)
    }
    return result
  }
}

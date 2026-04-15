import { RuntimeError } from '@botpress/sdk'
import { getHitlClient } from './client'
import * as bp from '.botpress'

type Attachment = {
  url: string
  name: string
  fileUsageType: 'IMAGE' | 'AUDIO' | 'VOICE_RECORDING' | 'STICKER' | 'OTHER'
}

async function _sendMessage(props: bp.AnyMessageProps, text: string, attachment?: Attachment): Promise<void> {
  const { ctx, client, logger, conversation } = props
  const { userId, integrationThreadId, inboxId } = conversation.tags

  if (!userId) {
    throw new RuntimeError('Missing userId in conversation tags')
  }
  if (!integrationThreadId) {
    throw new RuntimeError('Missing integrationThreadId in conversation tags')
  }
  if (!inboxId) {
    throw new RuntimeError('Missing inboxId in conversation tags')
  }

  const {
    state: { payload: userInfo },
  } = await client.getState({ id: userId, name: 'hitlUserInfo', type: 'user' })

  if (!userInfo?.contactIdentifier) {
    throw new RuntimeError('User identifier not found in hitlUserInfo state')
  }

  const {
    state: { payload: channelInfo },
  } = await client.getState({ id: ctx.integrationId, name: 'hitlConfig', type: 'integration' })

  const channelAccountId = channelInfo?.channelAccounts?.[inboxId]
  if (!channelAccountId) {
    throw new RuntimeError(`No channel account found for inbox ${inboxId}`)
  }

  await getHitlClient(ctx, client, logger).sendMessage(
    text,
    userInfo.name,
    userInfo.contactIdentifier,
    integrationThreadId,
    channelInfo.channelId,
    channelAccountId,
    attachment
  )
}

export const channels: bp.IntegrationProps['channels'] = {
  hitl: {
    messages: {
      text: async (props) => {
        await _sendMessage(props, props.payload.text)
      },
      image: async (props) => {
        await _sendMessage(props, '', {
          url: props.payload.imageUrl,
          name: props.payload.title ?? 'image',
          fileUsageType: 'IMAGE',
        })
      },
      file: async (props) => {
        await _sendMessage(props, '', {
          url: props.payload.fileUrl,
          name: props.payload.title ?? 'file',
          fileUsageType: 'OTHER',
        })
      },
      audio: async (props) => {
        await _sendMessage(props, '', {
          url: props.payload.audioUrl,
          name: props.payload.title ?? 'audio',
          fileUsageType: 'AUDIO',
        })
      },
      video: async (props) => {
        props.logger.forBot().debug('Forwarding video as file attachment (HubSpot has no native video type)')
        await _sendMessage(props, '', {
          url: props.payload.videoUrl,
          name: props.payload.title ?? 'video',
          fileUsageType: 'OTHER',
        })
      },
      bloc: async (props) => {
        for (const item of props.payload.items) {
          switch (item.type) {
            case 'text':
            case 'markdown':
              await _sendMessage(props, item.type === 'text' ? item.payload.text : item.payload.markdown)
              break
            case 'image':
              await _sendMessage(props, '', {
                url: item.payload.imageUrl,
                name: item.payload.title ?? 'image',
                fileUsageType: 'IMAGE',
              })
              break
            case 'audio':
              await _sendMessage(props, '', {
                url: item.payload.audioUrl,
                name: item.payload.title ?? 'audio',
                fileUsageType: 'AUDIO',
              })
              break
            case 'video':
              await _sendMessage(props, '', {
                url: item.payload.videoUrl,
                name: item.payload.title ?? 'video',
                fileUsageType: 'OTHER',
              })
              break
            case 'file':
              await _sendMessage(props, '', {
                url: item.payload.fileUrl,
                name: item.payload.title ?? 'file',
                fileUsageType: 'OTHER',
              })
              break
            case 'location':
              props.logger.forBot().warn('Location items in bloc messages are not supported in HubSpot HITL — skipping')
              break
          }
        }
      },
    },
  },
}

const messenger: ChannelMeta = {
  v0: {
    fields: [
      'accessToken',
      'appSecret',
      'verifyToken',
      // string array
      'disabledActions',
      'greeting',
      'getStarted',
      // complex object
      'persistenMenu'
    ]
  }
}

const slack: ChannelMeta = {
  v0: {
    fields: [
      'botToken',
      'signingSecret',
      // boolean
      'useRTM'
    ],
    webhooks: ['interactive', 'events']
  }
}

const smooch: ChannelMeta = {
  v0: {
    fields: [
      'keyId',
      'secret',
      // string array
      'forwardRawPayloads'
    ]
  }
}

const teams: ChannelMeta = {
  v0: {
    fields: [
      'appId',
      'appPassword',
      'tenantId',
      // object
      'proactiveMessages'
    ]
  }
}

const telegram: ChannelMeta = {
  v0: {
    fields: ['botToken']
  }
}

const twilio: ChannelMeta = {
  v0: {
    fields: ['accountSID', 'authToken']
  }
}

const vonage: ChannelMeta = {
  v0: {
    fields: ['apiKey', 'apiSecret', 'signatureSecret', 'applicationId', 'privateKey', 'useTestingApi'],
    webhooks: ['inbound', 'status']
  }
}

type ChannelMeta = {
  [version in ChannelVersion]?: ChannelVersionMeta
}

export interface ChannelVersionMeta {
  fields: string[]
  webhooks?: string[]
}

type ChannelVersion = 'v0' | 'v1'

export const CHANNELS: { [channel: string]: ChannelMeta } = {
  messenger,
  slack,
  smooch,
  teams,
  telegram,
  twilio,
  vonage
}

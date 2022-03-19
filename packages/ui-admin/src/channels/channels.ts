export const CHANNELS = {
  messenger: {
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
  },
  slack: {
    v0: {
      fields: [
        'botToken',
        'signingSecret',
        // boolean
        'useRTM'
      ]
    }
  },
  smooch: {
    v0: {
      fields: [
        'keyId',
        'secret',
        // string array
        'forwardRawPayloads'
      ]
    }
  },
  teams: {
    v0: {
      fields: [
        'appId',
        'appPassword',
        'tenantId',
        // object
        'proactiveMessages'
      ]
    }
  },
  telegram: {
    v0: {
      fields: ['botToken']
    }
  },
  twilio: {
    v0: {
      fields: ['accountSID', 'authToken']
    }
  },
  vonage: {
    v0: {
      fields: ['apiKey', 'apiSecret', 'signatureSecret', 'applicationId', 'privateKey', 'useTestingApi']
    }
  }
}

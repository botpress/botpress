import { z, IntegrationDefinition } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'plus/zoom',
  version: '3.1.1',
  title: 'Zoom',
  description: 'Receives Zoom webhook and processes transcript for meetings.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      zoomAccountId: z.string().describe('Zoom Account ID (Found on Zoom OAuth App under App Credentials)'),
      zoomClientId: z.string().describe('Zoom Client ID (Found on Zoom OAuth App under App Credentials)'),
      zoomClientSecret: z.string().describe('Zoom Client Secret (Found on Zoom OAuth App under App Credentials)'),
      secretToken: z.string().describe('Secret Token (Found on Zoom OAuth App under Features)'),
      allowedZoomUserIds: z.array(z.string()).describe('Process events from these Zoom User IDs'),
    }),
  },

  channels: {},

  events: {
    transcriptReceived: {
      title: 'Transcript Received',
      description: 'Fires when a transcript is received from Zoom',
      schema: z.object({
        meetingUUID: z.string(),
        hostId: z.string(),
        transcript: z.string(),
        audioUrl: z.string(),
        rawVtt: z.string().optional(),
      }),
    },
  },
})

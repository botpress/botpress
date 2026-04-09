import { z, IntegrationDefinition } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'zoom',
  version: '0.1.0',
  title: 'Zoom',
  description: 'Receives Zoom webhook and processes transcript for meetings.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      zoomAccountId: z
        .string()
        .title('Zoom Account ID')
        .describe('Zoom Account ID (Found on Zoom OAuth App under App Credentials)'),
      zoomClientId: z
        .string()
        .title('Zoom Client ID')
        .describe('Zoom Client ID (Found on Zoom OAuth App under App Credentials)'),
      zoomClientSecret: z
        .string()
        .title('Zoom Client Secret')
        .describe('Zoom Client Secret (Found on Zoom OAuth App under App Credentials)'),
      secretToken: z.string().title('Secret Token').describe('Secret Token (Found on Zoom OAuth App under Features)'),
      allowedZoomUserIds: z
        .array(z.string())
        .title('Allowed Zoom User IDs')
        .describe('Process events from these Zoom User IDs'),
    }),
  },
  channels: {},
  events: {
    transcriptReceived: {
      title: 'Transcript Received',
      description: 'Fires when a transcript is received from Zoom',
      schema: z.object({
        meetingUUID: z.string().title('Meeting UUID').describe('The UUID of the Zoom meeting'),
        hostId: z.string().title('Host ID').describe('The ID of the host'),
        transcript: z.string().title('Transcript').describe('The transcript of the meeting'),
        audioUrl: z.string().title('Audio URL').describe('The URL of the meeting audio'),
        rawVtt: z.string().title('Raw VTT').describe('The raw VTT file content of the meeting transcript').optional(),
      }),
    },
  },
})

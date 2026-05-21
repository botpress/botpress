import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const getAlertRule = {
  title: 'Get Alert Rule',
  description: 'Get a Grafana alert rule by UID',
  input: {
    schema: z.object({
      uid: z.string().title('UID').describe('UID of the alert rule to retrieve'),
    }),
  },
  output: {
    schema: z.object({
      uid: z.string().optional().title('UID').describe('Alert rule UID'),
      title: z.string().optional().title('Title').describe('Alert rule name'),
      ruleGroup: z.string().optional().title('Rule Group').describe('Rule group this alert belongs to'),
      folderUID: z.string().optional().title('Folder UID').describe('UID of the containing folder'),
      labels: z.record(z.string()).optional().title('Labels').describe('Key-value labels on the alert rule'),
    }),
  },
} satisfies ActionDef

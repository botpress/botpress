import { IntegrationDefinition, z } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'
import { integrationName } from './package.json'
const { text } = sdk.messages.defaults

export default new IntegrationDefinition({
  name: integrationName,
  title: 'My Integration',
  description: 'This is a description of my integration',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      fieldName: z.string().title('Field Name').describe('The name of the configuration field'),
      secretField: z.string().secret().optional().title('Secret Field').describe('The name of the secret field'),
    }),
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
      required: true,
    },
  },
  identifier: {
    extractScript: 'extract.vrl',
  },
  configurations: {
    alternateConfigName: {
      title: 'Manual configuration',
      description: 'Configure the integration manually',
      schema: z.object({
        fieldName: z.string().title('Field Name').describe('The name of the configuration field'),
      }),
    },
  },
  actions: {
    exampleAction: {
      input: {
        schema: z.object({
          inputPropName: z.string().title('Property Name').describe('The name of the input property'),
        }),
      },
      output: {
        schema: z.object({
          outputPropName: z.string().title('Property Name').describe('The name of the output property'),
        }),
      },
    },
  },
  channels: {
    exampleChannel: {
      messages: {
        text,
      },
      message: {
        tags: {
          exampleTag: {
            title: 'Example Tag',
            description: 'This is an example tag',
          },
        },
      },
    },
  },
  events: {
    exampleEvent: {
      title: 'Example Event',
      description: 'This is an example event',
      schema: z.object({
        propName: z.string().title('Property Name').describe('The name of the property'),
      }),
    },
  },
  secrets: {
    SECRET_NAME: {
      description: 'This is a very important secret',
    },
  },
  states: {
    stateName: {
      type: 'integration',
      schema: z.object({
        propName: z.string().title('Property Name').describe('The name of the property'),
      }),
    },
  },
})

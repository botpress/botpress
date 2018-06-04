const r = 'r'
const w = 'w'

export const RESOURCES = [
  {
    name: '*',
    description: 'All resources, at once',
    operations: [r, w]
  },
  {
    name: 'modules',
    description: 'Bot extensions, such as NLU or HITL',
    children: [
      {
        name: 'list',
        description: 'The list of the installed modules',
        operations: [r]
      },
      {
        name: 'list.community',
        description: 'The list of the publicly available modules',
        operations: [r]
      }
    ]
  },
  {
    name: 'middleware',
    description: 'Installed bot middlewares',
    children: [
      {
        name: 'list',
        description: 'Get the list of the installed middlewares',
        operations: [r]
      },
      {
        name: 'customizations',
        description: 'Change the order of the middlewares and their enabled/disabled state',
        operations: [w]
      }
    ]
  },
  {
    name: 'notifications',
    description: 'Bot notifications, such as runtime errors',
    operations: [r]
  },
  {
    name: 'bot',
    description: 'Bot properties, such as content, flows etc.',
    children: [
      {
        name: 'information',
        description: 'General bot details',
        operations: [r]
      },
      {
        name: 'information.license',
        description: 'Bot license',
        operations: [w]
      },
      {
        name: 'logs',
        description: 'Bot logs',
        operations: [r]
      },
      {
        name: 'logs.archive',
        description: 'Bot archived logs',
        operations: [r]
      },
      {
        name: 'content',
        description: 'Bot content items',
        operations: [r, w]
      },
      {
        name: 'ghost_content',
        description:
          'The majority of bot content, such as content and flows, is ghost-managed, i.e. synced from the server to the bot source code',
        operations: [r, w]
      },
      {
        name: 'media',
        description: 'Bot file uploads',
        operations: [w]
      },
      {
        name: 'flows',
        description: 'Bot flows, i.e. its logic described as flow diagram',
        operations: [r, w]
      },
      {
        name: 'skills',
        description: 'Bot flow skill nodes',
        operations: [w]
      }
    ]
  }
]

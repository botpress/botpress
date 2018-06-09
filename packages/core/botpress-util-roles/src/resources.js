const r = 'r'
const w = 'w'

const _enrichResources = (resources, parent) => {
  if (!resources) {
    return resources
  }

  return resources.map(res => {
    const fullName = parent != null ? `${parent}.${res.name}` : res.name
    return {
      ...res,
      displayName: res.name,
      name: fullName,
      children: _enrichResources(res.children, fullName)
    }
  })
}

export const enrichResources = resources => _enrichResources(resources)

const _RESOURCES = [
  {
    name: '*',
    description: 'All resources, at once. Use with caution',
    operations: [r, w]
  },
  {
    name: 'bot',
    description: 'Bot properties, such as content, flows etc.',
    children: [
      {
        name: '*',
        description: 'All bot properties',
        operations: [r, w]
      },
      {
        name: 'notifications',
        description: 'Bot notifications, such as runtime errors',
        operations: [r]
      },
      {
        name: 'modules.*',
        description: 'Bot extensions, such as NLU or HITL',
        operations: [r]
      },
      {
        name: 'middleware.*',
        description: 'All middleware operations',
        operations: [r, w]
      },
      {
        name: 'middleware.list',
        description: 'Get the list of the installed middlewares',
        operations: [r]
      },
      {
        name: 'middleware.customizations',
        description: 'Change the order of the middlewares and their enabled/disabled state',
        operations: [w]
      },
      {
        name: 'modules.list',
        description: 'The list of the installed modules',
        operations: [r]
      },
      {
        name: 'modules.list.community',
        description: 'The list of the publicly available modules',
        operations: [r]
      },
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
].sort((a, b) => a.name.localeCompare(b.name))

export const RESOURCES = enrichResources(_RESOURCES)

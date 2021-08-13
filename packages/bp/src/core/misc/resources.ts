export type Operation = 'r' | 'w'

const r: Operation = 'r'
const w: Operation = 'w'

export interface Resource {
  name: string
  displayName?: string
  description?: string
  operations?: Operation[]
  children?: Resource[]
}

const _enrichResources = (resources: Resource[] | undefined, parent?: string): Resource[] | undefined => {
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
    } as Resource
  })
}

export const enrichResources = (resources: Resource[]) => _enrichResources(resources)

const _RESOURCES: Resource[] = [
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

export const RESOURCES = enrichResources(_RESOURCES)!

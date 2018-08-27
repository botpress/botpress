import { enrichResources, RESOURCES } from '@botpress/util-roles'

const r = 'r'
const w = 'w'

export interface CloudResource {
  name: string
  description?: string
  children?: {
    name: string
    description: string
    operations: string[]
  }[]
}

const CLOUD_RESOURCES: CloudResource[] = [
  {
    name: 'cloud',
    description: 'Botpress Cloud permissions',
    children: [
      {
        name: '*',
        description: 'Full cloud permissions',
        operations: [r, w]
      },
      {
        name: 'team.roles',
        description: 'Manage team roles',
        operations: [r, w]
      },
      {
        name: 'team.owner',
        description: 'Change team ownership',
        operations: [w]
      },
      {
        name: 'team.members',
        description: "Manage team membership and members' roles",
        operations: [r, w]
      },
      {
        name: 'team.bots',
        description: 'Manage team bots',
        operations: [r, w]
      }
    ]
  }
]

export default enrichResources(CLOUD_RESOURCES)
  .concat(RESOURCES)
  .sort((a, b) => a.name.localeCompare(b.name)) as CloudResource[]

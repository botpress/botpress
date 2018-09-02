import { enrichResources, RESOURCES } from '@botpress/util-roles'

const r = 'r'
const w = 'w'

export interface AuthResource {
  name: string
  description?: string
  children?: {
    name: string
    description: string
    operations: string[]
  }[]
}

const ADMIN_RESOURCES: AuthResource[] = [
  {
    name: 'admin',
    description: 'Botpress Admin permissions',
    children: [
      {
        name: '*',
        description: 'Full Admin permissions',
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

export default enrichResources(ADMIN_RESOURCES)
  .concat(RESOURCES as AuthResource[])
  .sort((a, b) => a.name.localeCompare(b.name)) as AuthResource[]

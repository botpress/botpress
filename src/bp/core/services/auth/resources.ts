import { enrichResources, RESOURCES, Resource } from 'bp/core/misc/auth'

const r = 'r'
const w = 'w'

const ADMIN_RESOURCES: Resource[] = [
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

export default enrichResources(ADMIN_RESOURCES)!
  .concat(RESOURCES)
  .sort((a, b) => a.name.localeCompare(b.name))

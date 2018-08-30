import { AuthRole } from '../../misc/interfaces'

const roles: Array<AuthRole> = [
  {
    name: 'owner',
    description: 'Team owner',
    rules: [
      {
        res: '*',
        op: '+r+w'
      }
    ]
  },
  {
    name: 'admin',
    description: 'Team admin',
    rules: [
      {
        res: '*',
        op: '+r+w'
      }
    ]
  },
  {
    name: 'default',
    description: 'Default member role',
    rules: [{ res: '*', op: '+r+w' }, { res: 'admin.*', op: '+r-w' }]
  }
]

export default roles

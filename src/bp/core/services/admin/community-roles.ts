import { AuthRole } from 'core/misc/interfaces'

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
  }
]

export default roles

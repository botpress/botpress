import _ from 'lodash'

import { NotFoundError } from '~/errors'

const debug = require('debug')('svc:user')

export default ({ config, db }) => {
  async function getUserByUsername(username) {
    const user = await db.models.user.findOne({ where: { username } })

    if (!user) {
      throw new NotFoundError("This user doesn't exist")
    }

    return user.toJSON()
  }

  return {
    getUserByUsername
  }
}

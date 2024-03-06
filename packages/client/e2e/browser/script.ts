import { Client, errorFrom } from '../../src'
import * as consts from '../consts'
import * as utils from '../utils'

const exit = (code: 0 | 1) => {
  if (code === 0) {
    console.log(consts.successMessage)
  } else {
    console.log(consts.failureMessage)
  }
}

const main = async () => {
  const client = new Client()
  await client
    .getAccount()
    .then(() => {
      throw new Error('Expected to reject')
    })
    .catch((err) => {
      utils.expect(errorFrom(err).type).toBe('Unauthorized')
    })
}

void main()
  .then(() => {
    exit(0)
  })
  .catch((err) => {
    console.error(err)
    exit(1)
  })

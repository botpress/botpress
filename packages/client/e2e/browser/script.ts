/* eslint-disable no-console */
import { Client, errorFrom } from '../../src'
import * as consts from '../consts'

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
      if (errorFrom(err).type !== 'Unauthorized') {
        throw Error()
      }
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

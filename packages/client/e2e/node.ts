import { Client, errorFrom } from '../src'
import * as utils from './utils'

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
    console.error('Node Done')
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

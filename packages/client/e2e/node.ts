import { Client, errorFrom } from '../src'
import * as utils from './utils'

const main = async () => {
  const client = new Client()
  await client.getAccount()
}

try {
  main().catch(err => {
    utils.expect(errorFrom(err).type).toBe('Unauthorized')
    process.exit(0)
  })
} catch (err) {
  console.error(err)
  process.exit(1)
}

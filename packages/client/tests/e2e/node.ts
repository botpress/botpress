import { Client, errorFrom } from '../../src'

const main = async () => {
  const client = new Client()
  await client
    .getAccount({})
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
    console.error('Node Done')
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

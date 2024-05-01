import { describe, it } from 'vitest'
import { GetFileResponse } from '../../dist/gen'

/**
 * This a test to be run manually to test the custom file creation/upload method added in the client.
 *
 * Follow these steps to run it:
 *   1. Run Tilt on the Skynet repository using the `full` mode. If you want to use the leaner `files-api` mode then you'll need to comment out the `USAGE_BASE_URL` env var and pass a `DEV_BYPASS_USAGE_CHECKS: 'true'` env var to the `files-api` Tilt resource so that we can use the predefined bot ID below.
 *   2. Run `pnpm build` in the `packages/client` directory.
 *   3. Then run `pnpm test:manual` to run this script.
 */
const { Client } = require('../../dist/index.cjs')

describe('createAndUploadFile', () => {
  it('works as expected', async () => {
    const client = new Client({
      apiUrl: 'http://localhost:5986',
      botId: '87e67c78-e5d3-4cf7-97de-82b1f3907879',
      token: 'bp_pat_abcdefghijklmnopqrstuvwxyz0123456789',
    })

    const response = await client.createAndUploadFile({
      name: 'test.txt',
      data: Buffer.from('aaa'),
    })

    console.debug('GetFileResponse:', response, '\n')
  })
})

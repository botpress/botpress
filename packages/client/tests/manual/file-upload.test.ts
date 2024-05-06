import { describe, expect, it } from 'vitest'

/**
 * This a test to be run manually to test the custom file creation/upload method added in the client.
 *
 * Follow these steps to run it:
 *   1. Run Tilt on the Skynet repository using the `files-api` mode and make sure a "DEV_BYPASS_USAGE_CHECKS" env var with a string value of "true" is passed to the `files-api` Tilt resource so that we can use the predefined bot ID below.
 *   2. Then run `pnpm test:manual` in the terminal to run this test.
 */
import { Client } from '../../src'

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

    expect(response.file.name).toBe('test.txt')
    expect(response.file.status).toBe('UPLOAD_COMPLETED')
    expect(response.file.url, 'File URL should have been returned').toBeTruthy()
  })
})

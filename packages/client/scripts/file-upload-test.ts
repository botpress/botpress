/**
 * This script is meant to be used as a manual test for the custom file creation/upload method added in the client.
 *
 * To test, follow these steps:
 *   1. Run Tilt on the Skynet repository using the `full` mode. If you want to use the leaner `files-api` mode then you'll need to comment out the `USAGE_BASE_URL` environment variable passed to the `files-api` Tilt resource.
 *   2. Run `pnpm build` in the `packages/client` directory.
 *   3. Then run `npx ts-node scripts/file-upload-test.ts` to run this script.
 */
const { Client } = require('../dist/index.cjs')

const client = new Client({
  apiUrl: 'http://localhost:5986',
  botId: '87e67c78-e5d3-4cf7-97de-82b1f3907879',
  token: 'bp_pat_abcdefghijklmnopqrstuvwxyz0123456789',
})

void (async function () {
  const { file } = await client.createAndUploadFile({
    name: 'test.txt',
    data: Buffer.from('aaa'),
  })

  console.info('FILE UPLOADED SUCCESSFULLY:', file)
})()

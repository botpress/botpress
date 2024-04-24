/**
 * This script is meant to be used as a manual test for the custom file creation/upload method added in the client.
 *
 * To test, follow these steps:
 *   1. Run Tilt on the Skynet repository using the `files-api` mode. Make sure `USAGE_BASE_URL` is commented out in the `files-api` Tilt resource otherwise you'll need to create a workspace and a bot and change the bot ID below.
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

import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

export default async (bp: typeof sdk) => {
  const models = await bp.ghost.forGlobal().directoryListing('./models', '*.vec')
  const pretrainedPath = path.join(__dirname, 'pretrained')
  const files = fs.readdirSync(pretrainedPath)
  const globalGhost = bp.ghost.forGlobal()
  const missing = _.without(files, ...models)

  for (const model of missing) {
    const data = fs.readFileSync(path.join(pretrainedPath, model))
    await globalGhost.upsertFile('./models', model, data)
    bp.logger.debug(`Copied pretrained model "${model}"`)
  }
}

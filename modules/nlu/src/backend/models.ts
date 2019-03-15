import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

const debug = DEBUG('nlu').sub('pretrained')

export default async (bp: typeof sdk) => {
  const models = await bp.ghost.forGlobal().directoryListing('./models', '*.vec')
  const pretrainedPath = path.join(__dirname, 'pretrained')
  const files = fs.readdirSync(pretrainedPath).filter(x => x.toLowerCase().endsWith('.vec'))
  const globalGhost = bp.ghost.forGlobal()
  const missing = _.without(files, ...models)

  debug('start copying missing pretrained models', missing)
  for (const model of missing) {
    const data = fs.readFileSync(path.join(pretrainedPath, model))
    await globalGhost.upsertFile('./models', model, data)
  }
  debug('end copy missing pretrained models')
}

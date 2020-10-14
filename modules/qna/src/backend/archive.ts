import * as sdk from 'botpress/sdk'
import fse from 'fs-extra'
import _ from 'lodash'
import mkdirp from 'mkdirp'
import path from 'path'
import tar from 'tar'
import tmp from 'tmp'

import { ImportArgs } from './api'
import { Intent } from './qna'
import { QnASchemaArray } from './validation'

const FLOW_FOLDER = 'flows'
const MEDIA_FOLDER = 'media'
const TEMP_INTENT_FILENAME = 'exportable.qna.intents.json'
const INTENT_FILENAME = 'qna.intents.json'
const QNA_PATH_TO_ZIP = path.join(FLOW_FOLDER, TEMP_INTENT_FILENAME)

const toZipFile = topicName => `${topicName}.qna.tar.gz`
const serialize = (intents: Intent[]) => JSON.stringify(intents, undefined, 2)

const keepEndPath = path =>
  path
    .split('/')
    .slice(-2)
    .join('/')

const removeBotPrefix = (c: sdk.Content.All) => {
  if ((c as sdk.Content.Carousel).items) {
    const carousel = c as sdk.Content.Carousel
    return {
      ...carousel,
      items: carousel.items.map(o => {
        return { ...o, image: keepEndPath(o.image) }
      })
    }
  } else if ((c as sdk.Content.Card | sdk.Content.Image).image) {
    const image = c as sdk.Content.Image | sdk.Content.Card
    return {
      ...image,
      image: keepEndPath(image.image)
    }
  } else {
    return c
  }
}

const addBotPath = (file, botId) => path.join(`/api/v1/bots/${botId}`, file)
const addBotPrefix = (c: sdk.Content.All, botId: string) => {
  if ((c as sdk.Content.Carousel).items) {
    const carousel = c as sdk.Content.Carousel
    return {
      ...carousel,
      items: carousel.items.map(o => {
        return { ...o, image: addBotPath(o.image, botId) }
      })
    }
  } else if ((c as sdk.Content.Card | sdk.Content.Image).image) {
    const image = c as sdk.Content.Image | sdk.Content.Card
    return { ...image, image: addBotPath(image.image, botId) }
  } else {
    return c
  }
}

export const exportQuestionsToArchive = async (intents: Intent[], topicName: string, ghost: sdk.ScopedGhostService) => {
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })
  const zipName = path.join(tmpDir.name, toZipFile(topicName))

  await mkdirp.sync(path.join(tmpDir.name, MEDIA_FOLDER))

  const jsonQnaBotAgnostic = intents.map(i => {
    const contentAnswers = [...(i.metadata?.contentAnswers ?? [])].map((c: sdk.Content.All) => removeBotPrefix(c))
    const metadata = { ...i.metadata, contentAnswers }
    return { ...i, metadata }
  })

  const medias = _.chain(jsonQnaBotAgnostic)
    .flatMapDeep(item => item.metadata?.contentAnswers ?? [])
    .flatMap(c => {
      if ((c as sdk.Content.Carousel).items) {
        const carousel = c as sdk.Content.Carousel
        return carousel.items
      } else {
        return [c]
      }
    })
    .map(c => _.get(c, 'image', undefined))
    .filter(c => c)
    .value()

  await mkdirp.sync(path.join(tmpDir.name, path.dirname(QNA_PATH_TO_ZIP)))
  await fse.writeFile(path.join(tmpDir.name, QNA_PATH_TO_ZIP), Buffer.from(serialize(jsonQnaBotAgnostic)))
  await Promise.all(
    medias.map(
      async mediaFile =>
        await fse.writeFile(path.resolve(tmpDir.name, mediaFile), await ghost.readFileAsBuffer('/', mediaFile))
    )
  )

  await tar.create({ cwd: tmpDir.name, file: zipName, portable: true, gzip: true }, [...medias, QNA_PATH_TO_ZIP])
  const zipBuffer = await fse.readFile(zipName)
  tmp.setGracefulCleanup()
  return zipBuffer
}

const getIntentsFromArchive = async (importArgs: ImportArgs) => {
  const { topicName, botId, zipFile } = importArgs
  const fileName = toZipFile(topicName || 'questions')

  const tmpDir = tmp.dirSync({ unsafeCleanup: true })
  await fse.writeFile(path.join(tmpDir.name, fileName), zipFile)
  await tar.extract({ cwd: tmpDir.name, file: path.join(tmpDir.name, fileName) })

  let qnasBotAgnostic: Intent[] = JSON.parse(
    await fse.readFile(path.join(tmpDir.name, FLOW_FOLDER, TEMP_INTENT_FILENAME), 'utf8')
  )
  qnasBotAgnostic = await QnASchemaArray.validate(qnasBotAgnostic)

  const intents: Intent[] = qnasBotAgnostic.map(i => {
    const contexts = topicName ? [topicName] : i.contexts
    return {
      ...i,
      contexts,
      filename: path.join(contexts[0], INTENT_FILENAME),
      metadata: { ...i.metadata, contentAnswers: [...i.metadata.contentAnswers].map(c => addBotPrefix(c, botId)) }
    }
  })

  return { dirName: tmpDir.name, intents }
}

const moveMediaFromArchive = async (dirName: string, ghost: sdk.ScopedGhostService) => {
  if (await fse.pathExists(path.join(dirName, MEDIA_FOLDER))) {
    for (const mediaFile of await fse.readdir(path.join(dirName, MEDIA_FOLDER))) {
      await ghost.upsertFile(MEDIA_FOLDER, mediaFile, await fse.readFile(path.join(dirName, MEDIA_FOLDER, mediaFile)))
    }
  }
}

export const importSingleArchive = async (importArgs: ImportArgs, ghost: sdk.ScopedGhostService) => {
  const { intents, dirName } = await getIntentsFromArchive(importArgs)

  const qnaByContext = {}

  intents.forEach(entry => {
    const firstContext = entry.contexts?.[0] ?? 'global'

    if (qnaByContext[firstContext]) {
      qnaByContext[firstContext].push(entry)
    } else {
      qnaByContext[firstContext] = [entry]
    }
  })

  for (const context of Object.keys(qnaByContext)) {
    const filename = `${context}/qna.intents.json`
    await ghost.upsertFile(FLOW_FOLDER, filename, serialize(qnaByContext[context]))
  }

  return moveMediaFromArchive(dirName, ghost)
}

export const importArchivePerTopic = async (importArgs: ImportArgs, ghost: sdk.ScopedGhostService) => {
  const { topicName } = importArgs
  const { intents, dirName } = await getIntentsFromArchive(importArgs)

  await ghost.upsertFile(FLOW_FOLDER, path.join(topicName, INTENT_FILENAME), serialize(intents))

  return moveMediaFromArchive(dirName, ghost)
}

import * as sdk from 'botpress/sdk'
import { validate } from 'joi'
import _ from 'lodash'

import { QnaEntry, QnaItem } from './qna'
import Storage from './storage'
import { QnaItemArraySchema, QnaItemCmsArraySchema } from './validation'

const debug = DEBUG('qna:import')

type ContentData = Pick<sdk.ContentElement, 'id' | 'contentType' | 'formData'>

interface ImportData {
  questions?: QnaItem[]
  content?: ContentData[]
}

export const prepareImport = async (parsedJson: any): Promise<ImportData> => {
  try {
    const result = (await validate(parsedJson, QnaItemCmsArraySchema)) as {
      contentElements: ContentData[]
      qnas: QnaItem[]
    }
    return { questions: result.qnas, content: result.contentElements }
  } catch (err) {
    debug("New format doesn't match provided file %o", { err })
  }

  try {
    const result = (await validate(parsedJson, QnaItemArraySchema)) as QnaItem[]
    return { questions: result, content: undefined }
  } catch (err) {
    debug("Old format doesn't match provided file %o", { err })
  }

  return {}
}

export const importQuestions = async (data: ImportData, storage, bp, statusCallback, uploadStatusId) => {
  statusCallback(uploadStatusId, 'Calculating diff with existing questions')

  const { questions, content } = data
  if (!questions) {
    return
  }

  if (content) {
    for (const element of content) {
      await bp.cms.createOrUpdateContentElement(storage.botId, element.contentType, element.formData, element.id)
    }
  }

  const existingQnaIds = (await (storage as Storage).fetchQNAs()).map(item => item.id)

  for (const qnaItem of questions) {
    qnaItem.data.enabled = true
  }

  let questionsSavedCount = 0
  return Promise.each(questions, async (qnaItem: QnaItem & { data: { category?: string } }) => {
    const { data, id } = qnaItem

    // Support for previous QnA
    if (data.category) {
      data.contexts = [data.category]
      delete data.category
    }

    if (existingQnaIds.includes(id)) {
      await (storage as Storage).update(data, id)
    } else {
      await (storage as Storage).insert(data)
    }

    questionsSavedCount += 1
    statusCallback(
      uploadStatusId,
      `Saved ${questionsSavedCount}/${questions.length} question${questions.length === 1 ? '' : 's'}`
    )
  })
}

export const prepareExport = async (storage: Storage, bp: typeof sdk) => {
  const qnas = await storage.fetchQNAs()
  const contentElementIds = await storage.getAllContentElementIds()

  const contentElements = await Promise.mapSeries(contentElementIds, async id => {
    const data = await bp.cms.getContentElement(storage.botId, id.replace('#!', ''))
    return _.pick(data, ['id', 'contentType', 'formData', 'previews'])
  })

  return JSON.stringify({ qnas, contentElements }, undefined, 2)
}
